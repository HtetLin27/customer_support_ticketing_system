const { Ticket, User, Comment, TicketHistory } = require('../models/index');
const { Op, fn, col, literal } = require('sequelize');
const { sequelize } = require('../config/database');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/stats
// High-level KPI numbers for the overview dashboard
// ─────────────────────────────────────────────────────────────────────────────
const getStats = async (req, res, next) => {
  try {
    const [
      totalTickets,
      openTickets,
      resolvedTickets,
      closedTickets,
      totalAgents,
      totalCustomers,
      avgFirstResponse,
    ] = await Promise.all([
      Ticket.count(),
      Ticket.count({ where: { status: 'open' } }),
      Ticket.count({ where: { status: 'resolved' } }),
      Ticket.count({ where: { status: 'closed' } }),
      User.count({ where: { role: 'agent' } }),
      User.count({ where: { role: 'customer' } }),

      // Average first response time in minutes
      // = avg time from ticket creation to first agent comment
      sequelize.query(
        `
        WITH first_agent_replies AS (
          SELECT
            t.id AS ticket_id,
            MIN(c.created_at) AS first_reply_at,
            t.created_at AS ticket_created_at
          FROM tickets t
          JOIN comments c ON c.ticket_id = t.id
          JOIN users u ON u.id = c.user_id
          WHERE u.role IN ('agent', 'admin')
            AND c.is_internal = false
          GROUP BY t.id, t.created_at
        )
        SELECT AVG(
          EXTRACT(EPOCH FROM (first_reply_at - ticket_created_at)) / 60
        ) AS avg_minutes
        FROM first_agent_replies
      `,
        { type: sequelize.QueryTypes.SELECT }
      ),
    ]);

    const avgMins = avgFirstResponse[0]?.avg_minutes;

    return res.status(200).json({
      stats: {
        totalTickets,
        openTickets,
        resolvedTickets,
        closedTickets,
        inProgressTickets: await Ticket.count({ where: { status: 'in_progress' } }),
        totalAgents,
        totalCustomers,
        avgFirstResponseMins: avgMins ? Math.round(Number(avgMins)) : null,
        resolutionRate:
          totalTickets > 0
            ? Math.round(((resolvedTickets + closedTickets) / totalTickets) * 100)
            : 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/reports/volume
// Ticket volume per day for the last 30 days
// ─────────────────────────────────────────────────────────────────────────────
const getVolumeReport = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const from = new Date();
    from.setDate(from.getDate() - days);

    // Tickets opened per day
    const opened = await sequelize.query(
      `
      SELECT
        DATE(created_at) AS date,
        COUNT(*) AS count
      FROM tickets
      WHERE created_at >= :from
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `,
      {
        replacements: { from },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    // Tickets closed/resolved per day
    const closed = await sequelize.query(
      `
      SELECT
        DATE(th.created_at) AS date,
        COUNT(*) AS count
      FROM ticket_history th
      WHERE th.to_status IN ('resolved', 'closed')
        AND th.created_at >= :from
      GROUP BY DATE(th.created_at)
      ORDER BY date ASC
    `,
      {
        replacements: { from },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    return res.status(200).json({ opened, closed });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/reports/agents
// Per-agent performance stats
// ─────────────────────────────────────────────────────────────────────────────
const getAgentReport = async (req, res, next) => {
  try {
    const agents = await User.findAll({
      where: { role: 'agent' },
      attributes: ['id', 'name', 'email'],
    });

    const report = await Promise.all(
      agents.map(async (agent) => {
        const [assigned, resolved, avgResponse] = await Promise.all([
          Ticket.count({ where: { assigned_to: agent.id } }),
          Ticket.count({
            where: {
              assigned_to: agent.id,
              status: { [Op.in]: ['resolved', 'closed'] },
            },
          }),
          // Avg response time for this agent
          sequelize.query(
            `
          WITH first_agent_replies AS (
            SELECT
              t.id AS ticket_id,
              MIN(c.created_at) AS first_reply_at,
              t.created_at AS ticket_created_at
            FROM tickets t
            JOIN comments c ON c.ticket_id = t.id
            WHERE t.assigned_to = :agentId
              AND c.user_id = :agentId
              AND c.is_internal = false
            GROUP BY t.id, t.created_at
          )
          SELECT AVG(
            EXTRACT(EPOCH FROM (first_reply_at - ticket_created_at)) / 60
          ) AS avg_minutes
          FROM first_agent_replies
        `,
            {
              replacements: { agentId: agent.id },
              type: sequelize.QueryTypes.SELECT,
            }
          ),
        ]);

        return {
          id: agent.id,
          name: agent.name,
          email: agent.email,
          stats: {
            totalAssigned: assigned,
            totalResolved: resolved,
            resolutionRate: assigned > 0 ? Math.round((resolved / assigned) * 100) : 0,
            avgResponseMins: avgResponse[0]?.avg_minutes
              ? Math.round(Number(avgResponse[0].avg_minutes))
              : null,
          },
        };
      })
    );

    // Sort by resolution rate descending
    report.sort((a, b) => b.stats.resolutionRate - a.stats.resolutionRate);

    return res.status(200).json({ agents: report });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/reports/tickets-by-status
// Ticket counts grouped by status — for the doughnut chart
// ─────────────────────────────────────────────────────────────────────────────
const getTicketsByStatus = async (req, res, next) => {
  try {
    const rows = await Ticket.findAll({
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true,
    });

    return res.status(200).json({
      data: rows.map((r) => ({ status: r.status, count: Number(r.count) })),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getStats, getVolumeReport, getAgentReport, getTicketsByStatus };
