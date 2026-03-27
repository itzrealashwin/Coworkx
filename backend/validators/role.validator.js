import Joi from 'joi';

const createRoleSchema = Joi.object({
  name: Joi.string().trim().max(50).required().messages({
    'string.empty': 'Role name is required',
    'string.max': 'Role name cannot exceed 50 characters',
    'any.required': 'Role name is required',
  }),
  description: Joi.string().trim().max(255).allow('').optional().messages({
    'string.max': 'Role description cannot exceed 255 characters',
  }),
  permissions: Joi.object().required().messages({
    'object.base': 'Permissions must be a valid JSON object',
    'any.required': 'Permissions are required',
  }),
});

const updateRoleSchema = Joi.object({
  name: Joi.string().trim().max(50).messages({
    'string.empty': 'Role name cannot be empty',
    'string.max': 'Role name cannot exceed 50 characters',
  }),
  description: Joi.string().trim().max(255).allow('', null).messages({
    'string.max': 'Role description cannot exceed 255 characters',
  }),
  permissions: Joi.object().messages({
    'object.base': 'Permissions must be a valid JSON object',
  }),
})
  .min(1)
  .messages({
    'object.min': 'At least one field is required to update role',
  });

export {
  createRoleSchema,
  updateRoleSchema,
};
