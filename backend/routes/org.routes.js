import { Router } from 'express';
import orgController from '../controller/org.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import {
	createOrganizationSchema,
	sendOrgInvitationSchema,
	updateOrganizationSchema,
	updateOrgMemberRoleSchema,
} from '../validators/org.validator.js';

const router = Router();

// Protected routes
router.get('/', protect, orgController.getUserOrganizations);
router.get('/:slug/members', protect, orgController.getOrganizationMembers);
router.patch('/:slug/members/:userId', protect, validate(updateOrgMemberRoleSchema), orgController.updateMemberRole);
router.delete('/:slug/members/:userId', protect, orgController.removeMember);
router.post('/:slug/invitations', protect, validate(sendOrgInvitationSchema), orgController.sendInvitation);
router.get('/:slug/invitations', protect, orgController.getPendingInvitations);
router.delete('/:slug/invitations/:invitationId', protect, orgController.revokeInvitation);
router.post('/:slug/invitations/:invitationId/resend', protect, orgController.resendInvitation);
router.get('/:slug', protect, orgController.getOrganizationBySlug);
router.post('/', protect, validate(createOrganizationSchema), orgController.createOrganization);
router.patch('/:slug', protect, validate(updateOrganizationSchema), orgController.updateOrganizationBySlug);
router.delete('/:slug', protect, orgController.deleteOrganizationBySlug);

export default router;