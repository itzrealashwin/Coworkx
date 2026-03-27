import { Router } from 'express';
import orgController from '../controller/org.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/:token/accept', protect, orgController.acceptInvitation);

export default router;
