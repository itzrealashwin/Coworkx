import { Router } from 'express';
import githubController from '../controller/github.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { requireProjectAccess } from '../middlewares/project.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import {
  linkGitHubRepoSchema,
  importGitHubIssuesSchema,
} from '../validators/github.validator.js';

const router = Router();

router.get('/auth/github/install', protect, githubController.redirectToInstall);
router.post('/github/webhook', githubController.handleWebhook);

router.get('/orgs/:slug/github/installations', protect, githubController.listInstallations);
router.delete('/orgs/:slug/github/installations/:installationId', protect, githubController.deactivateInstallation);

router.post(
  '/orgs/:slug/projects/:projectSlug/github/link',
  protect,
  requireProjectAccess,
  validate(linkGitHubRepoSchema),
  githubController.linkRepoToProject
);
router.get(
  '/orgs/:slug/projects/:projectSlug/github/repos',
  protect,
  requireProjectAccess,
  githubController.listProjectRepos
);
router.delete(
  '/orgs/:slug/projects/:projectSlug/github/repos/:repoId',
  protect,
  requireProjectAccess,
  githubController.unlinkProjectRepo
);
router.post(
  '/orgs/:slug/projects/:projectSlug/github/repos/:repoId/import',
  protect,
  requireProjectAccess,
  validate(importGitHubIssuesSchema),
  githubController.importRepoIssues
);

export default router;
