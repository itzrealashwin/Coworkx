import Joi from 'joi';

const createOrganizationSchema = Joi.object({
  name: Joi.string().trim().max(255).required().messages({
    'string.empty' : 'Organization name is required',
    'string.max'   : 'Organization name cannot exceed 255 characters',
    'any.required' : 'Organization name is required',
  }),
  slug: Joi.string().trim().lowercase().max(100).pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).required().messages({
    'string.empty'         : 'Organization slug is required',
    'string.max'           : 'Organization slug cannot exceed 100 characters',
    'string.pattern.base'  : 'Slug must be URL-safe (lowercase letters, numbers, and hyphens only)',
    'any.required'         : 'Organization slug is required',
  }),
  description: Joi.string().trim().allow('').optional(),
  logoUrl: Joi.string().uri().trim().optional().messages({
    'string.uri' : 'Logo URL must be a valid URL',
  }),
});

const updateOrganizationSchema = Joi.object({
  name: Joi.string().trim().max(255).messages({
    'string.empty' : 'Organization name cannot be empty',
    'string.max'   : 'Organization name cannot exceed 255 characters',
  }),
  description: Joi.string().trim().allow(''),
  logoUrl: Joi.string().uri().trim().allow(null).messages({
    'string.uri' : 'Logo URL must be a valid URL',
  }),
})
  .min(1)
  .messages({
    'object.min': 'At least one field is required to update organization',
  });

const updateOrgMemberRoleSchema = Joi.object({
  role: Joi.string().valid('admin', 'member').required().messages({
    'any.only'     : 'Role must be either admin or member',
    'any.required' : 'Role is required',
  }),
});

const sendOrgInvitationSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required().messages({
    'string.email': 'A valid invitation email is required',
    'any.required': 'Invitation email is required',
  }),
  role: Joi.string().trim().valid('admin', 'member').required().messages({
    'any.only': 'Role must be either admin or member',
    'any.required': 'Role is required',
  }),
});

export {
  createOrganizationSchema,
  updateOrganizationSchema,
  updateOrgMemberRoleSchema,
  sendOrgInvitationSchema,
};