const { User, Ticket } = require('../models/index');
const { Op, fn, col, literal } = require('sequelize');

const getAgentWorkload = async (req, res, next) => {
  try {
    const agents = await User.findAll({
      where: { role: 'agent' },
      attributes: ['id', 'name', 'email'],
      include: [
        {
          model: Ticket,
          as: 'assignedTickets',
          attributes: ['status'],
          required: false, // LEFT JOIN — include agents with zero tickets
        },
      ],
    });

    const workload = agents.map((agent) => {
      const tickets = agent.assignedTickets || [];

      const counts = {
        assigned: 0,
        in_progress: 0,
        resolved: 0,
        total_active: 0,
      };
      tickets.forEach((t) => {
        if (t.status === 'assigned') counts.assigned++;
        if (t.status === 'in_progress') counts.in_progress++;
        if (t.status === 'resolved') counts.resolved++;
      });

      counts.total_active = counts.assigned + counts.in_progress;

      return {
        id: agent.id,
        name: agent.name,
        email: agent.email,
        workload: counts,
        // Simple availability signal for the UI
        available: counts.total_active < 10,
      };
    });

    workload.sort((a, b) => a.workload.total_active - b.workload.total_active);

    return res.status(200).json({ agents: workload });
  } catch (error) {
    next(error);
  }
};

// POST /api/tickets/:id/assign/auto
// Automatically assigns the ticket to the least busy available agent.

const autoAssign = async (req, res, next) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    if (ticket.status !== 'open') {
      return res.status(422).json({
        error: 'Only open tickets can be auto-assigned',
      });
    }

    const agentLoads = await Ticket.findAll({
      attributes: ['assigned_to', [fn('COUNT', col('id')), 'active_count']],
      where: {
        status: { [Op.in]: ['assigned', 'in_progress'] },
        assigned_to: { [Op.ne]: null },
      },
      group: ['assigned_to'],
      raw: true,
    });

    const loadMap = {};
    agentLoads.forEach((row) => {
      loadMap[row.assigned_to] = Number(row.active_count);
    });

    const agents = await User.findAll({
      where: { role: 'agent' },
      attributes: ['id', 'name'],
    });

    if (agents.length === 0) {
      return res.status(422).json({ error: 'No agents available' });
    }

    const chosen = agents.reduce((least, agent) => {
      const load = loadMap[agent.id] || 0;
      const leastLoad = loadMap[least.id] || 0;
      return load < leastLoad ? agent : least;
    });

    await ticket.update({
      assigned_to: chosen.id,
      status: 'assigned',
      updated_at: new Date(),
    });

    const io = req.app.get('io');
    io.emit('ticket:assigned', { ticketId: ticket.id, agentId: chosen.id });

    return res.status(200).json({
      message: `Auto-assigned to ${chosen.name}`,
      agent: { id: chosen.id, name: chosen.name },
      ticket,
    });
  } catch (error) {
    next(error);
  }
};

const reassignTicket = async (req, res, next) => {
  try {
    const { agent_id, reason } = req.body;

    const ticket = await Ticket.findByPk(req.params.id, {
      include: [{ model: User, as: 'agent', attributes: ['id', 'name'] }],
    });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const newAgent = await User.findByPk(agent_id);
    if (!newAgent || newAgent.role !== 'agent') {
      return res.status(400).json({ error: 'Invalid agent' });
    }

    const previousAgent = ticket.agent;

    await ticket.update({
      assigned_to: agent_id,
      status: 'assigned', // reset to assigned on reassignment
      updated_at: new Date(),
    });

    const io = req.app.get('io');
    io.emit('ticket:reassigned', {
      ticketId: ticket.id,
      previousAgentId: previousAgent?.id,
      newAgentId: agent_id,
    });

    return res.status(200).json({
      message: `Reassigned from ${previousAgent?.name || 'unassigned'} to ${newAgent.name}`,
      previousAgent: previousAgent || null,
      newAgent: { id: newAgent.id, name: newAgent.name },
      ticket,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAgentWorkload, autoAssign, reassignTicket };
