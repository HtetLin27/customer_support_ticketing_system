const { sendEmail } = require('./email.service');
const {
  ticketCreatedTemplate,
  ticketAssignedTemplate,
  statusChangedTemplate,
  newCommentTemplate,
  newTicketAdminTemplate,
} = require('./email.templates');
const { User } = require('../models/index');
const config = require('../config/config');

const ticketUrl = (ticketId) => `${config.app.clientUrl}/tickets/${ticketId}`;

const adminUrl = (ticketId) => `${config.app.clientUrl}/admin/tickets/${ticketId}`;

const notifyTicketCreated = async (ticket, customer) => {
  // 1. Send confirmation to customer
  sendEmail({
    to: customer.email,
    subject: `[Ticket #${ticket.id.slice(0, 8).toUpperCase()}] We received your request`,
    html: ticketCreatedTemplate({
      customer,
      ticket,
      ticketUrl: ticketUrl(ticket.id),
    }),
  });

  // 2. Alert all admins
  const admins = await User.findAll({ where: { role: 'admin' } });
  admins.forEach((admin) => {
    sendEmail({
      to: admin.email,
      subject: `[${ticket.priority.toUpperCase()}] New ticket from ${customer.name}`,
      html: newTicketAdminTemplate({
        ticket,
        customer,
        adminUrl: adminUrl(ticket.id),
      }),
    });
  });
};

const notifyTicketAssigned = async (ticket, agent, customer) => {
  sendEmail({
    to: agent.email,
    subject: `[Ticket #${ticket.id.slice(0, 8).toUpperCase()}] Assigned to you`,
    html: ticketAssignedTemplate({
      agent,
      ticket,
      customer,
      ticketUrl: ticketUrl(ticket.id),
    }),
  });
};

const notifyStatusChanged = async (ticket, customer, previousStatus, newStatus) => {
  // Don't email customers about internal agent-to-agent transitions
  const CUSTOMER_VISIBLE_TRANSITIONS = [
    'in_progress',
    'resolved',
    'closed',
    'open', // reopen
  ];

  if (!CUSTOMER_VISIBLE_TRANSITIONS.includes(newStatus)) return;

  sendEmail({
    to: customer.email,
    subject: `[Ticket #${ticket.id.slice(0, 8).toUpperCase()}] Status update: ${newStatus.replace('_', ' ')}`,
    html: statusChangedTemplate({
      customer,
      ticket,
      previousStatus,
      newStatus,
      ticketUrl: ticketUrl(ticket.id),
    }),
  });
};

const notifyNewComment = async (ticket, comment, commenter) => {
  // Never email about internal notes
  if (comment.is_internal) return;

  // Figure out who to notify — the other party
  let recipientId;
  if (commenter.role === 'customer') {
    // Customer commented → notify the assigned agent (or admins if unassigned)
    recipientId = ticket.assigned_to;
  } else {
    // Agent/admin commented → notify the customer
    recipientId = ticket.created_by;
  }

  if (!recipientId) {
    // Ticket unassigned — notify all admins instead
    const admins = await User.findAll({ where: { role: 'admin' } });
    admins.forEach((admin) => {
      sendEmail({
        to: admin.email,
        subject: `[Ticket #${ticket.id.slice(0, 8).toUpperCase()}] New reply from ${commenter.name}`,
        html: newCommentTemplate({
          recipient: admin,
          commenter,
          comment,
          ticket,
          ticketUrl: ticketUrl(ticket.id),
        }),
      });
    });
    return;
  }

  const recipient = await User.findByPk(recipientId);
  if (!recipient) return;

  sendEmail({
    to: recipient.email,
    subject: `[Ticket #${ticket.id.slice(0, 8).toUpperCase()}] New reply from ${commenter.name}`,
    html: newCommentTemplate({
      recipient,
      commenter,
      comment,
      ticket,
      ticketUrl: ticketUrl(ticket.id),
    }),
  });
};

module.exports = {
  notifyTicketCreated,
  notifyTicketAssigned,
  notifyStatusChanged,
  notifyNewComment,
};
