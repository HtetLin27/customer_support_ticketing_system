const { body, validationResult } = require('express-validator');

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

const createCommentRules = [
  body('body')
    .trim()
    .notEmpty()
    .withMessage('Comment body is required')
    .isLength({ min: 1, max: 5000 })
    .withMessage('Comment must be between 1 and 5000 characters'),
  body('is_internal')
    .optional()
    .isBoolean()
    .withMessage('is_internal must be true or false')
    .toBoolean(),

  validate,
];

const updateCommentRules = [
  body('body')
    .trim()
    .notEmpty()
    .withMessage('Comment body is required')
    .isLength({ min: 1, max: 5000 })
    .withMessage('Comment must be between 1 and 5000 characters'),

  validate,
];

module.exports = { createCommentRules, updateCommentRules };
