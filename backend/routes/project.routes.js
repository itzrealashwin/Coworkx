import { Router } from 'express';
import projectController from '../controller/project.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import {
	addProjectMemberSchema,
	createProjectSchema,
	updateProjectMemberRoleSchema,
	updateProjectSchema,
} from '../validators/project.validator.js';

const router = Router();

router.get('/:slug/projects', protect, projectController.getAllProjects);
router.get('/:slug/projects/:projectSlug', protect, projectController.getProjectBySlug);
router.post('/:slug/projects', protect, validate(createProjectSchema), projectController.createProject);
router.patch(
	'/:slug/projects/:projectSlug',
	protect,
	validate(updateProjectSchema),
	projectController.updateProjectBySlug
);
router.delete('/:slug/projects/:projectSlug', protect, projectController.deleteProjectBySlug);
router.post(
	'/:slug/projects/:projectSlug/members',
	protect,
	validate(addProjectMemberSchema),
	projectController.addProjectMember
);
router.get('/:slug/projects/:projectSlug/members', protect, projectController.getProjectMembers);
router.patch(
	'/:slug/projects/:projectSlug/members/:userId',
	protect,
	validate(updateProjectMemberRoleSchema),
	projectController.updateProjectMemberRole
);
router.delete(
	'/:slug/projects/:projectSlug/members/:userId',
	protect,
	projectController.removeProjectMember
);

export default router;
