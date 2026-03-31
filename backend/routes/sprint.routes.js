import { Router } from 'express';
import sprintController from '../controller/sprint.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { requireProjectAccess } from '../middlewares/project.middleware.js';

const router = Router();

// 🔐 global auth
router.use(protect);

// ✅ create scoped router
const projectRouter = Router({ mergeParams: true });

// ✅ apply middleware AFTER params exist
projectRouter.use(requireProjectAccess);

// ✅ routes (NO params here)
projectRouter.post('/sprints', sprintController.createSprint);
projectRouter.get('/sprints', sprintController.listSprints);
projectRouter.get('/sprints/:sprintId', sprintController.getSprint);
projectRouter.patch('/sprints/:sprintId', sprintController.updateSprint);
projectRouter.post('/sprints/:sprintId/start', sprintController.startSprint);
projectRouter.post('/sprints/:sprintId/complete', sprintController.completeSprint);
projectRouter.delete('/sprints/:sprintId', sprintController.deleteSprint);

// ✅ mount with params
router.use('/:slug/projects/:projectSlug', projectRouter);

export default router;