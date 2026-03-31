import Joi from 'joi';

const linkGitHubRepoSchema = Joi.object({
  installationId: Joi.string().guid({ version: ['uuidv4', 'uuidv5', 'uuidv1', 'uuidv3'] }).required().messages({
    'string.guid': 'installationId must be a valid UUID',
    'any.required': 'installationId is required',
  }),
  githubRepoId: Joi.alternatives()
    .try(Joi.number().integer().positive(), Joi.string().pattern(/^\d+$/))
    .required()
    .messages({
      'alternatives.match': 'githubRepoId must be a positive integer',
      'any.required': 'githubRepoId is required',
    }),
  repoFullName: Joi.string().trim().pattern(/^[^/\s]+\/[^/\s]+$/).required().messages({
    'string.pattern.base': 'repoFullName must be in owner/repo format',
    'any.required': 'repoFullName is required',
  }),
  defaultBranch: Joi.string().trim().max(100).default('main').messages({
    'string.max': 'defaultBranch cannot exceed 100 characters',
  }),
});

const importGitHubIssuesSchema = Joi.object({
  state: Joi.string().trim().valid('open', 'closed', 'all').default('open').messages({
    'any.only': 'state must be one of: open, closed, all',
  }),
  labels: Joi.array().items(Joi.string().trim().min(1)).max(20).optional().messages({
    'array.max': 'labels cannot contain more than 20 entries',
  }),
  since: Joi.date().iso().optional().messages({
    'date.format': 'since must be a valid ISO date',
  }),
  limit: Joi.number().integer().min(1).max(100).default(50).messages({
    'number.min': 'limit must be at least 1',
    'number.max': 'limit cannot exceed 100',
  }),
});

export {
  linkGitHubRepoSchema,
  importGitHubIssuesSchema,
};
