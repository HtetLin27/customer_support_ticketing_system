const Notification = require('../models/Notification');
const { Op } = require('sequelize');

// GET /api/notifications
// Returns the current user's notifications — unread first
const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.findAll({
      where: { user_id: req.user.id },
      order: [
        ['read_at', 'ASC NULLS FIRST'], // unread first
        ['created_at', 'DESC'],
      ],
      limit: 30,
    });

    const unreadCount = notifications.filter((n) => !n.read_at).length;

    return res.status(200).json({ notifications, unreadCount });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/notifications/:id/read
// Marks a single notification as read
const markRead = async (req, res, next) => {
  try {
    const notif = await Notification.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.id, // can only mark your own
      },
    });

    if (!notif) return res.status(404).json({ error: 'Notification not found' });

    await notif.update({ read_at: new Date() });
    return res.status(200).json({ notification: notif });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/notifications/read-all
// Marks all unread notifications as read
const markAllRead = async (req, res, next) => {
  try {
    await Notification.update(
      { read_at: new Date() },
      {
        where: {
          user_id: req.user.id,
          read_at: null,
        },
      }
    );
    return res.status(200).json({ message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getNotifications, markRead, markAllRead };
