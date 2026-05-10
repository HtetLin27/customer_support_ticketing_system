const Notification = require('../models/Notification');

// Creates a DB record AND pushes the notification to the
// recipient's socket in real time — one call does both.
const createNotification = async (io, { userId, ticketId, message }) => {
  try {
    const notification = await Notification.create({
      user_id: userId,
      ticket_id: ticketId,
      message,
    });

    // Push to the recipient's personal room instantly
    // They receive it even if they're not on the ticket page
    if (io) {
      io.to(`user:${userId}`).emit('notification:new', {
        id: notification.id,
        message,
        ticket_id: ticketId,
        created_at: notification.created_at,
        read_at: null,
      });
    }

    return notification;
  } catch (err) {
    // Never crash the main flow because a notification failed
    console.error('Failed to create notification:', err.message);
    return null;
  }
};

module.exports = { createNotification };
