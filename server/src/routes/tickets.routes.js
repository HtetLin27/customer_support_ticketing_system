// server/src/routes/tickets.routes.js
const express = require('express');
const { protect, authorise } = require('../middleware/auth.middleware');
const {
  createRules,
  statusRules,
  assignRules,
  listRules,
} = require('../middleware/ticket.validator');
const {
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
} = require('../controllers/tickets.controller');

const { autoAssign, reassignTicket } = require('../controllers/users.controller');

const router = express.Router();

// Every route requires a valid token — no exceptions
router.use(protect);

// ── Read ──────────────────────────────────────────────────────────────────────
router.get('/', authorise('customer', 'agent', 'admin'), listRules, listTickets);
router.get('/feed', authorise('agnet', 'admin'), getTicketFeed);
router.get('/:id', authorise('customer', 'agent', 'admin'), getTicket);
router.get('/:id/history', authorise('customer', 'agent', 'admin'), getTicketHistory);
router.get('/:id/transitions', authorise('customer', 'agent', 'admin'), getTransitions);

// ── Write ─────────────────────────────────────────────────────────────────────
router.post('/', authorise('customer', 'admin'), createRules, createTicket);
router.patch('/:id', authorise('customer', 'admin'), createRules, updateTicket);
router.patch('/:id/status', authorise('agent', 'admin'), statusRules, updateStatus);
router.patch('/:id/assign', authorise('admin'), assignRules, assignTicket);
router.delete('/:id', authorise('admin'), deleteTicket);

router.post('/:id/assign/auto', protect, authorise('admin'), autoAssign);
router.patch('/:id/reassign', protect, authorise('admin'), reassignTicket);

module.exports = router;
