import { prisma } from '../config/db.js';
import crypto from 'crypto';
import AppError from '../utils/AppError.js';
import { sendOrgInvitationEmail } from '../utils/email.js';

const INVITATION_EXPIRY_DAYS = 7;

const _generateInvitationToken = () => crypto.randomBytes(32).toString('hex');

const _getInvitationExpiry = () => {
  return new Date(Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
};

const _buildInvitationUrl = (token) => {
  const clientBaseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  return `${clientBaseUrl}/invitations/${token}`;
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
      org: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
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

// ────────────────────────────────────────────────────────────
// 1. CREATE ORGANIZATION
// Creator is inserted into org_members with role = owner
// ────────────────────────────────────────────────────────────
const createOrganization = async (userId, { name, slug, description, logoUrl }) => {
  const organization = await prisma.$transaction(async (tx) => {
    const createdOrg = await tx.organization.create({
      data: {
        name,
        slug,
        description,
        logoUrl,
        ownerId: userId,
      },
    });

    await tx.orgMember.create({
      data: {
        orgId: createdOrg.id,
        userId,
        role: 'owner',
      },
    });

    return createdOrg;
  });

  if (!organization) {
    throw new AppError('Failed to create organization.', 500, 'ORG_CREATE_FAILED');
  }

  return {
    message: 'Organization created successfully.',
    organization,
  };
};

// ────────────────────────────────────────────────────────────
// 2. GET ALL ORGANIZATIONS FOR LOGGED-IN USER
// Returns each org with current user's role
// ────────────────────────────────────────────────────────────
const getUserOrganizations = async (userId) => {
  const memberships = await prisma.orgMember.findMany({
    where: {
      userId,
      removedAt: null,
      org: {
        deletedAt: null,
      },
    },
    select: {
      role: true,
      joinedAt: true,
      org: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          description: true,
          ownerId: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
    orderBy: {
      joinedAt: 'asc',
    },
  });

  const organizations = memberships.map((membership) => ({
    ...membership.org,
    role: membership.role,
  }));

  return { organizations };
};

// ────────────────────────────────────────────────────────────
// 3. GET ORGANIZATION BY SLUG
// User must be an active member of this organization
// ────────────────────────────────────────────────────────────
const getOrganizationBySlug = async (userId, slug) => {
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
      role: true,
      org: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          description: true,
          ownerId: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!membership) {
    throw new AppError('You do not have access to this organization.', 403, 'ORG_ACCESS_DENIED');
  }

  return {
    organization: {
      ...membership.org,
      role: membership.role,
    },
  };
};

// ────────────────────────────────────────────────────────────
// 4. UPDATE ORGANIZATION
// Only org owner/admin can update name/description/logo
// ────────────────────────────────────────────────────────────
const updateOrganizationBySlug = async (userId, slug, { name, description, logoUrl }) => {
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

  const organization = await prisma.organization.update({
    where: { id: membership.orgId },
    data: {
      name,
      description,
      logoUrl,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      description: true,
      ownerId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    message: 'Organization updated successfully.',
    organization: {
      ...organization,
      role: membership.role,
    },
  };
};

// ────────────────────────────────────────────────────────────
// 5. DELETE ORGANIZATION (SOFT DELETE)
// Owner only. Cascades soft-delete to projects and members.
// ────────────────────────────────────────────────────────────
const deleteOrganizationBySlug = async (userId, slug) => {
  const membership = await prisma.orgMember.findFirst({
    where: {
      userId,
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

  if (!membership) {
    throw new AppError(
      'Only organization owner can perform this action.',
      403,
      'ORG_DELETE_FORBIDDEN'
    );
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.organization.update({
      where: { id: membership.orgId },
      data: { deletedAt: now },
    });

    await tx.orgMember.updateMany({
      where: {
        orgId: membership.orgId,
        removedAt: null,
      },
      data: {
        removedAt: now,
        removedBy: userId,
      },
    });

    const projectIds = await tx.project.findMany({
      where: {
        orgId: membership.orgId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (projectIds.length > 0) {
      const ids = projectIds.map((project) => project.id);

      await tx.projectMember.updateMany({
        where: {
          projectId: { in: ids },
          removedAt: null,
        },
        data: {
          removedAt: now,
          removedBy: userId,
        },
      });

      await tx.project.updateMany({
        where: {
          id: { in: ids },
          deletedAt: null,
        },
        data: {
          deletedAt: now,
        },
      });
    }
  });

  return {
    message: 'Organization deleted successfully.',
  };
};

// ────────────────────────────────────────────────────────────
// 6. GET ORGANIZATION MEMBERS
// User must belong to org. Returns active members only.
// Optional filters: role, search(name/email)
// ────────────────────────────────────────────────────────────
const getOrganizationMembers = async (userId, slug, { role, search }) => {
  const allowedRoles = ['owner', 'admin', 'member'];

  if (role && !allowedRoles.includes(role)) {
    throw new AppError('Invalid role filter.', 400, 'VALIDATION_ERROR');
  }

  const requesterMembership = await prisma.orgMember.findFirst({
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
    },
  });

  if (!requesterMembership) {
    throw new AppError('You do not have access to this organization.', 403, 'ORG_ACCESS_DENIED');
  }

  const members = await prisma.orgMember.findMany({
    where: {
      orgId: requesterMembership.orgId,
      removedAt: null,
      ...(role ? { role } : {}),
      ...(search
        ? {
            user: {
              OR: [
                {
                  displayName: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  email: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              ],
            },
          }
        : {}),
    },
    select: {
      id: true,
      role: true,
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
    },
    orderBy: {
      joinedAt: 'asc',
    },
  });

  return { members };
};

// ────────────────────────────────────────────────────────────
// 7. UPDATE MEMBER ROLE
// Owner/Admin can change role to admin/member only.
// Owner role cannot be changed via this endpoint.
// ────────────────────────────────────────────────────────────
const updateMemberRole = async (actorUserId, slug, targetUserId, role) => {
  const actorMembership = await prisma.orgMember.findFirst({
    where: {
      userId: actorUserId,
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

  if (!actorMembership) {
    throw new AppError(
      'Only organization owner or admin can perform this action.',
      403,
      'ORG_WRITE_FORBIDDEN'
    );
  }

  const targetMembership = await prisma.orgMember.findFirst({
    where: {
      orgId: actorMembership.orgId,
      userId: targetUserId,
      removedAt: null,
    },
    select: {
      id: true,
      role: true,
      userId: true,
      joinedAt: true,
      user: {
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

  if (!targetMembership) {
    throw new AppError('Organization member not found.', 404, 'ORG_MEMBER_NOT_FOUND');
  }

  if (targetMembership.role === 'owner') {
    throw new AppError(
      'Owner role cannot be changed via this endpoint.',
      400,
      'OWNER_ROLE_IMMUTABLE'
    );
  }

  const updatedMember = await prisma.orgMember.update({
    where: { id: targetMembership.id },
    data: { role },
    select: {
      id: true,
      role: true,
      userId: true,
      joinedAt: true,
      user: {
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
    message: 'Member role updated successfully.',
    member: updatedMember,
  };
};

// ────────────────────────────────────────────────────────────
// 8. REMOVE MEMBER
// Owner/Admin can remove member (soft delete).
// Owner cannot be removed. Also removes from all org projects.
// ────────────────────────────────────────────────────────────
const removeMember = async (actorUserId, slug, targetUserId) => {
  const actorMembership = await prisma.orgMember.findFirst({
    where: {
      userId: actorUserId,
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

  if (!actorMembership) {
    throw new AppError(
      'Only organization owner or admin can perform this action.',
      403,
      'ORG_WRITE_FORBIDDEN'
    );
  }

  const targetMembership = await prisma.orgMember.findFirst({
    where: {
      orgId: actorMembership.orgId,
      userId: targetUserId,
      removedAt: null,
    },
    select: {
      id: true,
      role: true,
      userId: true,
    },
  });

  if (!targetMembership) {
    throw new AppError('Organization member not found.', 404, 'ORG_MEMBER_NOT_FOUND');
  }

  if (targetMembership.role === 'owner') {
    throw new AppError('Owner cannot be removed from organization.', 400, 'OWNER_REMOVE_FORBIDDEN');
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.orgMember.update({
      where: { id: targetMembership.id },
      data: {
        removedAt: now,
        removedBy: actorUserId,
      },
    });

    await tx.projectMember.updateMany({
      where: {
        userId: targetUserId,
        removedAt: null,
        project: {
          orgId: actorMembership.orgId,
          deletedAt: null,
        },
      },
      data: {
        removedAt: now,
        removedBy: actorUserId,
      },
    });
  });

  return {
    message: 'Member removed successfully.',
  };
};

// ────────────────────────────────────────────────────────────
// 9. SEND INVITATION
// Owner/Admin can invite user by email with role admin/member.
// Expires in 7 days.
// ────────────────────────────────────────────────────────────
const sendInvitation = async (actorUserId, slug, { email, role }) => {
  const actorMembership = await _getPrivilegedOrgMembership(actorUserId, slug);
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (existingUser) {
    const alreadyMember = await prisma.orgMember.findFirst({
      where: {
        orgId: actorMembership.orgId,
        userId: existingUser.id,
        removedAt: null,
      },
      select: { id: true },
    });

    if (alreadyMember) {
      throw new AppError('User is already a member of this organization.', 409, 'ALREADY_MEMBER');
    }
  }

  const existingInvitation = await prisma.orgInvitation.findFirst({
    where: {
      orgId: actorMembership.orgId,
      email: normalizedEmail,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (existingInvitation?.status === 'pending') {
    throw new AppError('An invitation is already pending for this email.', 409, 'INVITE_PENDING');
  }

  const token = _generateInvitationToken();
  const expiresAt = _getInvitationExpiry();

  const invitation = existingInvitation
    ? await prisma.orgInvitation.update({
        where: { id: existingInvitation.id },
        data: {
          invitedBy: actorUserId,
          role,
          token,
          status: 'pending',
          expiresAt,
          acceptedAt: null,
        },
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          expiresAt: true,
          createdAt: true,
        },
      })
    : await prisma.orgInvitation.create({
        data: {
          orgId: actorMembership.orgId,
          invitedBy: actorUserId,
          email: normalizedEmail,
          role,
          token,
          status: 'pending',
          expiresAt,
        },
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          expiresAt: true,
          createdAt: true,
        },
      });

  await sendOrgInvitationEmail(normalizedEmail, {
    orgName: actorMembership.org.name,
    role,
    invitationUrl: _buildInvitationUrl(token),
    expiresAt: expiresAt.toUTCString(),
  });

  return {
    message: 'Invitation sent successfully.',
    invitation,
  };
};

// ────────────────────────────────────────────────────────────
// 10. GET PENDING INVITATIONS
// Owner/Admin only.
// ────────────────────────────────────────────────────────────
const getPendingInvitations = async (userId, slug) => {
  const requesterMembership = await _getPrivilegedOrgMembership(userId, slug);

  const invitations = await prisma.orgInvitation.findMany({
    where: {
      orgId: requesterMembership.orgId,
      status: 'pending',
    },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      expiresAt: true,
      createdAt: true,
      inviter: {
        select: {
          id: true,
          email: true,
          displayName: true,
          username: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return { invitations };
};

// ────────────────────────────────────────────────────────────
// 11. ACCEPT INVITATION
// Validates token, pending state, and expiry.
// Requires authenticated user with same email as invite.
// ────────────────────────────────────────────────────────────
const acceptInvitation = async (userId, token) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
    },
  });

  if (!user) {
    throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  }

  const invitation = await prisma.orgInvitation.findUnique({
    where: { token },
    select: {
      id: true,
      orgId: true,
      email: true,
      role: true,
      invitedBy: true,
      status: true,
      expiresAt: true,
      org: {
        select: {
          id: true,
          name: true,
          slug: true,
          deletedAt: true,
        },
      },
    },
  });

  if (!invitation || !invitation.org || invitation.org.deletedAt) {
    throw new AppError('Invitation not found or invalid.', 404, 'INVITATION_NOT_FOUND');
  }

  if (invitation.status !== 'pending') {
    throw new AppError('This invitation is no longer valid.', 400, 'INVITATION_NOT_PENDING');
  }

  if (invitation.expiresAt <= new Date()) {
    throw new AppError('Invitation has expired.', 400, 'INVITATION_EXPIRED');
  }

  if (user.email.trim().toLowerCase() !== invitation.email.trim().toLowerCase()) {
    throw new AppError(
      'This invitation does not belong to your account email.',
      403,
      'INVITATION_EMAIL_MISMATCH'
    );
  }

  const membershipExists = await prisma.orgMember.findFirst({
    where: {
      orgId: invitation.orgId,
      userId,
      removedAt: null,
    },
    select: { id: true },
  });

  if (membershipExists) {
    throw new AppError('You are already a member of this organization.', 409, 'ALREADY_MEMBER');
  }

  await prisma.$transaction(async (tx) => {
    await tx.orgMember.create({
      data: {
        orgId: invitation.orgId,
        userId,
        role: invitation.role,
        invitedBy: invitation.invitedBy,
      },
    });

    await tx.orgInvitation.update({
      where: { id: invitation.id },
      data: {
        status: 'accepted',
        acceptedAt: new Date(),
      },
    });
  });

  return {
    message: 'Invitation accepted successfully.',
    organization: {
      id: invitation.org.id,
      name: invitation.org.name,
      slug: invitation.org.slug,
      role: invitation.role,
    },
  };
};

// ────────────────────────────────────────────────────────────
// 12. REVOKE INVITATION
// Owner/Admin only. Pending invitations become expired immediately.
// ────────────────────────────────────────────────────────────
const revokeInvitation = async (userId, slug, invitationId) => {
  const requesterMembership = await _getPrivilegedOrgMembership(userId, slug);

  const invitation = await prisma.orgInvitation.findFirst({
    where: {
      id: invitationId,
      orgId: requesterMembership.orgId,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!invitation) {
    throw new AppError('Invitation not found.', 404, 'INVITATION_NOT_FOUND');
  }

  if (invitation.status !== 'pending') {
    throw new AppError('Only pending invitations can be revoked.', 400, 'INVITATION_NOT_PENDING');
  }

  await prisma.orgInvitation.update({
    where: { id: invitationId },
    data: {
      status: 'expired',
      expiresAt: new Date(),
    },
  });

  return {
    message: 'Invitation revoked successfully.',
  };
};

// ────────────────────────────────────────────────────────────
// 13. RESEND INVITATION
// Owner/Admin only. Generates new token and extends expiry by 7 days.
// ────────────────────────────────────────────────────────────
const resendInvitation = async (userId, slug, invitationId) => {
  const requesterMembership = await _getPrivilegedOrgMembership(userId, slug);

  const invitation = await prisma.orgInvitation.findFirst({
    where: {
      id: invitationId,
      orgId: requesterMembership.orgId,
    },
    select: {
      id: true,
      orgId: true,
      email: true,
      role: true,
      status: true,
      org: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!invitation) {
    throw new AppError('Invitation not found.', 404, 'INVITATION_NOT_FOUND');
  }

  if (invitation.status === 'accepted') {
    throw new AppError('Accepted invitations cannot be resent.', 400, 'INVITATION_ALREADY_ACCEPTED');
  }

  const invitedUser = await prisma.user.findUnique({
    where: { email: invitation.email },
    select: { id: true },
  });

  if (invitedUser) {
    const alreadyMember = await prisma.orgMember.findFirst({
      where: {
        orgId: invitation.orgId,
        userId: invitedUser.id,
        removedAt: null,
      },
      select: { id: true },
    });

    if (alreadyMember) {
      throw new AppError('User is already a member of this organization.', 409, 'ALREADY_MEMBER');
    }
  }

  const token = _generateInvitationToken();
  const expiresAt = _getInvitationExpiry();

  const updatedInvitation = await prisma.orgInvitation.update({
    where: { id: invitation.id },
    data: {
      invitedBy: userId,
      token,
      status: 'pending',
      expiresAt,
      acceptedAt: null,
    },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  await sendOrgInvitationEmail(invitation.email, {
    orgName: invitation.org.name,
    role: invitation.role,
    invitationUrl: _buildInvitationUrl(token),
    expiresAt: expiresAt.toUTCString(),
  });

  return {
    message: 'Invitation resent successfully.',
    invitation: updatedInvitation,
  };
};

export default {
  createOrganization,
  getUserOrganizations,
  getOrganizationBySlug,
  updateOrganizationBySlug,
  deleteOrganizationBySlug,
  getOrganizationMembers,
  updateMemberRole,
  removeMember,
  sendInvitation,
  getPendingInvitations,
  acceptInvitation,
  revokeInvitation,
  resendInvitation,
};