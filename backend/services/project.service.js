import { prisma } from '../config/db.js';
import AppError from '../utils/AppError.js';

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

const _assertLeadIsOrgMember = async (orgId, leadId) => {
  if (!leadId) {
    return;
  }

  const leadMembership = await prisma.orgMember.findFirst({
    where: {
      orgId,
      userId: leadId,
      removedAt: null,
    },
    select: {
      id: true,
    },
  });

  if (!leadMembership) {
    throw new AppError('Project lead must be an active organization member.', 400, 'INVALID_PROJECT_LEAD');
  }
};

const _getOrCreateOwnerRole = async (tx, orgId) => {
  const ownerRole = await tx.orgRole.findFirst({
    where: {
      orgId,
      name: {
        equals: 'Owner',
        mode: 'insensitive',
      },
    },
    select: {
      id: true,
    },
  });

  if (ownerRole) {
    return ownerRole;
  }

  return tx.orgRole.create({
    data: {
      orgId,
      name: 'Owner',
      description: 'System role with full project access.',
      isSystem: true,
      permissions: {
        project: {
          all: true,
        },
        issue: {
          all: true,
        },
        sprint: {
          all: true,
        },
      },
    },
    select: {
      id: true,
    },
  });
};

const _hasProjectManagePermission = (permissions) => {
  if (!permissions || typeof permissions !== 'object') {
    return false;
  }

  if (permissions.all === true || permissions.manage === true) {
    return true;
  }

  const projectPermissions = permissions.project;

  if (!projectPermissions || typeof projectPermissions !== 'object') {
    return false;
  }

  return projectPermissions.all === true || projectPermissions.manage === true;
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

const _getProjectInOrgBySlug = async (orgId, projectSlug) => {
  const project = await prisma.project.findFirst({
    where: {
      orgId,
      slug: projectSlug,
      deletedAt: null,
    },
    select: {
      id: true,
      orgId: true,
      slug: true,
    },
  });

  if (!project) {
    throw new AppError('Project not found.', 404, 'PROJECT_NOT_FOUND');
  }

  return project;
};

const _assertCanManageProject = async ({
  actorUserId,
  actorOrgRole,
  projectId,
  allowOrgPrivilegedOverride = true,
}) => {
  const isOrgPrivileged = ['owner', 'admin'].includes(actorOrgRole);

  if (allowOrgPrivilegedOverride && isOrgPrivileged) {
    return;
  }

  const projectMembership = await prisma.projectMember.findFirst({
    where: {
      projectId,
      userId: actorUserId,
      removedAt: null,
    },
    select: {
      role: {
        select: {
          permissions: true,
        },
      },
    },
  });

  const canManageProject = _hasProjectManagePermission(projectMembership?.role?.permissions);

  if (!canManageProject) {
    throw new AppError('You do not have permission to manage this project.', 403, 'PROJECT_MANAGE_FORBIDDEN');
  }
};

const createProject = async (actorUserId, slug, { name, key, slug: projectSlug, description, icon, leadId }) => {
  const actorMembership = await _getPrivilegedOrgMembership(actorUserId, slug);

  const normalizedKey = key.trim().toUpperCase();

  await _assertLeadIsOrgMember(actorMembership.orgId, leadId);

  const duplicateProject = await prisma.project.findFirst({
    where: {
      orgId: actorMembership.orgId,
      OR: [{ key: normalizedKey }, { slug: projectSlug }],
    },
    select: {
      key: true,
      slug: true,
    },
  });

  if (duplicateProject?.key === normalizedKey) {
    throw new AppError('Project key already exists in this organization.', 409, 'PROJECT_KEY_EXISTS');
  }

  if (duplicateProject?.slug === projectSlug) {
    throw new AppError('Project slug already exists in this organization.', 409, 'PROJECT_SLUG_EXISTS');
  }

  const project = await prisma.$transaction(async (tx) => {
    const createdProject = await tx.project.create({
      data: {
        orgId: actorMembership.orgId,
        name,
        key: normalizedKey,
        slug: projectSlug,
        description,
        icon,
        leadId: leadId || null,
        createdBy: actorUserId,
      },
      select: {
        id: true,
        orgId: true,
        name: true,
        key: true,
        slug: true,
        description: true,
        icon: true,
        leadId: true,
        status: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await tx.issueStatus.createMany({
      data: [
        {
          projectId: createdProject.id,
          name: 'Todo',
          category: 'todo',
          color: '#94A3B8',
          position: 1,
        },
        {
          projectId: createdProject.id,
          name: 'In Progress',
          category: 'in_progress',
          color: '#3B82F6',
          position: 2,
        },
        {
          projectId: createdProject.id,
          name: 'Done',
          category: 'done',
          color: '#22C55E',
          position: 3,
        },
      ],
    });

    const ownerRole = await _getOrCreateOwnerRole(tx, actorMembership.orgId);

    await tx.projectMember.create({
      data: {
        projectId: createdProject.id,
        userId: actorUserId,
        roleId: ownerRole.id,
        addedBy: actorUserId,
      },
    });

    const statuses = await tx.issueStatus.findMany({
      where: {
        projectId: createdProject.id,
      },
      select: {
        id: true,
        name: true,
        category: true,
        color: true,
        position: true,
      },
      orderBy: {
        position: 'asc',
      },
    });

    return {
      ...createdProject,
      statuses,
    };
  });

  return {
    message: 'Project created successfully.',
    project,
  };
};

const getAllProjects = async (userId, slug, { status, search }) => {
  const normalizedStatus = status?.toString().trim().toLowerCase();
  const normalizedSearch = search?.toString().trim();

  if (normalizedStatus && !['active', 'archived'].includes(normalizedStatus)) {
    throw new AppError('Invalid status filter. Allowed values: active, archived.', 400, 'VALIDATION_ERROR');
  }

  const membership = await _getOrgMembership(userId, slug);

  const isPrivileged = ['owner', 'admin'].includes(membership.role);

  const projects = await prisma.project.findMany({
    where: {
      orgId: membership.orgId,
      deletedAt: null,
      ...(normalizedStatus ? { status: normalizedStatus } : {}),
      ...(normalizedSearch
        ? {
            OR: [
              {
                name: {
                  contains: normalizedSearch,
                  mode: 'insensitive',
                },
              },
              {
                key: {
                  contains: normalizedSearch,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
      ...(!isPrivileged
        ? {
            members: {
              some: {
                userId,
                removedAt: null,
              },
            },
          }
        : {}),
    },
    select: {
      id: true,
      orgId: true,
      name: true,
      slug: true,
      key: true,
      description: true,
      icon: true,
      leadId: true,
      status: true,
      createdBy: true,
      createdAt: true,
      updatedAt: true,
      lead: {
        select: {
          id: true,
          username: true,
          displayName: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return {
    projects,
  };
};

const getProjectBySlug = async (userId, slug, projectSlug) => {
  const membership = await _getOrgMembership(userId, slug);

  const isPrivileged = ['owner', 'admin'].includes(membership.role);

  const project = await prisma.project.findFirst({
    where: {
      orgId: membership.orgId,
      slug: projectSlug,
      deletedAt: null,
      ...(!isPrivileged
        ? {
            members: {
              some: {
                userId,
                removedAt: null,
              },
            },
          }
        : {}),
    },
    select: {
      id: true,
      orgId: true,
      name: true,
      slug: true,
      key: true,
      description: true,
      icon: true,
      leadId: true,
      status: true,
      createdBy: true,
      createdAt: true,
      updatedAt: true,
      lead: {
        select: {
          id: true,
          username: true,
          displayName: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });

  if (!project) {
    throw new AppError('Project not found.', 404, 'PROJECT_NOT_FOUND');
  }

  const [memberCount, activeSprint, openIssueCount, linkedRepoCount] = await prisma.$transaction([
    prisma.projectMember.count({
      where: {
        projectId: project.id,
        removedAt: null,
      },
    }),
    prisma.sprint.findFirst({
      where: {
        projectId: project.id,
        status: 'active',
      },
      select: {
        id: true,
        name: true,
        goal: true,
        status: true,
        startDate: true,
        endDate: true,
        completedAt: true,
      },
      orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
    }),
    prisma.issue.count({
      where: {
        projectId: project.id,
        deletedAt: null,
        status: {
          category: {
            not: 'done',
          },
        },
      },
    }),
    prisma.gitHubLinkedRepo.count({
      where: {
        projectId: project.id,
        isActive: true,
      },
    }),
  ]);

  return {
    project: {
      ...project,
      metrics: {
        memberCount,
        openIssueCount,
        linkedRepoCount,
      },
      activeSprint,
    },
  };
};

const updateProjectBySlug = async (actorUserId, slug, projectSlug, payload) => {
  const membership = await _getOrgMembership(actorUserId, slug);
  const project = await _getProjectInOrgBySlug(membership.orgId, projectSlug);

  await _assertCanManageProject({
    actorUserId,
    actorOrgRole: membership.role,
    projectId: project.id,
    allowOrgPrivilegedOverride: true,
  });

  if (typeof payload.leadId !== 'undefined' && payload.leadId !== null) {
    await _assertLeadIsOrgMember(project.orgId, payload.leadId);
  }

  const updatedProject = await prisma.project.update({
    where: {
      id: project.id,
    },
    data: {
      ...(typeof payload.name !== 'undefined' ? { name: payload.name } : {}),
      ...(typeof payload.description !== 'undefined' ? { description: payload.description } : {}),
      ...(typeof payload.icon !== 'undefined' ? { icon: payload.icon } : {}),
      ...(typeof payload.leadId !== 'undefined' ? { leadId: payload.leadId } : {}),
      ...(typeof payload.status !== 'undefined' ? { status: payload.status } : {}),
    },
    select: {
      id: true,
      orgId: true,
      name: true,
      slug: true,
      key: true,
      description: true,
      icon: true,
      leadId: true,
      status: true,
      createdBy: true,
      createdAt: true,
      updatedAt: true,
      lead: {
        select: {
          id: true,
          username: true,
          displayName: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });

  return {
    message: 'Project updated successfully.',
    project: updatedProject,
  };
};

const deleteProjectBySlug = async (actorUserId, slug, projectSlug) => {
  const ownerMembership = await prisma.orgMember.findFirst({
    where: {
      userId: actorUserId,
      removedAt: null,
      role: 'owner',
      org: {
        slug,
        deletedAt: null,
      },
    },
    select: {
      orgId: true,
    },
  });

  if (!ownerMembership) {
    throw new AppError(
      'Only organization owner can perform this action.',
      403,
      'PROJECT_DELETE_FORBIDDEN'
    );
  }

  const project = await prisma.project.findFirst({
    where: {
      orgId: ownerMembership.orgId,
      slug: projectSlug,
      deletedAt: null,
    },
    select: {
      id: true,
    },
  });

  if (!project) {
    throw new AppError('Project not found.', 404, 'PROJECT_NOT_FOUND');
  }

  await prisma.project.update({
    where: {
      id: project.id,
    },
    data: {
      deletedAt: new Date(),
    },
  });

  return {
    message: 'Project deleted successfully.',
  };
};

const addProjectMember = async (actorUserId, slug, projectSlug, { userId, roleId }) => {
  const membership = await _getOrgMembership(actorUserId, slug);
  const project = await _getProjectInOrgBySlug(membership.orgId, projectSlug);

  await _assertCanManageProject({
    actorUserId,
    actorOrgRole: membership.role,
    projectId: project.id,
    allowOrgPrivilegedOverride: true,
  });

  const targetOrgMembership = await prisma.orgMember.findFirst({
    where: {
      orgId: membership.orgId,
      userId,
      removedAt: null,
    },
    select: {
      id: true,
    },
  });

  if (!targetOrgMembership) {
    throw new AppError('User must be an active organization member.', 400, 'ORG_MEMBER_REQUIRED');
  }

  const role = await prisma.orgRole.findFirst({
    where: {
      id: roleId,
      orgId: membership.orgId,
    },
    select: {
      id: true,
      name: true,
      description: true,
      permissions: true,
      isSystem: true,
    },
  });

  if (!role) {
    throw new AppError('Role not found in this organization.', 404, 'ROLE_NOT_FOUND');
  }

  const existingMembership = await prisma.projectMember.findFirst({
    where: {
      projectId: project.id,
      userId,
    },
    select: {
      id: true,
      removedAt: true,
      joinedAt: true,
    },
  });

  let projectMember;

  if (existingMembership && !existingMembership.removedAt) {
    throw new AppError('User is already a member of this project.', 409, 'PROJECT_MEMBER_EXISTS');
  }

  if (existingMembership && existingMembership.removedAt) {
    projectMember = await prisma.projectMember.update({
      where: {
        id: existingMembership.id,
      },
      data: {
        roleId,
        addedBy: actorUserId,
        removedAt: null,
        removedBy: null,
      },
      select: {
        id: true,
        projectId: true,
        userId: true,
        joinedAt: true,
        removedAt: true,
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            email: true,
            avatarUrl: true,
            isActive: true,
            isVerified: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            description: true,
            permissions: true,
            isSystem: true,
          },
        },
      },
    });
  } else {
    projectMember = await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId,
        roleId,
        addedBy: actorUserId,
      },
      select: {
        id: true,
        projectId: true,
        userId: true,
        joinedAt: true,
        removedAt: true,
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            email: true,
            avatarUrl: true,
            isActive: true,
            isVerified: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            description: true,
            permissions: true,
            isSystem: true,
          },
        },
      },
    });
  }

  return {
    message: 'Project member added successfully.',
    member: projectMember,
  };
};

const getProjectMembers = async (userId, slug, projectSlug) => {
  const membership = await _getOrgMembership(userId, slug);
  const project = await _getProjectInOrgBySlug(membership.orgId, projectSlug);

  const isOrgPrivileged = ['owner', 'admin'].includes(membership.role);

  if (!isOrgPrivileged) {
    const requesterIsMember = await prisma.projectMember.findFirst({
      where: {
        projectId: project.id,
        userId,
        removedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!requesterIsMember) {
      throw new AppError('You do not have access to this project.', 403, 'PROJECT_ACCESS_DENIED');
    }
  }

  const members = await prisma.projectMember.findMany({
    where: {
      projectId: project.id,
      removedAt: null,
    },
    select: {
      id: true,
      projectId: true,
      userId: true,
      joinedAt: true,
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          email: true,
          avatarUrl: true,
          isActive: true,
          isVerified: true,
          lastSeenAt: true,
        },
      },
      role: {
        select: {
          id: true,
          name: true,
          description: true,
          permissions: true,
          isSystem: true,
        },
      },
    },
    orderBy: {
      joinedAt: 'asc',
    },
  });

  return {
    members,
  };
};

const updateProjectMemberRole = async (actorUserId, slug, projectSlug, targetUserId, { roleId }) => {
  const membership = await _getOrgMembership(actorUserId, slug);
  const project = await _getProjectInOrgBySlug(membership.orgId, projectSlug);

  await _assertCanManageProject({
    actorUserId,
    actorOrgRole: membership.role,
    projectId: project.id,
    allowOrgPrivilegedOverride: true,
  });

  const role = await prisma.orgRole.findFirst({
    where: {
      id: roleId,
      orgId: membership.orgId,
    },
    select: {
      id: true,
      name: true,
      description: true,
      permissions: true,
      isSystem: true,
    },
  });

  if (!role) {
    throw new AppError('Role not found in this organization.', 404, 'ROLE_NOT_FOUND');
  }

  const targetMembership = await prisma.projectMember.findFirst({
    where: {
      projectId: project.id,
      userId: targetUserId,
      removedAt: null,
    },
    select: {
      id: true,
    },
  });

  if (!targetMembership) {
    throw new AppError('Project member not found.', 404, 'PROJECT_MEMBER_NOT_FOUND');
  }

  const updatedMember = await prisma.projectMember.update({
    where: {
      id: targetMembership.id,
    },
    data: {
      roleId,
    },
    select: {
      id: true,
      projectId: true,
      userId: true,
      joinedAt: true,
      removedAt: true,
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          email: true,
          avatarUrl: true,
          isActive: true,
          isVerified: true,
        },
      },
      role: {
        select: {
          id: true,
          name: true,
          description: true,
          permissions: true,
          isSystem: true,
        },
      },
    },
  });

  return {
    message: 'Project member role updated successfully.',
    member: updatedMember,
  };
};

const removeProjectMember = async (actorUserId, slug, projectSlug, targetUserId) => {
  const membership = await _getOrgMembership(actorUserId, slug);
  const project = await _getProjectInOrgBySlug(membership.orgId, projectSlug);

  await _assertCanManageProject({
    actorUserId,
    actorOrgRole: membership.role,
    projectId: project.id,
    allowOrgPrivilegedOverride: false,
  });

  const targetMembership = await prisma.projectMember.findFirst({
    where: {
      projectId: project.id,
      userId: targetUserId,
      removedAt: null,
    },
    select: {
      id: true,
    },
  });

  if (!targetMembership) {
    throw new AppError('Project member not found.', 404, 'PROJECT_MEMBER_NOT_FOUND');
  }

  await prisma.projectMember.update({
    where: {
      id: targetMembership.id,
    },
    data: {
      removedAt: new Date(),
      removedBy: actorUserId,
    },
  });

  return {
    message: 'Project member removed successfully.',
  };
};

export default {
  createProject,
  getAllProjects,
  getProjectBySlug,
  updateProjectBySlug,
  deleteProjectBySlug,
  addProjectMember,
  getProjectMembers,
  updateProjectMemberRole,
  removeProjectMember,
};
