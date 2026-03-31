import crypto from 'crypto';
import { prisma } from '../config/db.js';
import AppError from '../utils/AppError.js';

const GITHUB_API_BASE = 'https://api.github.com';

const _toBigInt = (value, fieldName) => {
  try {
    return BigInt(value);
  } catch {
    throw new AppError(`${fieldName} must be a valid integer value.`, 400, 'VALIDATION_ERROR');
  }
};

const _hasManagePermission = (permissions, scope) => {
  if (!permissions || typeof permissions !== 'object') {
    return false;
  }

  if (permissions.all === true || permissions.manage === true) {
    return true;
  }

  const scoped = permissions[scope];
  if (!scoped || typeof scoped !== 'object') {
    return false;
  }

  return scoped.all === true || scoped.manage === true;
};

const _getProjectMembership = async (projectId, userId) => {
  return prisma.projectMember.findFirst({
    where: {
      projectId,
      userId,
      removedAt: null,
    },
    select: {
      id: true,
      role: {
        select: {
          permissions: true,
        },
      },
    },
  });
};

const _assertProjectMemberAccess = async ({ projectId, userId, orgRole }) => {
  if (['owner', 'admin'].includes(orgRole)) {
    return;
  }

  const projectMembership = await _getProjectMembership(projectId, userId);

  if (!projectMembership) {
    throw new AppError('You do not have access to this project.', 403, 'PROJECT_ACCESS_DENIED');
  }
};

const _assertCanManageProjectGithub = async ({ projectId, userId, orgRole }) => {
  if (['owner', 'admin'].includes(orgRole)) {
    return;
  }

  const projectMembership = await _getProjectMembership(projectId, userId);

  const canManage = _hasManagePermission(projectMembership?.role?.permissions, 'project')
    || _hasManagePermission(projectMembership?.role?.permissions, 'github')
    || _hasManagePermission(projectMembership?.role?.permissions, 'issue');

  if (!canManage) {
    throw new AppError('You do not have permission to manage project GitHub integrations.', 403, 'PROJECT_MANAGE_FORBIDDEN');
  }
};

const _getOrgMembership = async (userId, slug) => {
  const membership = await prisma.orgMember.findFirst({
    where: {
      userId,
      removedAt: null,
      org: {
        slug,
        deletedAt: null,
      },
    },
    select: {
      orgId: true,
      role: true,
    },
  });

  if (!membership) {
    throw new AppError('You do not have access to this organization.', 403, 'ORG_ACCESS_DENIED');
  }

  return membership;
};

const _getPrivilegedOrgMembership = async (userId, slug) => {
  const membership = await prisma.orgMember.findFirst({
    where: {
      userId,
      removedAt: null,
      role: {
        in: ['owner', 'admin'],
      },
      org: {
        slug,
        deletedAt: null,
      },
    },
    select: {
      orgId: true,
      role: true,
    },
  });

  if (!membership) {
    throw new AppError(
      'Only organization owner or admin can perform this action.',
      403,
      'ORG_WRITE_FORBIDDEN'
    );
  }

  return membership;
};

const _verifyWebhookSignature = ({ rawBody, signatureHeader }) => {
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new AppError('GitHub webhook secret is not configured.', 500, 'GITHUB_CONFIG_MISSING');
  }

  if (!signatureHeader) {
    throw new AppError('Missing webhook signature.', 401, 'INVALID_WEBHOOK_SIGNATURE');
  }

  const expected = `sha256=${crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex')}`;

  const signatureBuffer = Buffer.from(signatureHeader);
  const expectedBuffer = Buffer.from(expected);

  if (
    signatureBuffer.length !== expectedBuffer.length
    || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    throw new AppError('Invalid webhook signature.', 401, 'INVALID_WEBHOOK_SIGNATURE');
  }
};

const _findStatusForGithubState = (statuses, githubState) => {
  if (!Array.isArray(statuses) || statuses.length === 0) {
    return null;
  }

  if (githubState === 'closed') {
    return statuses.find((status) => status.category === 'done') || statuses[0];
  }

  return statuses.find((status) => status.category === 'todo')
    || statuses.find((status) => status.category === 'in_progress')
    || statuses[0];
};

const _syncSingleGitHubIssue = async ({
  project,
  linkedRepoId,
  reporterId,
  statuses,
  githubIssue,
  nextIssueNumber,
}) => {
  if (githubIssue.pull_request) {
    return { type: 'skipped', reason: 'pull_request' };
  }

  const githubIssueId = _toBigInt(githubIssue.id, 'githubIssueId');

  const selectedStatus = _findStatusForGithubState(statuses, githubIssue.state);
  if (!selectedStatus) {
    throw new AppError('No project status available for GitHub issue mapping.', 400, 'STATUS_NOT_CONFIGURED');
  }

  const existing = await prisma.issue.findUnique({
    where: {
      githubIssueId,
    },
    select: {
      id: true,
      projectId: true,
    },
  });

  if (existing && existing.projectId !== project.id) {
    return { type: 'failed', reason: 'github_issue_already_mapped_elsewhere' };
  }

  const updateData = {
    title: String(githubIssue.title || '').trim().slice(0, 500) || 'Imported GitHub issue',
    description: githubIssue.body || null,
    statusId: selectedStatus.id,
    repoId: linkedRepoId,
    githubIssueNumber: githubIssue.number,
    githubIssueUrl: githubIssue.html_url || null,
    githubSyncedAt: new Date(),
    isImported: true,
    deletedAt: null,
  };

  if (existing) {
    await prisma.issue.update({
      where: {
        id: existing.id,
      },
      data: updateData,
    });

    return { type: 'updated' };
  }

  await prisma.issue.create({
    data: {
      ...updateData,
      projectId: project.id,
      number: nextIssueNumber,
      type: 'task',
      priority: 'medium',
      reporterId,
      githubIssueId,
    },
  });

  return { type: 'imported' };
};

const _fetchGitHubIssues = async ({ repoFullName, accessToken, options }) => {
  const query = new URLSearchParams();
  query.set('state', options.state || 'open');
  query.set('per_page', String(options.limit || 50));

  if (options.since) {
    query.set('since', new Date(options.since).toISOString());
  }

  const response = await fetch(`${GITHUB_API_BASE}/repos/${repoFullName}/issues?${query.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'Coworkx-GitHub-Integration',
    },
  });

  if (!response.ok) {
    throw new AppError(`GitHub API request failed with status ${response.status}.`, 502, 'GITHUB_API_ERROR');
  }

  const payload = await response.json();

  if (!Array.isArray(payload)) {
    throw new AppError('Unexpected response received from GitHub API.', 502, 'GITHUB_API_ERROR');
  }

  return payload;
};

const _findReporterUserId = async ({ project, fallbackUserId }) => {
  if (project.createdBy) {
    return project.createdBy;
  }

  const owner = await prisma.orgMember.findFirst({
    where: {
      orgId: project.orgId,
      role: 'owner',
      removedAt: null,
    },
    select: {
      userId: true,
    },
  });

  return owner?.userId || fallbackUserId;
};

const getInstallUrl = async ({ userId, query }) => {
  const slug = query.slug?.toString().trim();
  const returnTo = query.returnTo?.toString().trim();

  if (slug) {
    await _getOrgMembership(userId, slug);
  }

  const appInstallBase = process.env.GITHUB_APP_INSTALL_URL;
  const appSlug = process.env.GITHUB_APP_SLUG;

  if (!appInstallBase && !appSlug) {
    throw new AppError('GitHub App installation URL is not configured.', 500, 'GITHUB_CONFIG_MISSING');
  }

  const baseUrl = appInstallBase || `https://github.com/apps/${appSlug}/installations/new`;
  const installUrl = new URL(baseUrl);

  const statePayload = {
    userId,
    slug: slug || null,
    returnTo: returnTo || null,
    ts: Date.now(),
  };

  installUrl.searchParams.set('state', Buffer.from(JSON.stringify(statePayload)).toString('base64url'));

  return installUrl.toString();
};

const handleWebhook = async ({ headers, payload, rawBody }) => {
  const signatureHeader = headers['x-hub-signature-256'];
  const event = headers['x-github-event'];

  if (!event) {
    throw new AppError('Missing GitHub event header.', 400, 'INVALID_WEBHOOK_EVENT');
  }

  const rawPayload = rawBody || JSON.stringify(payload || {});
  _verifyWebhookSignature({ rawBody: rawPayload, signatureHeader });

  let processed = 0;

  if (event === 'installation') {
    const installation = payload?.installation;
    const account = installation?.account;

    if (installation?.id && account?.login) {
      const org = await prisma.organization.findFirst({
        where: {
          slug: account.login.toLowerCase(),
          deletedAt: null,
        },
        select: {
          id: true,
        },
      });

      if (org) {
        const isActive = !['deleted', 'suspend'].includes(payload.action);

        await prisma.gitHubInstallation.upsert({
          where: {
            installationId: _toBigInt(installation.id, 'installationId'),
          },
          create: {
            orgId: org.id,
            installationId: _toBigInt(installation.id, 'installationId'),
            accountLogin: account.login,
            accountType: account.type === 'Organization' ? 'Organization' : 'User',
            isActive,
          },
          update: {
            accountLogin: account.login,
            accountType: account.type === 'Organization' ? 'Organization' : 'User',
            isActive,
            ...(isActive ? {} : { accessToken: null, tokenExpiresAt: null }),
          },
        });

        processed += 1;
      }
    }
  }

  if (event === 'installation_repositories') {
    const installationId = payload?.installation?.id;

    if (installationId && payload?.action === 'removed') {
      const localInstallation = await prisma.gitHubInstallation.findUnique({
        where: {
          installationId: _toBigInt(installationId, 'installationId'),
        },
        select: {
          id: true,
        },
      });

      if (localInstallation) {
        const removedRepoIds = (payload.repositories_removed || []).map((repo) => _toBigInt(repo.id, 'githubRepoId'));

        if (removedRepoIds.length > 0) {
          await prisma.gitHubLinkedRepo.updateMany({
            where: {
              installationId: localInstallation.id,
              githubRepoId: {
                in: removedRepoIds,
              },
            },
            data: {
              isActive: false,
            },
          });

          processed += removedRepoIds.length;
        }
      }
    }
  }

  if (event === 'issues') {
    const installationId = payload?.installation?.id;
    const repositoryId = payload?.repository?.id;
    const issuePayload = payload?.issue;

    if (installationId && repositoryId && issuePayload) {
      const linkedRepos = await prisma.gitHubLinkedRepo.findMany({
        where: {
          githubRepoId: _toBigInt(repositoryId, 'githubRepoId'),
          isActive: true,
          installation: {
            installationId: _toBigInt(installationId, 'installationId'),
            isActive: true,
          },
        },
        include: {
          project: {
            select: {
              id: true,
              orgId: true,
              key: true,
              createdBy: true,
            },
          },
        },
      });

      for (const linkedRepo of linkedRepos) {
        const statuses = await prisma.issueStatus.findMany({
          where: {
            projectId: linkedRepo.projectId,
          },
          select: {
            id: true,
            category: true,
          },
          orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
        });

        if (statuses.length === 0) {
          continue;
        }

        const reporterId = await _findReporterUserId({
          project: linkedRepo.project,
          fallbackUserId: linkedRepo.linkedBy,
        });

        const lastIssue = await prisma.issue.findFirst({
          where: {
            projectId: linkedRepo.projectId,
          },
          orderBy: {
            number: 'desc',
          },
          select: {
            number: true,
          },
        });

        await _syncSingleGitHubIssue({
          project: linkedRepo.project,
          linkedRepoId: linkedRepo.id,
          reporterId,
          statuses,
          githubIssue: issuePayload,
          nextIssueNumber: (lastIssue?.number || 0) + 1,
        });

        processed += 1;
      }
    }
  }

  return {
    accepted: true,
    event,
    action: payload?.action || null,
    processed,
  };
};

const listInstallations = async ({ userId, slug }) => {
  const membership = await _getOrgMembership(userId, slug);

  return prisma.gitHubInstallation.findMany({
    where: {
      orgId: membership.orgId,
    },
    select: {
      id: true,
      installationId: true,
      accountLogin: true,
      accountType: true,
      isActive: true,
      tokenExpiresAt: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
  });
};

const deactivateInstallation = async ({ userId, slug, installationIdParam }) => {
  const membership = await _getPrivilegedOrgMembership(userId, slug);

  const numericInstallationId = /^\d+$/.test(installationIdParam)
    ? _toBigInt(installationIdParam, 'installationId')
    : null;

  const installation = await prisma.gitHubInstallation.findFirst({
    where: {
      orgId: membership.orgId,
      OR: [
        { id: installationIdParam },
        ...(numericInstallationId ? [{ installationId: numericInstallationId }] : []),
      ],
    },
    select: {
      id: true,
      installationId: true,
      accountLogin: true,
      accountType: true,
      isActive: true,
    },
  });

  if (!installation) {
    throw new AppError('GitHub installation not found.', 404, 'INSTALLATION_NOT_FOUND');
  }

  await prisma.$transaction([
    prisma.gitHubInstallation.update({
      where: {
        id: installation.id,
      },
      data: {
        isActive: false,
        accessToken: null,
        tokenExpiresAt: null,
      },
    }),
    prisma.gitHubLinkedRepo.updateMany({
      where: {
        installationId: installation.id,
        project: {
          orgId: membership.orgId,
        },
      },
      data: {
        isActive: false,
      },
    }),
  ]);

  return {
    ...installation,
    isActive: false,
  };
};

const linkRepoToProject = async ({ userId, project, orgMember, body }) => {
  await _assertCanManageProjectGithub({
    projectId: project.id,
    userId,
    orgRole: orgMember.role,
  });

  const githubRepoId = _toBigInt(body.githubRepoId, 'githubRepoId');

  const installation = await prisma.gitHubInstallation.findFirst({
    where: {
      id: body.installationId,
      orgId: project.orgId,
      isActive: true,
    },
    select: {
      id: true,
      orgId: true,
      accountLogin: true,
      accountType: true,
      isActive: true,
    },
  });

  if (!installation) {
    throw new AppError('GitHub installation not found or inactive for this organization.', 404, 'INSTALLATION_NOT_FOUND');
  }

  let linkedRepo;

  const existing = await prisma.gitHubLinkedRepo.findUnique({
    where: {
      projectId_githubRepoId: {
        projectId: project.id,
        githubRepoId,
      },
    },
    select: {
      id: true,
    },
  });

  if (existing) {
    linkedRepo = await prisma.gitHubLinkedRepo.update({
      where: {
        id: existing.id,
      },
      data: {
        installationId: installation.id,
        repoFullName: body.repoFullName.trim(),
        defaultBranch: body.defaultBranch || 'main',
        linkedBy: userId,
        isActive: true,
      },
      select: {
        id: true,
        projectId: true,
        installationId: true,
        githubRepoId: true,
        repoFullName: true,
        defaultBranch: true,
        linkedBy: true,
        isActive: true,
        createdAt: true,
      },
    });
  } else {
    linkedRepo = await prisma.gitHubLinkedRepo.create({
      data: {
        projectId: project.id,
        installationId: installation.id,
        githubRepoId,
        repoFullName: body.repoFullName.trim(),
        defaultBranch: body.defaultBranch || 'main',
        linkedBy: userId,
        isActive: true,
      },
      select: {
        id: true,
        projectId: true,
        installationId: true,
        githubRepoId: true,
        repoFullName: true,
        defaultBranch: true,
        linkedBy: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  return linkedRepo;
};

const listProjectRepos = async ({ userId, project, orgMember }) => {
  await _assertProjectMemberAccess({
    projectId: project.id,
    userId,
    orgRole: orgMember.role,
  });

  return prisma.gitHubLinkedRepo.findMany({
    where: {
      projectId: project.id,
      isActive: true,
    },
    select: {
      id: true,
      githubRepoId: true,
      repoFullName: true,
      defaultBranch: true,
      isActive: true,
      createdAt: true,
      installation: {
        select: {
          id: true,
          installationId: true,
          accountLogin: true,
          accountType: true,
          isActive: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

const unlinkProjectRepo = async ({ userId, project, orgMember, repoId }) => {
  await _assertCanManageProjectGithub({
    projectId: project.id,
    userId,
    orgRole: orgMember.role,
  });

  const linkedRepo = await prisma.gitHubLinkedRepo.findFirst({
    where: {
      id: repoId,
      projectId: project.id,
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  if (!linkedRepo) {
    throw new AppError('Linked repository not found.', 404, 'LINKED_REPO_NOT_FOUND');
  }

  await prisma.gitHubLinkedRepo.update({
    where: {
      id: linkedRepo.id,
    },
    data: {
      isActive: false,
    },
  });
};

const importRepoIssues = async ({ userId, project, orgMember, repoId, options }) => {
  await _assertCanManageProjectGithub({
    projectId: project.id,
    userId,
    orgRole: orgMember.role,
  });

  const linkedRepo = await prisma.gitHubLinkedRepo.findFirst({
    where: {
      id: repoId,
      projectId: project.id,
      isActive: true,
    },
    include: {
      installation: {
        select: {
          id: true,
          isActive: true,
          accessToken: true,
          tokenExpiresAt: true,
        },
      },
    },
  });

  if (!linkedRepo) {
    throw new AppError('Linked repository not found.', 404, 'LINKED_REPO_NOT_FOUND');
  }

  if (!linkedRepo.installation?.isActive) {
    throw new AppError('GitHub installation is inactive.', 400, 'INSTALLATION_INACTIVE');
  }

  if (!linkedRepo.installation?.accessToken) {
    throw new AppError(
      'GitHub installation token is missing. Save a valid installation token before importing.',
      400,
      'INSTALLATION_TOKEN_MISSING'
    );
  }

  if (linkedRepo.installation.tokenExpiresAt && linkedRepo.installation.tokenExpiresAt <= new Date()) {
    throw new AppError('GitHub installation token has expired.', 400, 'INSTALLATION_TOKEN_EXPIRED');
  }

  const allIssues = await _fetchGitHubIssues({
    repoFullName: linkedRepo.repoFullName,
    accessToken: linkedRepo.installation.accessToken,
    options,
  });

  const labelsFilter = Array.isArray(options.labels)
    ? options.labels.map((label) => String(label).trim().toLowerCase()).filter(Boolean)
    : [];

  const statuses = await prisma.issueStatus.findMany({
    where: {
      projectId: project.id,
    },
    select: {
      id: true,
      category: true,
    },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
  });

  if (statuses.length === 0) {
    throw new AppError('No issue statuses configured for this project.', 400, 'STATUS_NOT_CONFIGURED');
  }

  const reporterId = await _findReporterUserId({
    project,
    fallbackUserId: userId,
  });

  let importedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  let nextIssueNumber = null;

  const maxIssue = await prisma.issue.findFirst({
    where: {
      projectId: project.id,
    },
    orderBy: {
      number: 'desc',
    },
    select: {
      number: true,
    },
  });

  nextIssueNumber = (maxIssue?.number || 0) + 1;

  for (const githubIssue of allIssues) {
    try {
      if (githubIssue.pull_request) {
        skippedCount += 1;
        continue;
      }

      if (labelsFilter.length > 0) {
        const issueLabels = (githubIssue.labels || []).map((entry) => String(entry.name || '').toLowerCase());
        const hasRequestedLabel = labelsFilter.some((label) => issueLabels.includes(label));

        if (!hasRequestedLabel) {
          skippedCount += 1;
          continue;
        }
      }

      const result = await _syncSingleGitHubIssue({
        project,
        linkedRepoId: linkedRepo.id,
        reporterId,
        statuses,
        githubIssue,
        nextIssueNumber,
      });

      if (result.type === 'imported') {
        importedCount += 1;
        nextIssueNumber += 1;
      } else if (result.type === 'updated') {
        updatedCount += 1;
      } else if (result.type === 'skipped') {
        skippedCount += 1;
      } else {
        failedCount += 1;
      }
    } catch {
      failedCount += 1;
    }
  }

  return {
    message: 'GitHub issue import completed.',
    importedCount,
    updatedCount,
    skippedCount,
    failedCount,
  };
};

export default {
  getInstallUrl,
  handleWebhook,
  listInstallations,
  deactivateInstallation,
  linkRepoToProject,
  listProjectRepos,
  unlinkProjectRepo,
  importRepoIssues,
};
