const express = require('express');
const { protect, authorise } = require('../middleware/auth.middleware');
const { createCommentRules, updateCommentRules } = require('../middleware/comment.validator');
const {
  createComment,
  getComments,
  updateComment,
  deleteComment,
  getCommentSummary,
} = require('../controllers/comments.controller');

const router = express.Router({ mergeParams: true });
// mergeParams: true is REQUIRED — lets us access :ticketId from the parent route

router.use(protect); // all comment routes require auth

// GET  /api/tickets/:ticketId/comments
router.get('/', authorise('customer', 'agent', 'admin'), getComments);

// GET  /api/tickets/:ticketId/comments/summary
// Must come before /:commentId to avoid "summary" being matched as an ID
router.get('/summary', authorise('agent', 'admin'), getCommentSummary);

// POST /api/tickets/:ticketId/comments
router.post('/', authorise('customer', 'agent', 'admin'), createCommentRules, createComment);

// PATCH /api/tickets/:ticketId/comments/:commentId
router.patch(
  '/:commentId',
  authorise('customer', 'agent', 'admin'),
  updateCommentRules,
  updateComment
);

// DELETE /api/tickets/:ticketId/comments/:commentId
router.delete('/:commentId', authorise('admin'), deleteComment);

module.exports = router;
