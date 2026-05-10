// server/src/middleware/ticket.validator.js
const { body, query, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

const VALID_STATUSES = ['open', 'assigned', 'in_progress', 'resolved', 'closed'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const VALID_SORT = ['created_at', 'updated_at', 'priority', 'status'];

// Rules for creating a ticket
const createRules = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 5, max: 255 })
    .withMessage('Title must be 5–255 characters'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 5000 })
    .withMessage('Description must be 10–5000 characters'),

  body('priority')
    .optional()
    .isIn(VALID_PRIORITIES)
    .withMessage(`Priority must be: ${VALID_PRIORITIES.join(', ')}`),

  validate,
];

// Rules for updating status
const statusRules = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(VALID_STATUSES)
    .withMessage(`Status must be: ${VALID_STATUSES.join(', ')}`),
  validate,
];

// Rules for assigning a ticket
const assignRules = [
  body('agent_id')
    .notEmpty()
    .withMessage('agent_id is required')
    .isUUID()
    .withMessage('agent_id must be a valid UUID'),
  validate,
];

// Rules for listing tickets — query params
const listRules = [
  query('status')
    .optional()
    .isIn(VALID_STATUSES)
    .withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),

  query('priority')
    .optional()
    .isIn(VALID_PRIORITIES)
    .withMessage(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}`),

  query('assigned_to').optional().isUUID().withMessage('assigned_to must be a valid UUID'),

  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search term too long'),

  query('from').optional().isISO8601().withMessage('from must be a valid date (YYYY-MM-DD)'),

  query('to').optional().isISO8601().withMessage('to must be a valid date (YYYY-MM-DD)'),

  query('page').optional().isInt({ min: 1 }).toInt().withMessage('page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .toInt()
    .withMessage('limit must be between 1 and 100'),

  query('sort')
    .optional()
    .isIn(VALID_SORT)
    .withMessage(`sort must be one of: ${VALID_SORT.join(', ')}`),

  query('order')
    .optional()
    .isIn(['asc', 'desc', 'ASC', 'DESC'])
    .withMessage('order must be asc or desc'),

  query('unassigned').optional().isBoolean().withMessage('unassigned must be true or false'),

  validate,
];

module.exports = { createRules, statusRules, assignRules, listRules };
