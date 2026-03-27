import Joi from 'joi';

const createProjectSchema = Joi.object({
  name: Joi.string().trim().max(255).required().messages({
    'string.empty': 'Project name is required',
    'string.max': 'Project name cannot exceed 255 characters',
    'any.required': 'Project name is required',
  }),
  key: Joi.string().trim().uppercase().pattern(/^[A-Z]{1,10}$/).required().messages({
    'string.empty': 'Project key is required',
    'string.pattern.base': 'Project key must be 1-10 uppercase letters',
    'any.required': 'Project key is required',
  }),
  slug: Joi.string().trim().lowercase().max(100).pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).required().messages({
    'string.empty': 'Project slug is required',
    'string.max': 'Project slug cannot exceed 100 characters',
    'string.pattern.base': 'Project slug must be URL-safe (lowercase letters, numbers, and hyphens only)',
    'any.required': 'Project slug is required',
  }),
  description: Joi.string().trim().allow('').optional(),
  icon: Joi.string().trim().max(2048).optional().messages({
    'string.max': 'Project icon cannot exceed 2048 characters',
  }),
  leadId: Joi.string().guid({ version: ['uuidv4', 'uuidv5', 'uuidv1', 'uuidv3'] }).allow(null).optional().messages({
    'string.guid': 'leadId must be a valid UUID',
  }),
});

const updateProjectSchema = Joi.object({
  name: Joi.string().trim().max(255).messages({
    'string.empty': 'Project name cannot be empty',
    'string.max': 'Project name cannot exceed 255 characters',
  }),
  description: Joi.string().trim().allow('', null),
  icon: Joi.string().trim().max(2048).allow('', null).messages({
    'string.max': 'Project icon cannot exceed 2048 characters',
  }),
  leadId: Joi.string().guid({ version: ['uuidv4', 'uuidv5', 'uuidv1', 'uuidv3'] }).allow(null).messages({
    'string.guid': 'leadId must be a valid UUID',
  }),
  status: Joi.string().trim().valid('active', 'archived').messages({
    'any.only': 'Status must be either active or archived',
  }),
})
  .min(1)
  .messages({
    'object.min': 'At least one field is required to update project',
  });

const addProjectMemberSchema = Joi.object({
  userId: Joi.string().guid({ version: ['uuidv4', 'uuidv5', 'uuidv1', 'uuidv3'] }).required().messages({
    'string.guid': 'userId must be a valid UUID',
    'any.required': 'userId is required',
  }),
  roleId: Joi.string().guid({ version: ['uuidv4', 'uuidv5', 'uuidv1', 'uuidv3'] }).required().messages({
    'string.guid': 'roleId must be a valid UUID',
    'any.required': 'roleId is required',
  }),
});

const updateProjectMemberRoleSchema = Joi.object({
  roleId: Joi.string().guid({ version: ['uuidv4', 'uuidv5', 'uuidv1', 'uuidv3'] }).required().messages({
    'string.guid': 'roleId must be a valid UUID',
    'any.required': 'roleId is required',
  }),
});

export {
  createProjectSchema,
  updateProjectSchema,
  addProjectMemberSchema,
  updateProjectMemberRoleSchema,
};
