import { Router } from 'express';
import issueController from '../controller/issue.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { requireProjectAccess } from '../middlewares/project.middleware.js';
import validate from '../middlewares/validate.middleware.js';

import {
  createIssueSchema,
  updateIssueSchema,
  addIssueCommentSchema,
  updateIssueCommentSchema,
  createIssueLinkSchema,
  moveBacklogIssuesSchema,
  createIssueStatusSchema,
  updateIssueStatusSchema,
} from '../validators/issue.validator.js';

const router = Router();

// 🔐 Global auth
router.use(protect);

// ✅ Create a scoped router for project-level routes
const projectRouter = Router({ mergeParams: true });

// ✅ Apply middleware ONCE here
projectRouter.use(requireProjectAccess);

/* =========================
   BACKLOG
========================= */
projectRouter.get('/backlog', issueController.getBacklog);

projectRouter.post(
  '/backlog/move',
  validate(moveBacklogIssuesSchema),
  issueController.moveBacklogIssues
);

/* =========================
   STATUSES
========================= */
projectRouter.post(
  '/statuses',
  validate(createIssueStatusSchema),
  issueController.createStatus
);

projectRouter.get('/statuses', issueController.listStatuses);

projectRouter.patch(
  '/statuses/:statusId',
  validate(updateIssueStatusSchema),
  issueController.updateStatus
);

projectRouter.delete('/statuses/:statusId', issueController.deleteStatus);

/* =========================
   ISSUES
========================= */
projectRouter.post(
  '/issues',
  validate(createIssueSchema),
  issueController.createIssue
);

projectRouter.get('/issues', issueController.listIssues);

projectRouter.get('/issues/:issueNumber', issueController.getIssue);

projectRouter.patch(
  '/issues/:issueNumber',
  validate(updateIssueSchema),
  issueController.updateIssue
);

projectRouter.delete('/issues/:issueNumber', issueController.deleteIssue);

/* =========================
   COMMENTS
========================= */
projectRouter.post(
  '/issues/:issueNumber/comments',
  validate(addIssueCommentSchema),
  issueController.addComment
);

projectRouter.patch(
  '/issues/:issueNumber/comments/:commentId',
  validate(updateIssueCommentSchema),
  issueController.updateComment
);

projectRouter.delete(
  '/issues/:issueNumber/comments/:commentId',
  issueController.deleteComment
);

/* =========================
   LINKS
========================= */
projectRouter.post(
  '/issues/:issueNumber/links',
  validate(createIssueLinkSchema),
  issueController.createLink
);

projectRouter.delete(
  '/issues/:issueNumber/links/:linkId',
  issueController.deleteLink
);

/* =========================
   HISTORY
========================= */
projectRouter.get(
  '/issues/:issueNumber/history',
  issueController.getHistory
);

// ✅ Mount router with params
router.use('/:slug/projects/:projectSlug', projectRouter);

export default router;