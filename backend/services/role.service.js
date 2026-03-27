import { prisma } from '../config/db.js';
import AppError from '../utils/AppError.js';

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

const createRole = async (actorUserId, slug, { name, description, permissions }) => {
  const actorMembership = await _getPrivilegedOrgMembership(actorUserId, slug);

  const normalizedName = name.trim();

  const existingRole = await prisma.orgRole.findFirst({
    where: {
      orgId: actorMembership.orgId,
      name: {
        equals: normalizedName,
        mode: 'insensitive',
      },
    },
    select: {
      id: true,
    },
  });

  if (existingRole) {
    throw new AppError('Role name already exists in this organization.', 409, 'ROLE_NAME_EXISTS');
  }

  const role = await prisma.orgRole.create({
    data: {
      orgId: actorMembership.orgId,
      name: normalizedName,
      description,
      permissions,
      isSystem: false,
    },
    select: {
      id: true,
      orgId: true,
      name: true,
      description: true,
      permissions: true,
      isSystem: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    message: 'Role created successfully.',
    role,
  };
};

const getRoles = async (userId, slug) => {
  const membership = await _getOrgMembership(userId, slug);

  const roles = await prisma.orgRole.findMany({
    where: {
      orgId: membership.orgId,
    },
    select: {
      id: true,
      orgId: true,
      name: true,
      description: true,
      permissions: true,
      isSystem: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
  });

  return {
    roles,
  };
};

const updateRole = async (actorUserId, slug, roleId, { name, description, permissions }) => {
  const actorMembership = await _getPrivilegedOrgMembership(actorUserId, slug);

  const existingRole = await prisma.orgRole.findFirst({
    where: {
      id: roleId,
      orgId: actorMembership.orgId,
    },
    select: {
      id: true,
      name: true,
      isSystem: true,
    },
  });

  if (!existingRole) {
    throw new AppError('Role not found.', 404, 'ROLE_NOT_FOUND');
  }

  if (existingRole.isSystem) {
    throw new AppError('System roles cannot be updated.', 400, 'SYSTEM_ROLE_IMMUTABLE');
  }

  const updateData = {};

  if (typeof name === 'string') {
    const normalizedName = name.trim();

    if (normalizedName.toLowerCase() !== existingRole.name.trim().toLowerCase()) {
      const duplicateRole = await prisma.orgRole.findFirst({
        where: {
          orgId: actorMembership.orgId,
          id: {
            not: roleId,
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

      if (duplicateRole) {
        throw new AppError('Role name already exists in this organization.', 409, 'ROLE_NAME_EXISTS');
      }
    }

    updateData.name = normalizedName;
  }

  if (typeof description !== 'undefined') {
    updateData.description = description;
  }

  if (typeof permissions !== 'undefined') {
    updateData.permissions = permissions;
  }

  const role = await prisma.orgRole.update({
    where: { id: roleId },
    data: updateData,
    select: {
      id: true,
      orgId: true,
      name: true,
      description: true,
      permissions: true,
      isSystem: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    message: 'Role updated successfully.',
    role,
  };
};

const deleteRole = async (actorUserId, slug, roleId) => {
  const actorMembership = await _getPrivilegedOrgMembership(actorUserId, slug);

  const existingRole = await prisma.orgRole.findFirst({
    where: {
      id: roleId,
      orgId: actorMembership.orgId,
    },
    select: {
      id: true,
      isSystem: true,
    },
  });

  if (!existingRole) {
    throw new AppError('Role not found.', 404, 'ROLE_NOT_FOUND');
  }

  if (existingRole.isSystem) {
    throw new AppError('System roles cannot be deleted.', 400, 'SYSTEM_ROLE_DELETE_FORBIDDEN');
  }

  const assignedMember = await prisma.projectMember.findFirst({
    where: {
      roleId,
      removedAt: null,
      project: {
        orgId: actorMembership.orgId,
        deletedAt: null,
      },
    },
    select: {
      id: true,
    },
  });

  if (assignedMember) {
    throw new AppError(
      'Role cannot be deleted because it is currently assigned to project members.',
      409,
      'ROLE_IN_USE'
    );
  }

  await prisma.orgRole.delete({
    where: {
      id: roleId,
    },
  });

  return {
    message: 'Role deleted successfully.',
  };
};

export default {
  createRole,
  getRoles,
  updateRole,
  deleteRole,
};
