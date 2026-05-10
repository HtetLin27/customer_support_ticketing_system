// server/src/controllers/tickets.controller.js
const { Ticket, User, Comment, TicketHistory } = require('../models/index');
const { buildTicketScope } = require('../utils/buildTicketScope');
const { canActOnTicket } = require('../utils/checkOwnership');
const { validateTransition, getAllowedTransitions } = require('../utils/ticketStateMachine');
const { buildTicketFilters, buildTicketSort } = require('../utils/buildTicketFilters');
const {
  offsetPaginate,
  buildPaginationMeta,
  cursorPaginate,
  buildCursorMeta,
} = require('../utils/paginate');
const {
  emitTicketCreated,
  emitTicketUpdated,
  emitStatusChanged,
  emitTicketAssigned,
} = require('../services/socket.service');
const {
  notifyTicketCreated,
  notifyTicketAssigned,
  notifyStatusChanged,
} = require('../services/email.notifications');
const { createNotification } = require('../services/notification.service');

const listTickets = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    // ── Step 1: Role scope — what this user is ALLOWED to see ────────────────
    const scopeWhere = buildTicketScope(req.user);

    // ── Step 2: Filters — what they WANT to see ───────────────────────────────
    const filterWhere = buildTicketFilters(req.query);

    // ── Step 3: Merge scope + filters ─────────────────────────────────────────
    // Scope always wins — a customer can filter by status but NEVER
    // see tickets that aren't theirs
    const where = { ...filterWhere, ...scopeWhere };

    // ── Step 4: Sort ──────────────────────────────────────────────────────────
    const order = buildTicketSort(req.query);

    // ── Step 5: Paginate ──────────────────────────────────────────────────────
    const offset = (page - 1) * limit;
    const parsedLimit = Math.min(Number(limit), 100); // cap at 100

    const { count, rows: tickets } = await Ticket.findAndCountAll({
      where,
      order,
      limit: parsedLimit,
      offset,
      include: [
        { model: User, as: 'customer', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'agent', attributes: ['id', 'name', 'email'] },
      ],
      // distinct: true is REQUIRED when using include with findAndCountAll
      // Without it, count is inflated by JOIN rows
      distinct: true,
    });

    return res.status(200).json({
      tickets,
      pagination: {
        total: count,
        page: Number(page),
        limit: parsedLimit,
        totalPages: Math.ceil(count / parsedLimit),
        hasNext: Number(page) < Math.ceil(count / parsedLimit),
        hasPrev: Number(page) > 1,
      },
      // Echo back applied filters so frontend knows what's active
      filters: {
        status: req.query.status || null,
        priority: req.query.priority || null,
        assigned_to: req.query.assigned_to || null,
        search: req.query.search || null,
        unassigned: req.query.unassigned || null,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id, {
      include: [
        { model: User, as: 'customer', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'agent', attributes: ['id', 'name', 'email'] },
        {
          model: Comment,
          as: 'comments',
          // Customers cannot see internal notes — filter them out
          where: req.user.role === 'customer' ? { is_internal: false } : {},
          required: false, // LEFT JOIN — ticket with zero comments still returns
          include: [{ model: User, as: 'author', attributes: ['id', 'name', 'role'] }],
          order: [['created_at', 'ASC']],
        },
      ],
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Ownership check — can this user see this ticket?
    if (!canActOnTicket(req.user, ticket)) {
      // Return 404 not 403 — don't reveal the ticket exists to unauthorised users
      return res.status(404).json({ error: 'Ticket not found' });
    }

    return res.status(200).json({ ticket });
  } catch (err) {
    next(err);
  }
};

const createTicket = async (req, res, next) => {
  try {
    const { title, description, priority = 'medium' } = req.body;

    const ticket = await Ticket.create({
      title,
      description,
      priority,
      status: 'open', // always open on creation — customer can't set this
      created_by: req.user.id, // from token — customer can't fake this
      assigned_to: null, // unassigned until admin routes it
    });

    // Fetch the full ticket with associations to return
    const full = await Ticket.findByPk(ticket.id, {
      include: [
        { model: User, as: 'customer', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'agent', attributes: ['id', 'name', 'email'] },
      ],
    });

    // Emit real-time event — Phase 5
    const io = req.app.get('io');
    emitTicketCreated(io, full);
    const customer = await User.findByPk(req.user.id);
    notifyTicketCreated(full, customer);
    const admins = await User.findAll({ where: { role: 'admin' } });
    admins.forEach((admin) => {
      createNotification(io, {
        userId: admin.id,
        ticketId: full.id,
        message: `New ticket from ${customer.name}: "${full.title}"`,
      });
    });

    return res.status(201).json({
      message: 'Ticket created successfully',
      ticket: full,
    });
  } catch (err) {
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body; // note is optional — reason for change

    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    // Ownership check — agents can only update their assigned ticket
    if (!canActOnTicket(req.user, ticket)) {
      return res.status(403).json({ error: 'Not authorised for this ticket' });
    }

    // ── State machine validation ──────────────────────────────────────────────
    const result = validateTransition(ticket.status, status, req.user.role);

    if (!result.valid) {
      return res.status(422).json({
        error: result.reason,
        allowed: getAllowedTransitions(ticket.status, req.user.role),
      });
    }

    const previousStatus = ticket.status;

    // ── Update ticket and write history in a transaction ──────────────────────
    // A transaction means BOTH writes succeed or BOTH fail — never one without the other
    const { sequelize } = require('../config/database');

    await sequelize.transaction(async (t) => {
      await ticket.update({ status, updated_at: new Date() }, { transaction: t });

      await TicketHistory.create(
        {
          ticket_id: ticket.id,
          changed_by: req.user.id,
          from_status: previousStatus,
          to_status: status,
          note: note || null,
        },
        { transaction: t }
      );
    });

    // ── Real-time event ───────────────────────────────────────────────────────
    const io = req.app.get('io');
    io.to(`ticket:${ticket.id}`).emit('ticket:statusChanged', {
      ticketId: ticket.id,
      previousStatus,
      newStatus: status,
      changedBy: req.user.id,
      note,
    });
    const customer = await User.findByPk(ticket.created_by);
    notifyStatusChanged(ticket, customer, previousStatus, status);
    const ticketOwner = await User.findByPk(ticket.created_by);
    createNotification(req.app.get('io'), {
      userId: ticket.created_by,
      ticketId: ticket.id,
      message: `Your ticket "${ticket.title}" status changed to ${status}`,
    });

    return res.status(200).json({
      message: 'Status updated successfully',
      previousStatus,
      newStatus: status,
      allowedNext: getAllowedTransitions(status, req.user.role),
      ticket,
    });
  } catch (err) {
    next(err);
  }
};

const assignTicket = async (req, res, next) => {
  try {
    const { agent_id } = req.body;

    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    // Verify the target user exists and is actually an agent
    const agent = await User.findByPk(agent_id);
    if (!agent || agent.role !== 'agent') {
      return res.status(400).json({ error: 'Invalid agent — user not found or not an agent' });
    }

    await ticket.update({
      assigned_to: agent_id,
      status: 'assigned', // auto-transition status when assigned
      updated_at: new Date(),
    });

    // Emit real-time event so agent's dashboard updates instantly
    const io = req.app.get('io');
    emitTicketAssigned(io, ticket.id, agent_id);
    const customer = await User.findByPk(ticket.created_by);
    notifyTicketAssigned(ticket, agent, customer);
    createNotification(req.app.get('io'), {
      userId: agent_id,
      ticketId: ticket.id,
      message: `You have been assigned ticket: "${ticket.title}"`,
    });

    return res.status(200).json({
      message: `Ticket assigned to ${agent.name}`,
      ticket,
    });
  } catch (err) {
    next(err);
  }
};

const updateTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    // Ownership check
    if (!canActOnTicket(req.user, ticket)) {
      return res.status(403).json({ error: 'Not authorised for this ticket' });
    }

    // Customers can only edit open tickets
    if (req.user.role === 'customer' && ticket.status !== 'open') {
      return res.status(422).json({
        error: 'Cannot edit a ticket that is already being processed',
      });
    }

    const { title, description, priority } = req.body;

    // Only update fields that were actually sent
    const updates = {};
    if (title) updates.title = title;
    if (description) updates.description = description;
    if (priority) updates.priority = priority;
    updates.updated_at = new Date();

    await ticket.update(updates);

    return res.status(200).json({ message: 'Ticket updated', ticket });
  } catch (err) {
    next(err);
  }
};

const deleteTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    await ticket.destroy();

    // Notify all connected clients the ticket is gone
    const io = req.app.get('io');
    io.emit('ticket:deleted', { id: req.params.id });

    return res.status(200).json({ message: 'Ticket deleted successfully' });
  } catch (err) {
    next(err);
  }
};

const getTicketHistory = async (req, res, next) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    // Ownership check — customers can see history of their own tickets
    if (!canActOnTicket(req.user, ticket)) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const history = await TicketHistory.findAll({
      where: { ticket_id: req.params.id },
      order: [['created_at', 'ASC']], // oldest first — shows progression
      include: [{ model: User, as: 'changedBy', attributes: ['id', 'name', 'role'] }],
    });

    return res.status(200).json({ history });
  } catch (err) {
    next(err);
  }
};

const getTransitions = async (req, res, next) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    if (!canActOnTicket(req.user, ticket)) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const allowed = getAllowedTransitions(ticket.status, req.user.role);

    return res.status(200).json({
      currentStatus: ticket.status,
      allowed, // e.g. ['resolved', 'assigned'] for an agent on in_progress
    });
  } catch (err) {
    next(err);
  }
};

const getTicketFeed = async (req, res, next) => {
  try {
    const { limit, fetchLimit, cursorWhere } = cursorPaginate(req.query);

    const scopeWhere = buildTicketScope(req.user);
    const filterWhere = buildTicketFilters(req.query);

    const where = { ...cursorWhere, ...filterWhere, ...scopeWhere };

    const tickets = await Ticket.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: fetchLimit,
      include: [
        { model: User, as: 'customer', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'agent', attributes: ['id', 'name', 'email'] },
      ],
    });

    const { data, hasNext, nextCursor } = buildCursorMeta(tickets, limit);
    return res.status(200).json({
      tickets: data,
      hasNext,
      nextCursor,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listTickets,
  getTicket,
  createTicket,
  updateStatus,
  assignTicket,
  updateTicket,
  deleteTicket,
  getTicketHistory,
  getTransitions,
  getTicketFeed,
};
