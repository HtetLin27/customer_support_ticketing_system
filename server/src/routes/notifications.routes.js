const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const {
  getNotifications,
  markRead,
  markAllRead,
} = require('../controllers/notifications.controller');

const router = express.Router();
router.use(protect);

router.get('/', getNotifications);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markRead);

module.exports = router;
