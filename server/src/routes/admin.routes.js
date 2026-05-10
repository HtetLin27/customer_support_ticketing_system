const express = require('express');
const { protect, authorise } = require('../middleware/auth.middleware');
const {
  getStats,
  getVolumeReport,
  getAgentReport,
  getTicketsByStatus,
} = require('../controllers/reports.controller');
const { getAgentWorkload } = require('../controllers/users.controller');
const User = require('../models/User');
const { changeUserRole } = require('../controllers/users.controller');

const router = express.Router();
router.use(protect, authorise('admin'));

// Stats
router.get('/stats', getStats);
router.get('/reports/volume', getVolumeReport);
router.get('/reports/agents', getAgentReport);
router.get('/reports/tickets-by-status', getTicketsByStatus);

// User management
router.get('/users', async (req, res, next) => {
  try {
    const users = await User.findAll({
      order: [['created_at', 'DESC']],
    });
    res.json({ users });
  } catch (err) {
    next(err);
  }
});

router.patch('/users/:id/role', async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['customer', 'agent', 'admin'].includes(role))
      return res.status(400).json({ error: 'Invalid role' });

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.id === req.user.id)
      return res.status(400).json({ error: 'Cannot change your own role' });

    await user.update({ role });
    res.json({ message: `Role updated to ${role}`, user });
  } catch (err) {
    next(err);
  }
});

// Agent workload
router.get('/agents/workload', getAgentWorkload);

module.exports = router;
