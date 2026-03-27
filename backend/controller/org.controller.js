import orgService from '../services/org.service.js';

// ─── POST /orgs ─────────────────────────────────────────────
const createOrganization = async (req, res, next) => {
  try {
    const result = await orgService.createOrganization(req.user.id, req.body);
    res.status(201).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// ─── GET /orgs ──────────────────────────────────────────────
const getUserOrganizations = async (req, res, next) => {
  try {
    const result = await orgService.getUserOrganizations(req.user.id);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// ─── GET /orgs/:slug ────────────────────────────────────────
const getOrganizationBySlug = async (req, res, next) => {
  try {
    const result = await orgService.getOrganizationBySlug(req.user.id, req.params.slug);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /orgs/:slug ──────────────────────────────────────
const updateOrganizationBySlug = async (req, res, next) => {
  try {
    const result = await orgService.updateOrganizationBySlug(req.user.id, req.params.slug, req.body);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /orgs/:slug ─────────────────────────────────────
const deleteOrganizationBySlug = async (req, res, next) => {
  try {
    const result = await orgService.deleteOrganizationBySlug(req.user.id, req.params.slug);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// ─── GET /orgs/:slug/members ───────────────────────────────
const getOrganizationMembers = async (req, res, next) => {
  try {
    const role = req.query.role?.toString().trim().toLowerCase();
    const search = req.query.search?.toString().trim();

    const result = await orgService.getOrganizationMembers(req.user.id, req.params.slug, {
      role,
      search,
    });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /orgs/:slug/members/:userId ─────────────────────
const updateMemberRole = async (req, res, next) => {
  try {
    const result = await orgService.updateMemberRole(
      req.user.id,
      req.params.slug,
      req.params.userId,
      req.body.role
    );
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /orgs/:slug/members/:userId ────────────────────
const removeMember = async (req, res, next) => {
  try {
    const result = await orgService.removeMember(req.user.id, req.params.slug, req.params.userId);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// ─── POST /orgs/:slug/invitations ──────────────────────────
const sendInvitation = async (req, res, next) => {
  try {
    const result = await orgService.sendInvitation(req.user.id, req.params.slug, req.body);
    res.status(201).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// ─── GET /orgs/:slug/invitations ───────────────────────────
const getPendingInvitations = async (req, res, next) => {
  try {
    const result = await orgService.getPendingInvitations(req.user.id, req.params.slug);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /orgs/:slug/invitations/:invitationId ─────────
const revokeInvitation = async (req, res, next) => {
  try {
    const result = await orgService.revokeInvitation(
      req.user.id,
      req.params.slug,
      req.params.invitationId
    );
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// ─── POST /orgs/:slug/invitations/:invitationId/resend ────
const resendInvitation = async (req, res, next) => {
  try {
    const result = await orgService.resendInvitation(
      req.user.id,
      req.params.slug,
      req.params.invitationId
    );
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// ─── POST /invitations/:token/accept ───────────────────────
const acceptInvitation = async (req, res, next) => {
  try {
    const result = await orgService.acceptInvitation(req.user.id, req.params.token);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
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
  revokeInvitation,
  resendInvitation,
  acceptInvitation,
};