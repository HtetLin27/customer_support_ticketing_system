const express = require('express');
const { protect, authorise } = require('../middleware/auth.middleware');
const { getAgentWorkload } = require('../controllers/users.controller');

const router = express.Router();

router.get('/agents/workload', protect, authorise('admin'), getAgentWorkload);

// GET /api/users — admin only
router.get('/', protect, authorise('admin'), (req, res) =>
  res.json({ message: 'List all users — Phase 4' })
);

// PATCH /api/users/:id/role — admin only — promote/demote users
router.patch('/:id/role', protect, authorise('admin'), (req, res) =>
  res.json({ message: 'Change user role — Phase 4' })
);

// DELETE /api/users/:id — admin only
router.delete('/:id', protect, authorise('admin'), (req, res) =>
  res.json({ message: 'Delete user — Phase 4' })
);

module.exports = router;
