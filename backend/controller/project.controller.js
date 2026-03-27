import projectService from '../services/project.service.js';

// ─── POST /orgs/:slug/projects ─────────────────────────────
const createProject = async (req, res, next) => {
  try {
    const result = await projectService.createProject(req.user.id, req.params.slug, req.body);
    res.status(201).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// ─── GET /orgs/:slug/projects ──────────────────────────────
const getAllProjects = async (req, res, next) => {
  try {
    const status = req.query.status?.toString();
    const search = req.query.search?.toString();

    const result = await projectService.getAllProjects(req.user.id, req.params.slug, {
      status,
      search,
    });

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// ─── GET /orgs/:slug/projects/:projectSlug ─────────────────
const getProjectBySlug = async (req, res, next) => {
  try {
    const result = await projectService.getProjectBySlug(
      req.user.id,
      req.params.slug,
      req.params.projectSlug
    );

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /orgs/:slug/projects/:projectSlug ───────────────
const updateProjectBySlug = async (req, res, next) => {
  try {
    const result = await projectService.updateProjectBySlug(
      req.user.id,
      req.params.slug,
      req.params.projectSlug,
      req.body
    );

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /orgs/:slug/projects/:projectSlug ──────────────
const deleteProjectBySlug = async (req, res, next) => {
  try {
    const result = await projectService.deleteProjectBySlug(
      req.user.id,
      req.params.slug,
      req.params.projectSlug
    );

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// ─── POST /orgs/:slug/projects/:projectSlug/members ───────
const addProjectMember = async (req, res, next) => {
  try {
    const result = await projectService.addProjectMember(
      req.user.id,
      req.params.slug,
      req.params.projectSlug,
      req.body
    );

    res.status(201).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// ─── GET /orgs/:slug/projects/:projectSlug/members ────────
const getProjectMembers = async (req, res, next) => {
  try {
    const result = await projectService.getProjectMembers(
      req.user.id,
      req.params.slug,
      req.params.projectSlug
    );

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /orgs/:slug/projects/:projectSlug/members/:userId
const updateProjectMemberRole = async (req, res, next) => {
  try {
    const result = await projectService.updateProjectMemberRole(
      req.user.id,
      req.params.slug,
      req.params.projectSlug,
      req.params.userId,
      req.body
    );

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /orgs/:slug/projects/:projectSlug/members/:userId
const removeProjectMember = async (req, res, next) => {
  try {
    const result = await projectService.removeProjectMember(
      req.user.id,
      req.params.slug,
      req.params.projectSlug,
      req.params.userId
    );

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
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
