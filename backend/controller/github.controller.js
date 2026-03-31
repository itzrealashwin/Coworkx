import githubService from '../services/github.service.js';

const redirectToInstall = async (req, res, next) => {
  try {
    const installUrl = await githubService.getInstallUrl({
      userId: req.user.id,
      query: req.query,
    });

    res.redirect(302, installUrl);
  } catch (error) {
    next(error);
  }
};

const handleWebhook = async (req, res, next) => {
  try {
    const result = await githubService.handleWebhook({
      headers: req.headers,
      payload: req.body,
      rawBody: req.rawBody,
    });

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const listInstallations = async (req, res, next) => {
  try {
    const installations = await githubService.listInstallations({
      userId: req.user.id,
      slug: req.params.slug,
    });

    res.status(200).json({ success: true, installations });
  } catch (error) {
    next(error);
  }
};

const deactivateInstallation = async (req, res, next) => {
  try {
    const installation = await githubService.deactivateInstallation({
      userId: req.user.id,
      slug: req.params.slug,
      installationIdParam: req.params.installationId,
    });

    res.status(200).json({ success: true, message: 'GitHub installation deactivated.', installation });
  } catch (error) {
    next(error);
  }
};

const linkRepoToProject = async (req, res, next) => {
  try {
    const linkedRepo = await githubService.linkRepoToProject({
      userId: req.user.id,
      project: req.project,
      orgMember: req.orgMember,
      body: req.body,
    });

    res.status(201).json({ success: true, linkedRepo });
  } catch (error) {
    next(error);
  }
};

const listProjectRepos = async (req, res, next) => {
  try {
    const repos = await githubService.listProjectRepos({
      userId: req.user.id,
      project: req.project,
      orgMember: req.orgMember,
    });

    res.status(200).json({ success: true, repos });
  } catch (error) {
    next(error);
  }
};

const unlinkProjectRepo = async (req, res, next) => {
  try {
    await githubService.unlinkProjectRepo({
      userId: req.user.id,
      project: req.project,
      orgMember: req.orgMember,
      repoId: req.params.repoId,
    });

    res.status(200).json({ success: true, message: 'Repository unlinked from project.' });
  } catch (error) {
    next(error);
  }
};

const importRepoIssues = async (req, res, next) => {
  try {
    const result = await githubService.importRepoIssues({
      userId: req.user.id,
      project: req.project,
      orgMember: req.orgMember,
      repoId: req.params.repoId,
      options: req.body,
    });

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export default {
  redirectToInstall,
  handleWebhook,
  listInstallations,
  deactivateInstallation,
  linkRepoToProject,
  listProjectRepos,
  unlinkProjectRepo,
  importRepoIssues,
};
