import Joi from 'joi';

const issueType = Joi.string().trim().valid('task', 'bug', 'sub_task');
const issuePriority = Joi.string().trim().valid('low', 'medium', 'high', 'critical');

const createIssueSchema = Joi.object({
  title: Joi.string().trim().max(500).required().messages({
    'string.empty': 'Issue title is required',
    'string.max': 'Issue title cannot exceed 500 characters',
    'any.required': 'Issue title is required',
  }),
  description: Joi.string().trim().allow('', null),
  type: issueType.default('task').messages({
    'any.only': 'Issue type must be one of: task, bug, sub_task',
  }),
  priority: issuePriority.default('medium').messages({
    'any.only': 'Issue priority must be one of: low, medium, high, critical',
  }),
  statusId: Joi.string().guid({ version: ['uuidv4', 'uuidv5', 'uuidv1', 'uuidv3'] }).optional().messages({
    'string.guid': 'statusId must be a valid UUID',
  }),
  sprintId: Joi.string().guid({ version: ['uuidv4', 'uuidv5', 'uuidv1', 'uuidv3'] }).allow(null).optional().messages({
    'string.guid': 'sprintId must be a valid UUID',
  }),
  assigneeId: Joi.string().guid({ version: ['uuidv4', 'uuidv5', 'uuidv1', 'uuidv3'] }).allow(null).optional().messages({
    'string.guid': 'assigneeId must be a valid UUID',
  }),
  parentId: Joi.string().guid({ version: ['uuidv4', 'uuidv5', 'uuidv1', 'uuidv3'] }).allow(null).optional().messages({
    'string.guid': 'parentId must be a valid UUID',
  }),
  repoId: Joi.string().guid({ version: ['uuidv4', 'uuidv5', 'uuidv1', 'uuidv3'] }).allow(null).optional().messages({
    'string.guid': 'repoId must be a valid UUID',
  }),
  dueDate: Joi.date().iso().allow(null).optional().messages({
    'date.format': 'dueDate must be a valid ISO date',
  }),
  startedAt: Joi.date().iso().allow(null).optional().messages({
    'date.format': 'startedAt must be a valid ISO date',
  }),
  completedAt: Joi.date().iso().allow(null).optional().messages({
    'date.format': 'completedAt must be a valid ISO date',
  }),
});

const updateIssueSchema = Joi.object({
  title: Joi.string().trim().max(500).messages({
    'string.empty': 'Issue title cannot be empty',
    'string.max': 'Issue title cannot exceed 500 characters',
  }),
  description: Joi.string().trim().allow('', null),
  type: issueType.messages({
    'any.only': 'Issue type must be one of: task, bug, sub_task',
  }),
  priority: issuePriority.messages({
    'any.only': 'Issue priority must be one of: low, medium, high, critical',
  }),
  statusId: Joi.string().guid({ version: ['uuidv4', 'uuidv5', 'uuidv1', 'uuidv3'] }).allow(null).messages({
    'string.guid': 'statusId must be a valid UUID',
  }),
  sprintId: Joi.string().guid({ version: ['uuidv4', 'uuidv5', 'uuidv1', 'uuidv3'] }).allow(null).messages({
    'string.guid': 'sprintId must be a valid UUID',
  }),
  assigneeId: Joi.string().guid({ version: ['uuidv4', 'uuidv5', 'uuidv1', 'uuidv3'] }).allow(null).messages({
    'string.guid': 'assigneeId must be a valid UUID',
  }),
  parentId: Joi.string().guid({ version: ['uuidv4', 'uuidv5', 'uuidv1', 'uuidv3'] }).allow(null).messages({
    'string.guid': 'parentId must be a valid UUID',
  }),
  repoId: Joi.string().guid({ version: ['uuidv4', 'uuidv5', 'uuidv1', 'uuidv3'] }).allow(null).messages({
    'string.guid': 'repoId must be a valid UUID',
  }),
  dueDate: Joi.date().iso().allow(null).messages({
    'date.format': 'dueDate must be a valid ISO date',
  }),
  startedAt: Joi.date().iso().allow(null).messages({
    'date.format': 'startedAt must be a valid ISO date',
  }),
  completedAt: Joi.date().iso().allow(null).messages({
    'date.format': 'completedAt must be a valid ISO date',
  }),
})
  .messages({
    'object.min': 'At least one field is required to update issue',
  });

const addIssueCommentSchema = Joi.object({
  content: Joi.string().trim().min(1).required().messages({
    'string.empty': 'Comment content is required',
    'any.required': 'Comment content is required',
  }),
  parentId: Joi.string().guid({ version: ['uuidv4', 'uuidv5', 'uuidv1', 'uuidv3'] }).allow(null).optional().messages({
    'string.guid': 'parentId must be a valid UUID',
  }),
});

const updateIssueCommentSchema = Joi.object({
  content: Joi.string().trim().min(1).required().messages({
    'string.empty': 'Comment content is required',
    'any.required': 'Comment content is required',
  }),
});

const createIssueLinkSchema = Joi.object({
  linkType: Joi.string().trim().valid('blocks', 'relates_to', 'duplicates').required().messages({
    'any.only': 'linkType must be one of: blocks, relates_to, duplicates',
    'any.required': 'linkType is required',
  }),
  targetIssueNumber: Joi.string().trim().optional(),
  targetIssueId: Joi.string().guid({ version: ['uuidv4', 'uuidv5', 'uuidv1', 'uuidv3'] }).optional().messages({
    'string.guid': 'targetIssueId must be a valid UUID',
  }),
})
  .or('targetIssueNumber', 'targetIssueId')
  .messages({
    'object.missing': 'Either targetIssueNumber or targetIssueId is required',
  });

const moveBacklogIssuesSchema = Joi.object({
  issueNumbers: Joi.array().items(
    Joi.string().trim().pattern(/^([A-Za-z0-9]+-\d+|\d+)$/).messages({
      'string.pattern.base': 'issueNumbers must contain numeric values or ISSUEKEY-123 format',
    })
  ).min(1).optional(),
  issueIds: Joi.array().items(
    Joi.string().guid({ version: ['uuidv4', 'uuidv5', 'uuidv1', 'uuidv3'] }).messages({
      'string.guid': 'issueIds must contain valid UUID values',
    })
  ).min(1).optional(),
  sprintId: Joi.string().guid({ version: ['uuidv4', 'uuidv5', 'uuidv1', 'uuidv3'] }).allow(null).required().messages({
    'string.guid': 'sprintId must be a valid UUID or null',
    'any.required': 'sprintId is required (UUID or null for backlog)',
  }),
})
  .or('issueNumbers', 'issueIds')
  .messages({
    'object.missing': 'Provide issueNumbers or issueIds',
  });

const createIssueStatusSchema = Joi.object({
  name: Joi.string().trim().max(50).required().messages({
    'string.empty': 'Status name is required',
    'string.max': 'Status name cannot exceed 50 characters',
    'any.required': 'Status name is required',
  }),
  category: Joi.string().trim().valid('todo', 'in_progress', 'done').required().messages({
    'any.only': 'Status category must be one of: todo, in_progress, done',
    'any.required': 'Status category is required',
  }),
  color: Joi.string().trim().pattern(/^#[0-9A-Fa-f]{6}$/).optional().messages({
    'string.pattern.base': 'Status color must be a valid hex color like #6B7280',
  }),
  position: Joi.number().integer().min(0).optional().messages({
    'number.base': 'Status position must be a number',
    'number.integer': 'Status position must be an integer',
    'number.min': 'Status position must be at least 0',
  }),
});

const updateIssueStatusSchema = Joi.object({
  name: Joi.string().trim().max(50).messages({
    'string.empty': 'Status name cannot be empty',
    'string.max': 'Status name cannot exceed 50 characters',
  }),
  category: Joi.string().trim().valid('todo', 'in_progress', 'done').messages({
    'any.only': 'Status category must be one of: todo, in_progress, done',
  }),
  color: Joi.string().trim().pattern(/^#[0-9A-Fa-f]{6}$/).messages({
    'string.pattern.base': 'Status color must be a valid hex color like #6B7280',
  }),
  position: Joi.number().integer().min(0).messages({
    'number.base': 'Status position must be a number',
    'number.integer': 'Status position must be an integer',
    'number.min': 'Status position must be at least 0',
  }),
})
  .min(1)
  .messages({
    'object.min': 'At least one field is required to update status',
  });

export {
  createIssueSchema,
  updateIssueSchema,
  addIssueCommentSchema,
  updateIssueCommentSchema,
  createIssueLinkSchema,
  moveBacklogIssuesSchema,
  createIssueStatusSchema,
  updateIssueStatusSchema,
};
