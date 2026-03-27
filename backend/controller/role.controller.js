import roleService from '../services/role.service.js';

// ─── POST /orgs/:slug/roles ────────────────────────────────
const createRole = async (req, res, next) => {
  try {
    const result = await roleService.createRole(req.user.id, req.params.slug, req.body);
    res.status(201).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// ─── GET /orgs/:slug/roles ─────────────────────────────────
const getRoles = async (req, res, next) => {
  try {
    const result = await roleService.getRoles(req.user.id, req.params.slug);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /orgs/:slug/roles/:roleId ───────────────────────
const updateRole = async (req, res, next) => {
  try {
    const result = await roleService.updateRole(
      req.user.id,
      req.params.slug,
      req.params.roleId,
      req.body
    );
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /orgs/:slug/roles/:roleId ──────────────────────
const deleteRole = async (req, res, next) => {
  try {
    const result = await roleService.deleteRole(req.user.id, req.params.slug, req.params.roleId);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export default {
  createRole,
  getRoles,
  updateRole,
  deleteRole,
};
