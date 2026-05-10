import { prisma } from '../config/db.js';
import AppError from '../utils/AppError.js';

const issueInclude = {
  status: {
    select: {
      id: true,
      name: true,
      category: true,
      color: true,
    },
  },
  assignee: {
    select: {
      id: true,
      displayName: true,
      avatarUrl: true,
      email: true,
    },
  },
  reporter: {
    select: {
      id: true,
      displayName: true,
      avatarUrl: true,
      email: true,
    },
  },
  sprint: {
    select: {
      id: true,
      name: true,
      status: true,
    },
  },
  parent: {
    select: {
      id: true,
      number: true,
      title: true,
    },
  },
  _count: {
    select: {
      comments: {
        where: {
          deletedAt: null,
        },
      },
    },
  },
};

const _formatIssueKey = (projectKey, issueNumber) => `${projectKey}-${issueNumber}`;

const _serializeHistoryValue = (value) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
};

const _parseIssueNumber = (issueNumberParam, projectKey) => {
  const raw = String(issueNumberParam || '').trim();

  if (!raw) {
    throw new AppError('Issue number is required.', 400, 'VALIDATION_ERROR');
  }

  if (/^\d+$/.test(raw)) {
    return Number(raw);
  }

  const keyMatch = raw.match(/^([A-Za-z0-9]+)-(\d+)$/);
  if (!keyMatch) {
    throw new AppError('Invalid issue number format. Use numeric value or PROJECTKEY-123.', 400, 'VALIDATION_ERROR');
  }

  const prefix = keyMatch[1].toUpperCase();
  const expectedPrefix = String(projectKey || '').toUpperCase();

  if (expectedPrefix && prefix !== expectedPrefix) {
    throw new AppError(
      `Issue key prefix does not belong to this project. Expected ${expectedPrefix}.`,
      400,
      'ISSUE_KEY_MISMATCH'
    );
  }

  return Number(keyMatch[2]);
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
    return { isPrivilegedOrgRole: true, projectMembership: null };
  }

  const projectMembership = await _getProjectMembership(projectId, userId);

  if (!projectMembership) {
    throw new AppError('You do not have access to this project.', 403, 'PROJECT_ACCESS_DENIED');
  }

  return { isPrivilegedOrgRole: false, projectMembership };
};

const _assertCanModerateProjectContent = async ({ projectId, userId, orgRole }) => {
  if (['owner', 'admin'].includes(orgRole)) {
    return;
  }

  const projectMembership = await _getProjectMembership(projectId, userId);

  const canModerate = _hasManagePermission(projectMembership?.role?.permissions, 'issue')
    || _hasManagePermission(projectMembership?.role?.permissions, 'project');

  if (!canModerate) {
    throw new AppError('You do not have permission to perform this action.', 403, 'ISSUE_MANAGE_FORBIDDEN');
  }
};

const _findIssueByNumberOrThrow = async ({ projectId, projectKey, issueNumberParam, includeDeleted = false, extraIncludes = {}, tx = prisma }) => {
  const number = _parseIssueNumber(issueNumberParam, projectKey);

  const issue = await tx.issue.findFirst({
    where: {
      projectId,
      number,
      ...(includeDeleted ? {} : { deletedAt: null }),
    },
    include: {
      ...issueInclude,
      ...extraIncludes,
    },
  });

  if (!issue) {
    throw new AppError('Issue not found.', 404, 'ISSUE_NOT_FOUND');
  }

  return issue;
};

const _ensureStatusBelongsToProject = async (statusId, projectId, tx = prisma) => {
  const status = await tx.issueStatus.findFirst({
    where: {
      id: statusId,
      projectId,
    },
    select: {
      id: true,
      name: true,
      category: true,
    },
  });

  if (!status) {
    throw new AppError('Status not found in this project.', 404, 'STATUS_NOT_FOUND');
  }

  return status;
};

const _resolveDefaultStatus = async (projectId, tx = prisma) => {
  const status = await tx.issueStatus.findFirst({
    where: {
      projectId,
    },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      name: true,
      category: true,
    },
  });

  if (!status) {
    throw new AppError('No issue statuses configured for this project.', 400, 'STATUS_NOT_CONFIGURED');
  }

  return status;
};

const _ensureSprintBelongsToProject = async (sprintId, projectId, tx = prisma) => {
  const sprint = await tx.sprint.findFirst({
    where: {
      id: sprintId,
      projectId,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!sprint) {
    throw new AppError('Sprint not found in this project.', 404, 'SPRINT_NOT_FOUND');
  }

  return sprint;
};

const _ensureParentIssueBelongsToProject = async ({ parentId, projectId, issueIdToExclude = null, tx = prisma }) => {
  const parent = await tx.issue.findFirst({
    where: {
      id: parentId,
      projectId,
      deletedAt: null,
    },
    select: {
      id: true,
      number: true,
    },
  });

  if (!parent) {
    throw new AppError('Parent issue not found in this project.', 404, 'PARENT_ISSUE_NOT_FOUND');
  }

  if (issueIdToExclude && parent.id === issueIdToExclude) {
    throw new AppError('Issue cannot be parent of itself.', 400, 'INVALID_PARENT_ISSUE');
  }

  return parent;
};

const _ensureAssigneeInOrganization = async ({ assigneeId, orgId, tx = prisma }) => {
  const assigneeMembership = await tx.orgMember.findFirst({
    where: {
      orgId,
      userId: assigneeId,
      removedAt: null,
    },
    select: {
      id: true,
    },
  });

  if (!assigneeMembership) {
    throw new AppError('Assignee must be an active member of this organization.', 400, 'INVALID_ASSIGNEE');
  }
};

const _ensureRepoBelongsToProject = async ({ repoId, projectId, tx = prisma }) => {
  const repo = await tx.gitHubLinkedRepo.findFirst({
    where: {
      id: repoId,
      projectId,
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  if (!repo) {
    throw new AppError('Linked repository not found for this project.', 404, 'REPO_NOT_FOUND');
  }
};

const _buildIssueResponse = (issue, projectKey) => {
  return {
    ...issue,
    issueKey: _formatIssueKey(projectKey, issue.number),
  };
};

const _resolveTargetIssue = async ({ projectId, projectKey, targetIssueNumber, targetIssueId }) => {
  if (targetIssueId) {
    const target = await prisma.issue.findFirst({
      where: {
        id: targetIssueId,
        projectId,
        deletedAt: null,
      },
      select: {
        id: true,
        number: true,
        title: true,
      },
    });

    if (!target) {
      throw new AppError('Target issue not found.', 404, 'TARGET_ISSUE_NOT_FOUND');
    }

    return target;
  }

  const parsedNumber = _parseIssueNumber(targetIssueNumber, projectKey);

  const target = await prisma.issue.findFirst({
    where: {
      projectId,
      number: parsedNumber,
      deletedAt: null,
    },
    select: {
      id: true,
      number: true,
      title: true,
    },
  });

  if (!target) {
    throw new AppError('Target issue not found.', 404, 'TARGET_ISSUE_NOT_FOUND');
  }

  return target;
};

const createIssue = async ({ project, orgMember, userId, body }) => {
  await _assertProjectMemberAccess({
    projectId: project.id,
    userId,
    orgRole: orgMember.role,
  });

  const {
    title,
    description,
    type = 'task',
    priority = 'medium',
    statusId,
    sprintId,
    assigneeId,
    parentId,
    repoId,
    dueDate,
    startedAt,
    completedAt,
  } = body;

  if (type === 'sub_task' && !parentId) {
    throw new AppError('parentId is required when type is sub_task.', 400, 'VALIDATION_ERROR');
  }

  const createdIssue = await prisma.$transaction(async (tx) => {
    const resolvedStatus = statusId
      ? await _ensureStatusBelongsToProject(statusId, project.id, tx)
      : await _resolveDefaultStatus(project.id, tx);

    if (sprintId) {
      await _ensureSprintBelongsToProject(sprintId, project.id, tx);
    }

    if (assigneeId) {
      await _ensureAssigneeInOrganization({
        assigneeId,
        orgId: project.orgId,
        tx,
      });
    }

    if (parentId) {
      await _ensureParentIssueBelongsToProject({
        parentId,
        projectId: project.id,
        tx,
      });
    }

    if (repoId) {
      await _ensureRepoBelongsToProject({
        repoId,
        projectId: project.id,
        tx,
      });
    }

    const lastIssue = await tx.issue.findFirst({
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

    const issue = await tx.issue.create({
      data: {
        projectId: project.id,
        number: (lastIssue?.number || 0) + 1,
        title: title.trim(),
        description: description?.trim() || null,
        type,
        priority,
        statusId: resolvedStatus.id,
        sprintId: sprintId || null,
        assigneeId: assigneeId || null,
        parentId: parentId || null,
        repoId: repoId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        startedAt: startedAt ? new Date(startedAt) : null,
        completedAt: completedAt ? new Date(completedAt) : null,
        reporterId: userId,
      },
      include: issueInclude,
    });

    return issue;
  });

  return _buildIssueResponse(createdIssue, project.key);
};

const listIssues = async ({ project, org, orgMember, userId, query }) => {
  const where = {
    deletedAt: null,
  };

  if (project) {
    await _assertProjectMemberAccess({
      projectId: project.id,
      userId,
      orgRole: orgMember.role,
    });
    where.projectId = project.id;
  } else if (org) {
    // If no project specified, list all issues in the organization the user has access to
    // For now, we allow owners/admins to see all, others see what they are members of
    if (!['owner', 'admin'].includes(orgMember.role)) {
      const userProjectIds = await prisma.projectMember.findMany({
        where: { userId, removedAt: null, project: { orgId: org.id } },
        select: { projectId: true }
      });
      where.projectId = { in: userProjectIds.map(p => p.projectId) };
    } else {
      where.project = { orgId: org.id };
    }
  }

  const sprint = query.sprint?.toString().trim();
  const status = query.status?.toString().trim();
  const assignee = query.assignee?.toString().trim();
  const type = query.type?.toString().trim();

  if (sprint) {
    if (sprint.toLowerCase() === 'backlog') {
      where.sprintId = null;
    } else {
      where.sprintId = sprint;
    }
  }

  if (status) {
    if (['todo', 'in_progress', 'done'].includes(status)) {
      where.status = {
        category: status,
      };
    } else {
      where.statusId = status;
    }
  }

  if (assignee) {
    if (assignee.toLowerCase() === 'unassigned') {
      where.assigneeId = null;
    } else {
      where.assigneeId = assignee;
    }
  }

  if (type) {
    where.type = type;
  }

  const issues = await prisma.issue.findMany({
    where,
    include: {
      ...issueInclude,
      project: {
        select: {
          id: true,
          name: true,
          slug: true,
          key: true,
        },
      },
    },
    orderBy: [{ updatedAt: 'desc' }, { number: 'desc' }],
  });

  return issues.map((issue) => _buildIssueResponse(issue, issue.project?.key || project?.key));
};

const listBacklogIssues = async ({ project, orgMember, userId }) => {
  await _assertProjectMemberAccess({
    projectId: project.id,
    userId,
    orgRole: orgMember.role,
  });

  const issues = await prisma.issue.findMany({
    where: {
      projectId: project.id,
      sprintId: null,
      deletedAt: null,
    },
    include: issueInclude,
    orderBy: [{ number: 'asc' }],
  });

  return issues.map((issue) => _buildIssueResponse(issue, project.key));
};

const moveBacklogIssues = async ({ project, orgMember, userId, body }) => {
  await _assertCanModerateProjectContent({
    projectId: project.id,
    userId,
    orgRole: orgMember.role,
  });

  const issueNumbers = Array.isArray(body.issueNumbers) ? body.issueNumbers : [];
  const issueIds = Array.isArray(body.issueIds) ? body.issueIds : [];
  const destinationSprintId = body.sprintId || null;

  if (body.sprintId) {
    const destinationSprint = await _ensureSprintBelongsToProject(body.sprintId, project.id);
    if (destinationSprint.status === 'completed') {
      throw new AppError('Cannot move issues to a completed sprint.', 400, 'INVALID_SPRINT_STATE');
    }
  }

  const parsedNumbers = [...new Set(issueNumbers.map((value) => _parseIssueNumber(value, project.key)))];
  const uniqueIssueIds = [...new Set(issueIds)];

  const [issuesByNumber, issuesById] = await Promise.all([
    parsedNumbers.length > 0
      ? prisma.issue.findMany({
          where: {
            projectId: project.id,
            number: {
              in: parsedNumbers,
            },
            deletedAt: null,
          },
          select: {
            id: true,
            number: true,
            sprintId: true,
          },
        })
      : Promise.resolve([]),
    uniqueIssueIds.length > 0
      ? prisma.issue.findMany({
          where: {
            projectId: project.id,
            id: {
              in: uniqueIssueIds,
            },
            deletedAt: null,
          },
          select: {
            id: true,
            number: true,
            sprintId: true,
          },
        })
      : Promise.resolve([]),
  ]);

  if (parsedNumbers.length > issuesByNumber.length) {
    throw new AppError('One or more issueNumbers were not found in this project.', 404, 'ISSUE_NOT_FOUND');
  }

  if (uniqueIssueIds.length > issuesById.length) {
    throw new AppError('One or more issueIds were not found in this project.', 404, 'ISSUE_NOT_FOUND');
  }

  const issueMap = new Map();
  issuesByNumber.forEach((issue) => issueMap.set(issue.id, issue));
  issuesById.forEach((issue) => issueMap.set(issue.id, issue));

  const issuesToMove = [...issueMap.values()];

  if (issuesToMove.length === 0) {
    throw new AppError('No issues found to move.', 400, 'VALIDATION_ERROR');
  }

  const changedIssues = issuesToMove.filter((issue) => issue.sprintId !== destinationSprintId);

  if (changedIssues.length === 0) {
    return {
      movedIssuesCount: 0,
      movedTo: destinationSprintId || 'backlog',
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.issue.updateMany({
      where: {
        id: {
          in: changedIssues.map((issue) => issue.id),
        },
      },
      data: {
        sprintId: destinationSprintId,
      },
    });

    await tx.issueHistory.createMany({
      data: changedIssues.map((issue) => ({
        issueId: issue.id,
        changedBy: userId,
        field: 'sprint',
        oldValue: _serializeHistoryValue(issue.sprintId),
        newValue: _serializeHistoryValue(destinationSprintId),
      })),
    });
  });

  return {
    movedIssuesCount: changedIssues.length,
    movedTo: destinationSprintId || 'backlog',
  };
};

const createIssueStatus = async ({ project, orgMember, userId, body }) => {
  await _assertCanModerateProjectContent({
    projectId: project.id,
    userId,
    orgRole: orgMember.role,
  });

  const normalizedName = body.name.trim();

  const duplicateStatus = await prisma.issueStatus.findFirst({
    where: {
      projectId: project.id,
      name: {
        equals: normalizedName,
        mode: 'insensitive',
      },
    },
    select: {
      id: true,
    },
  });

  if (duplicateStatus) {
    throw new AppError('Status name already exists in this project.', 409, 'STATUS_NAME_EXISTS');
  }

  return prisma.$transaction(async (tx) => {
    const existingCount = await tx.issueStatus.count({
      where: {
        projectId: project.id,
      },
    });

    const targetPosition = typeof body.position === 'number'
      ? Math.max(0, Math.min(body.position, existingCount))
      : existingCount;

    if (targetPosition < existingCount) {
      await tx.issueStatus.updateMany({
        where: {
          projectId: project.id,
          position: {
            gte: targetPosition,
          },
        },
        data: {
          position: {
            increment: 1,
          },
        },
      });
    }

    return tx.issueStatus.create({
      data: {
        projectId: project.id,
        name: normalizedName,
        category: body.category,
        color: body.color || '#6B7280',
        position: targetPosition,
      },
      select: {
        id: true,
        projectId: true,
        name: true,
        category: true,
        color: true,
        position: true,
        createdAt: true,
      },
    });
  });
};

const listIssueStatuses = async ({ project, orgMember, userId }) => {
  await _assertProjectMemberAccess({
    projectId: project.id,
    userId,
    orgRole: orgMember.role,
  });

  return prisma.issueStatus.findMany({
    where: {
      projectId: project.id,
    },
    select: {
      id: true,
      projectId: true,
      name: true,
      category: true,
      color: true,
      position: true,
      createdAt: true,
    },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
  });
};

const updateIssueStatus = async ({ project, orgMember, userId, statusId, body }) => {
  await _assertCanModerateProjectContent({
    projectId: project.id,
    userId,
    orgRole: orgMember.role,
  });

  const existingStatus = await prisma.issueStatus.findFirst({
    where: {
      id: statusId,
      projectId: project.id,
    },
    select: {
      id: true,
      name: true,
      category: true,
      color: true,
      position: true,
      createdAt: true,
    },
  });

  if (!existingStatus) {
    throw new AppError('Status not found.', 404, 'STATUS_NOT_FOUND');
  }

  const updateData = {};

  if (typeof body.name !== 'undefined') {
    const normalizedName = body.name.trim();

    if (normalizedName.toLowerCase() !== existingStatus.name.toLowerCase()) {
      const duplicateStatus = await prisma.issueStatus.findFirst({
        where: {
          projectId: project.id,
          id: {
            not: statusId,
          },
          name: {
            equals: normalizedName,
            mode: 'insensitive',
          },
        },
        select: {
          id: true,
        },
      });

      if (duplicateStatus) {
        throw new AppError('Status name already exists in this project.', 409, 'STATUS_NAME_EXISTS');
      }
    }

    updateData.name = normalizedName;
  }

  if (typeof body.category !== 'undefined') {
    updateData.category = body.category;
  }

  if (typeof body.color !== 'undefined') {
    updateData.color = body.color;
  }

  return prisma.$transaction(async (tx) => {
    if (typeof body.position === 'number') {
      const totalStatuses = await tx.issueStatus.count({
        where: {
          projectId: project.id,
        },
      });

      const maxPosition = Math.max(0, totalStatuses - 1);
      const targetPosition = Math.max(0, Math.min(body.position, maxPosition));

      if (targetPosition < existingStatus.position) {
        await tx.issueStatus.updateMany({
          where: {
            projectId: project.id,
            id: {
              not: existingStatus.id,
            },
            position: {
              gte: targetPosition,
              lt: existingStatus.position,
            },
          },
          data: {
            position: {
              increment: 1,
            },
          },
        });
      }

      if (targetPosition > existingStatus.position) {
        await tx.issueStatus.updateMany({
          where: {
            projectId: project.id,
            id: {
              not: existingStatus.id,
            },
            position: {
              gt: existingStatus.position,
              lte: targetPosition,
            },
          },
          data: {
            position: {
              decrement: 1,
            },
          },
        });
      }

      updateData.position = targetPosition;
    }

    if (Object.keys(updateData).length === 0) {
      return tx.issueStatus.findUnique({
        where: {
          id: existingStatus.id,
        },
        select: {
          id: true,
          projectId: true,
          name: true,
          category: true,
          color: true,
          position: true,
          createdAt: true,
        },
      });
    }

    return tx.issueStatus.update({
      where: {
        id: existingStatus.id,
      },
      data: updateData,
      select: {
        id: true,
        projectId: true,
        name: true,
        category: true,
        color: true,
        position: true,
        createdAt: true,
      },
    });
  });
};

const deleteIssueStatus = async ({ project, orgMember, userId, statusId }) => {
  await _assertCanModerateProjectContent({
    projectId: project.id,
    userId,
    orgRole: orgMember.role,
  });

  const existingStatus = await prisma.issueStatus.findFirst({
    where: {
      id: statusId,
      projectId: project.id,
    },
    select: {
      id: true,
      position: true,
    },
  });

  if (!existingStatus) {
    throw new AppError('Status not found.', 404, 'STATUS_NOT_FOUND');
  }

  const issuesInStatus = await prisma.issue.count({
    where: {
      projectId: project.id,
      statusId: existingStatus.id,
      deletedAt: null,
    },
  });

  if (issuesInStatus > 0) {
    throw new AppError('Cannot delete status while issues are assigned to it.', 409, 'STATUS_IN_USE');
  }

  await prisma.$transaction(async (tx) => {
    await tx.issueStatus.delete({
      where: {
        id: existingStatus.id,
      },
    });

    await tx.issueStatus.updateMany({
      where: {
        projectId: project.id,
        position: {
          gt: existingStatus.position,
        },
      },
      data: {
        position: {
          decrement: 1,
        },
      },
    });
  });
};

const getIssueByNumber = async ({ project, orgMember, userId, issueNumber }) => {
  await _assertProjectMemberAccess({
    projectId: project.id,
    userId,
    orgRole: orgMember.role,
  });

  const issue = await _findIssueByNumberOrThrow({
    projectId: project.id,
    projectKey: project.key,
    issueNumberParam: issueNumber,
    extraIncludes: {
      comments: {
        where: { deletedAt: null },
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
            }
          },
        },
        orderBy: { createdAt: 'asc' },
      }
    }
  });

  return _buildIssueResponse(issue, project.key);
};

const updateIssue = async ({ project, orgMember, userId, issueNumber, body }) => {
  await _assertProjectMemberAccess({
    projectId: project.id,
    userId,
    orgRole: orgMember.role,
  });

  const existingIssue = await _findIssueByNumberOrThrow({
    projectId: project.id,
    projectKey: project.key,
    issueNumberParam: issueNumber,
  });

  const data = {};

  if (typeof body.title !== 'undefined') {
    data.title = body.title.trim();
  }

  if (typeof body.description !== 'undefined') {
    data.description = body.description?.trim() || null;
  }

  if (typeof body.type !== 'undefined') {
    data.type = body.type;
  }

  if (typeof body.priority !== 'undefined') {
    data.priority = body.priority;
  }

  if (typeof body.statusId !== 'undefined') {
    if (body.statusId === null) {
      throw new AppError('statusId cannot be null.', 400, 'VALIDATION_ERROR');
    }
    await _ensureStatusBelongsToProject(body.statusId, project.id);
    data.statusId = body.statusId;
  }

  if (typeof body.sprintId !== 'undefined') {
    if (body.sprintId) {
      await _ensureSprintBelongsToProject(body.sprintId, project.id);
      data.sprintId = body.sprintId;
    } else {
      data.sprintId = null;
    }
  }

  if (typeof body.assigneeId !== 'undefined') {
    if (body.assigneeId) {
      await _ensureAssigneeInOrganization({
        assigneeId: body.assigneeId,
        orgId: project.orgId,
      });
      data.assigneeId = body.assigneeId;
    } else {
      data.assigneeId = null;
    }
  }

  if (typeof body.parentId !== 'undefined') {
    if (body.parentId) {
      await _ensureParentIssueBelongsToProject({
        parentId: body.parentId,
        projectId: project.id,
        issueIdToExclude: existingIssue.id,
      });
      data.parentId = body.parentId;
    } else {
      data.parentId = null;
    }
  }

  if (typeof body.repoId !== 'undefined') {
    if (body.repoId) {
      await _ensureRepoBelongsToProject({
        repoId: body.repoId,
        projectId: project.id,
      });
      data.repoId = body.repoId;
    } else {
      data.repoId = null;
    }
  }

  if (typeof body.dueDate !== 'undefined') {
    data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  }

  if (typeof body.startedAt !== 'undefined') {
    data.startedAt = body.startedAt ? new Date(body.startedAt) : null;
  }

  if (typeof body.completedAt !== 'undefined') {
    data.completedAt = body.completedAt ? new Date(body.completedAt) : null;
  }

  const effectiveType = data.type || existingIssue.type;
  const effectiveParentId = Object.prototype.hasOwnProperty.call(data, 'parentId')
    ? data.parentId
    : existingIssue.parentId;

  if (effectiveType === 'sub_task' && !effectiveParentId) {
    throw new AppError('parentId is required when type is sub_task.', 400, 'VALIDATION_ERROR');
  }

  const historyEntries = [];

  const trackFieldChange = (field, oldValue, newValue) => {
    const oldSerialized = _serializeHistoryValue(oldValue);
    const newSerialized = _serializeHistoryValue(newValue);

    if (oldSerialized !== newSerialized) {
      historyEntries.push({
        field,
        oldValue: oldSerialized,
        newValue: newSerialized,
      });
    }
  };

  if (Object.prototype.hasOwnProperty.call(data, 'title')) {
    trackFieldChange('title', existingIssue.title, data.title);
  }

  if (Object.prototype.hasOwnProperty.call(data, 'description')) {
    trackFieldChange('description', existingIssue.description, data.description);
  }

  if (Object.prototype.hasOwnProperty.call(data, 'type')) {
    trackFieldChange('type', existingIssue.type, data.type);
  }

  if (Object.prototype.hasOwnProperty.call(data, 'priority')) {
    trackFieldChange('priority', existingIssue.priority, data.priority);
  }

  if (Object.prototype.hasOwnProperty.call(data, 'statusId')) {
    trackFieldChange('status', existingIssue.statusId, data.statusId);
  }

  if (Object.prototype.hasOwnProperty.call(data, 'assigneeId')) {
    trackFieldChange('assignee', existingIssue.assigneeId, data.assigneeId);
  }

  if (Object.prototype.hasOwnProperty.call(data, 'sprintId')) {
    trackFieldChange('sprint', existingIssue.sprintId, data.sprintId);
  }

  if (Object.prototype.hasOwnProperty.call(data, 'parentId')) {
    trackFieldChange('parent', existingIssue.parentId, data.parentId);
  }

  if (Object.prototype.hasOwnProperty.call(data, 'repoId')) {
    trackFieldChange('repo', existingIssue.repoId, data.repoId);
  }

  if (Object.prototype.hasOwnProperty.call(data, 'dueDate')) {
    trackFieldChange('dueDate', existingIssue.dueDate, data.dueDate);
  }

  if (Object.prototype.hasOwnProperty.call(data, 'startedAt')) {
    trackFieldChange('startedAt', existingIssue.startedAt, data.startedAt);
  }

  if (Object.prototype.hasOwnProperty.call(data, 'completedAt')) {
    trackFieldChange('completedAt', existingIssue.completedAt, data.completedAt);
  }

  const updatedIssue = await prisma.$transaction(async (tx) => {
    const issue = await tx.issue.update({
      where: {
        id: existingIssue.id,
      },
      data,
      include: issueInclude,
    });

    if (historyEntries.length > 0) {
      await tx.issueHistory.createMany({
        data: historyEntries.map((entry) => ({
          issueId: existingIssue.id,
          changedBy: userId,
          field: entry.field,
          oldValue: entry.oldValue,
          newValue: entry.newValue,
        })),
      });
    }

    return issue;
  });

  return _buildIssueResponse(updatedIssue, project.key);
};

const deleteIssue = async ({ project, orgMember, userId, issueNumber }) => {
  await _assertProjectMemberAccess({
    projectId: project.id,
    userId,
    orgRole: orgMember.role,
  });

  const issue = await _findIssueByNumberOrThrow({
    projectId: project.id,
    projectKey: project.key,
    issueNumberParam: issueNumber,
  });

  await prisma.issue.update({
    where: {
      id: issue.id,
    },
    data: {
      deletedAt: new Date(),
    },
  });
};

const addIssueComment = async ({ project, orgMember, userId, issueNumber, body }) => {
  await _assertProjectMemberAccess({
    projectId: project.id,
    userId,
    orgRole: orgMember.role,
  });

  const issue = await _findIssueByNumberOrThrow({
    projectId: project.id,
    projectKey: project.key,
    issueNumberParam: issueNumber,
  });

  const { content, parentId } = body;

  if (parentId) {
    const parentComment = await prisma.issueComment.findFirst({
      where: {
        id: parentId,
        issueId: issue.id,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!parentComment) {
      throw new AppError('Parent comment not found.', 404, 'COMMENT_NOT_FOUND');
    }
  }

  return prisma.issueComment.create({
    data: {
      issueId: issue.id,
      userId,
      parentId: parentId || null,
      content: content.trim(),
    },
    select: {
      id: true,
      issueId: true,
      userId: true,
      parentId: true,
      content: true,
      isEdited: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
  });
};

const updateIssueComment = async ({ project, orgMember, userId, issueNumber, commentId, body }) => {
  await _assertProjectMemberAccess({
    projectId: project.id,
    userId,
    orgRole: orgMember.role,
  });

  const issue = await _findIssueByNumberOrThrow({
    projectId: project.id,
    projectKey: project.key,
    issueNumberParam: issueNumber,
  });

  const existingComment = await prisma.issueComment.findFirst({
    where: {
      id: commentId,
      issueId: issue.id,
      deletedAt: null,
    },
    select: {
      id: true,
      userId: true,
    },
  });

  if (!existingComment) {
    throw new AppError('Comment not found.', 404, 'COMMENT_NOT_FOUND');
  }

  if (existingComment.userId !== userId) {
    throw new AppError('You can only edit your own comments.', 403, 'COMMENT_EDIT_FORBIDDEN');
  }

  return prisma.issueComment.update({
    where: {
      id: existingComment.id,
    },
    data: {
      content: body.content.trim(),
      isEdited: true,
    },
    select: {
      id: true,
      issueId: true,
      userId: true,
      parentId: true,
      content: true,
      isEdited: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
  });
};

const deleteIssueComment = async ({ project, orgMember, userId, issueNumber, commentId }) => {
  await _assertProjectMemberAccess({
    projectId: project.id,
    userId,
    orgRole: orgMember.role,
  });

  const issue = await _findIssueByNumberOrThrow({
    projectId: project.id,
    projectKey: project.key,
    issueNumberParam: issueNumber,
  });

  const existingComment = await prisma.issueComment.findFirst({
    where: {
      id: commentId,
      issueId: issue.id,
      deletedAt: null,
    },
    select: {
      id: true,
      userId: true,
    },
  });

  if (!existingComment) {
    throw new AppError('Comment not found.', 404, 'COMMENT_NOT_FOUND');
  }

  if (existingComment.userId !== userId) {
    await _assertCanModerateProjectContent({
      projectId: project.id,
      userId,
      orgRole: orgMember.role,
    });
  }

  await prisma.issueComment.update({
    where: {
      id: existingComment.id,
    },
    data: {
      deletedAt: new Date(),
    },
  });
};

const createIssueLink = async ({ project, orgMember, userId, issueNumber, body }) => {
  await _assertProjectMemberAccess({
    projectId: project.id,
    userId,
    orgRole: orgMember.role,
  });

  const sourceIssue = await _findIssueByNumberOrThrow({
    projectId: project.id,
    projectKey: project.key,
    issueNumberParam: issueNumber,
  });

  const { linkType, targetIssueNumber, targetIssueId } = body;

  const targetIssue = await _resolveTargetIssue({
    projectId: project.id,
    projectKey: project.key,
    targetIssueNumber,
    targetIssueId,
  });

  if (targetIssue.id === sourceIssue.id) {
    throw new AppError('Issue cannot be linked to itself.', 400, 'INVALID_ISSUE_LINK');
  }

  try {
    const link = await prisma.issueLink.create({
      data: {
        sourceIssueId: sourceIssue.id,
        targetIssueId: targetIssue.id,
        linkType,
        createdBy: userId,
      },
      select: {
        id: true,
        linkType: true,
        createdAt: true,
        sourceIssue: {
          select: {
            id: true,
            number: true,
            title: true,
          },
        },
        targetIssue: {
          select: {
            id: true,
            number: true,
            title: true,
          },
        },
      },
    });

    return {
      ...link,
      sourceIssueKey: _formatIssueKey(project.key, link.sourceIssue.number),
      targetIssueKey: _formatIssueKey(project.key, link.targetIssue.number),
    };
  } catch (error) {
    if (error.code === 'P2002') {
      throw new AppError('This issue link already exists.', 409, 'ISSUE_LINK_EXISTS');
    }

    throw error;
  }
};

const deleteIssueLink = async ({ project, orgMember, userId, issueNumber, linkId }) => {
  await _assertProjectMemberAccess({
    projectId: project.id,
    userId,
    orgRole: orgMember.role,
  });

  const sourceIssue = await _findIssueByNumberOrThrow({
    projectId: project.id,
    projectKey: project.key,
    issueNumberParam: issueNumber,
  });

  const link = await prisma.issueLink.findFirst({
    where: {
      id: linkId,
      sourceIssueId: sourceIssue.id,
    },
    select: {
      id: true,
    },
  });

  if (!link) {
    throw new AppError('Issue link not found.', 404, 'ISSUE_LINK_NOT_FOUND');
  }

  await prisma.issueLink.delete({
    where: {
      id: link.id,
    },
  });
};

const getIssueHistory = async ({ project, orgMember, userId, issueNumber }) => {
  await _assertProjectMemberAccess({
    projectId: project.id,
    userId,
    orgRole: orgMember.role,
  });

  const issue = await _findIssueByNumberOrThrow({
    projectId: project.id,
    projectKey: project.key,
    issueNumberParam: issueNumber,
  });

  const history = await prisma.issueHistory.findMany({
    where: {
      issueId: issue.id,
    },
    include: {
      changer: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return history;
};

export default {
  createIssue,
  listIssues,
  listBacklogIssues,
  moveBacklogIssues,
  createIssueStatus,
  listIssueStatuses,
  updateIssueStatus,
  deleteIssueStatus,
  getIssueByNumber,
  updateIssue,
  deleteIssue,
  addIssueComment,
  updateIssueComment,
  deleteIssueComment,
  createIssueLink,
  deleteIssueLink,
  getIssueHistory,
};
