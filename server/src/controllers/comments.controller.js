const { Comment, Ticket, User } = require('../models/index');
const { canActOnTicket } = require('../utils/checkOwnership');
const { Op } = require('sequelize');
const { emitCommentCreated } = require('../services/socket.service');
const { notifyNewComment } = require('../services/email.notifications');
const { createNotification } = require('../services/notification.service');

const createComment = async (req, res, next) => {
  console.log('Create Comment Controller Hit');
  try {
    console.log('Create Comment Start');
    const { body, is_internal = false } = req.body;
    const { ticketId } = req.params;

    const ticket = await Ticket.findByPk(ticketId);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    console.log('Ticket Pass');

    if (!canActOnTicket(req.user, ticket)) {
      return res.status(403).json({ error: 'Not authorised for this ticket' });
    }

    console.log('Permission Pass');

    if (is_internal && req.user.role === 'customer') {
      return res.status(403).json({
        error: 'Customers cannot post on internal notes',
      });
    }

    console.log('Internal Note Pass');

    if (req.user.role === 'customer' && ticket.status === 'closed') {
      return res.status(422).json({
        error: 'Cannot comment on a closed ticket',
      });
    }
    console.log('Closed Ticket Pass');

    if (req.user.role === 'customer' && ticket.status === 'resolved' && !is_internal) {
      const { sequelize } = require('../config/database');
      const TicketHistory = require('../models/TicketHistory');

      await sequelize.transaction(async (t) => {
        await ticket.update({ status: 'open', updated_at: new Date() }, { transaction: t });

        await TicketHistory.create(
          {
            ticket_id: ticket.id,
            changed_by: req.user.id,
            from_status: 'resolved',
            to_status: 'open',
            note: 'Auto-reopened: customer replied after resolution',
          },
          { transaction: t }
        );
      });

      // Notify everyone watching this ticket
      const io = req.app.get('io');
      io.to(`ticket:${ticketId}`).emit('ticket:statusChanged', {
        ticketId,
        previousStatus: 'resolved',
        newStatus: 'open',
        reason: 'Customer replied — auto-reopened',
      });
      const commenter = await User.findByPk(req.user.id);
      notifyNewComment(ticket, full, commenter);
    }

    console.log('Auto-Reopen Pass');

    const comment = await Comment.create({
      ticket_id: ticketId,
      user_id: req.user.id,
      body,
      is_internal,
    });

    console.log('Comment Creation Pass');

    const full = await Comment.findByPk(comment.id, {
      include: [{ model: User, as: 'author', attributes: ['id', 'name', 'role'] }],
    });

    console.log('Full Comment Fetch Pass');

    await ticket.update({ updated_at: new Date() });

    const io = req.app.get('io');
    emitCommentCreated(io, ticketId, full);

    console.log('Emit Comment Pass');

    const notifyUserId =
      req.user.role === 'customer'
        ? ticket.assigned_to // notify agent
        : ticket.created_by; // notify customer

    if (notifyUserId && notifyUserId !== req.user.id) {
      createNotification(req.app.get('io'), {
        userId: notifyUserId,
        ticketId: ticketId,
        message: `New reply on ticket "${ticket.title}"`,
      });
    }

    return res.status(201).json({
      message: 'Comment added',
      comment: full,
    });
  } catch (error) {
    next(error);
  }
};

const getComments = async (req, res, next) => {
  try {
    const { ticketId } = req.params;

    const ticket = await Ticket.findByPk(ticketId);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    if (!canActOnTicket(req.user, ticket)) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const where = { ticket_id: ticketId };
    if (req.user.role === 'customer') {
      where.is_internal = false;
    }

    const comments = await Comment.findAll({
      where,
      order: [['created_at', 'ASC']],
      include: [{ model: User, as: 'author', attributes: ['id', 'name', 'role'] }],
    });

    return res.status(200).json({ comments });
  } catch (error) {
    next(error);
  }
};

const updateComment = async (req, res, next) => {
  try {
    const { ticketId, commentId } = req.params;
    const { body } = req.body;

    const comment = await Comment.findOne({
      where: { id: commentId, ticket_id: ticketId },
    });

    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    if (comment.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only edit your own comments' });
    }

    if (req.user.role !== 'admin') {
      const EDIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
      const ageMs = Date.now() - new Date(comment.created_at).getTime();

      if (ageMs > EDIT_WINDOW_MS) {
        return res.status(422).json({
          error: 'Comments can only be edited within 15 minutes of posting',
        });
      }
    }

    await comment.update({ body });

    const full = await Comment.findByPk(commentId, {
      include: [{ model: User, as: 'author', attributes: ['id', 'name', 'role'] }],
    });

    // Notify connected clients
    const io = req.app.get('io');
    io.to(`ticket:${ticketId}`).emit('comment:updated', {
      comment: full,
      ticketId,
    });

    return res.status(200).json({ message: 'Comment updated', comment: full });
  } catch (error) {
    next(error);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const { ticketId, commentId } = req.params;

    const comment = await Comment.findOne({
      where: { id: commentId, ticket_id: ticketId },
    });

    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    await comment.destroy();

    const io = req.app.get('io');
    io.to(`ticket:${ticketId}`).emit('comment:deleted', { commentId, ticketId });

    return res.status(200).json({ message: 'Comment deleted' });
  } catch (err) {
    next(err);
  }
};

const getCommentSummary = async (req, res, next) => {
  try {
    const { ticketId } = req.params;

    const ticket = await Ticket.findByPk(ticketId);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const [publicCount, internalCount] = await Promise.all([
      Comment.count({ where: { ticket_id: ticketId, is_internal: false } }),
      Comment.count({ where: { ticket_id: ticketId, is_internal: true } }),
    ]);

    // Find the last public reply — used to calculate response time
    const lastPublicReply = await Comment.findOne({
      where: { ticket_id: ticketId, is_internal: false },
      order: [['created_at', 'DESC']],
      include: [{ model: User, as: 'author', attributes: ['id', 'name', 'role'] }],
    });

    // First response time — time between ticket creation and first agent reply
    const firstAgentReply = await Comment.findOne({
      where: { ticket_id: ticketId, is_internal: false },
      include: [
        {
          model: User,
          as: 'author',
          where: { role: { [Op.in]: ['agent', 'admin'] } },
          attributes: ['id', 'name', 'role'],
        },
      ],
      order: [['created_at', 'ASC']],
    });

    let firstResponseTimeMs = null;
    if (firstAgentReply) {
      firstResponseTimeMs = new Date(firstAgentReply.created_at) - new Date(ticket.created_at);
    }

    return res.status(200).json({
      summary: {
        publicComments: publicCount,
        internalNotes: internalCount,
        total: publicCount + internalCount,
        lastPublicReply: lastPublicReply || null,
        firstResponseTimeMs, // null if no agent has replied yet
        firstResponseTimeMins: firstResponseTimeMs ? Math.round(firstResponseTimeMs / 60000) : null,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createComment,
  getComments,
  updateComment,
  deleteComment,
  getCommentSummary,
};
