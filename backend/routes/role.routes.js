import { Router } from 'express';
import roleController from '../controller/role.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { createRoleSchema, updateRoleSchema } from '../validators/role.validator.js';

const router = Router();

router.post('/:slug/roles', protect, validate(createRoleSchema), roleController.createRole);
router.get('/:slug/roles', protect, roleController.getRoles);
router.patch('/:slug/roles/:roleId', protect, validate(updateRoleSchema), roleController.updateRole);
router.delete('/:slug/roles/:roleId', protect, roleController.deleteRole);

export default router;
