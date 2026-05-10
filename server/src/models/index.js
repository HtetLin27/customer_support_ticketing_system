// This file defines every relationship between models.
// Load this once at startup — it sets up all the JOINs.

const User = require('./User');
const Ticket = require('./Ticket');
const Comment = require('./Comment');
const TicketHistory = require('./TicketHistory');
const Notification = require('./Notification');

// ── User ↔ Ticket relationships ───────────────────────────────────────────────
User.hasMany(Ticket, { foreignKey: 'created_by', as: 'submittedTickets' });
Ticket.belongsTo(User, { foreignKey: 'created_by', as: 'customer' });

User.hasMany(Ticket, { foreignKey: 'assigned_to', as: 'assignedTickets' });
Ticket.belongsTo(User, { foreignKey: 'assigned_to', as: 'agent' });

// ── Ticket ↔ Comment relationships ───────────────────────────────────────────
Ticket.hasMany(Comment, { foreignKey: 'ticket_id', as: 'comments' });
Comment.belongsTo(Ticket, { foreignKey: 'ticket_id', as: 'ticket' });

// ── User ↔ Comment relationship ───────────────────────────────────────────────
User.hasMany(Comment, { foreignKey: 'user_id', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'user_id', as: 'author' });

Ticket.hasMany(TicketHistory, { foreignKey: 'ticket_id', as: 'history' });
TicketHistory.belongsTo(Ticket, { foreignKey: 'ticket_id', as: 'ticket' });

User.hasMany(TicketHistory, { foreignKey: 'changed_by', as: 'statusChanges' });
TicketHistory.belongsTo(User, { foreignKey: 'changed_by', as: 'changedBy' });

User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Ticket.hasMany(Notification, { foreignKey: 'ticket_id', as: 'notifications' });
Notification.belongsTo(Ticket, { foreignKey: 'ticket_id', as: 'ticket' });

module.exports = { User, Ticket, Comment, TicketHistory, Notification };
