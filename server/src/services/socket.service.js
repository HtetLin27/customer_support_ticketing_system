const jwt = require('jsonwebtoken');
const config = require('../config/config');

const initSocket = (io) => {
  // This runs BEFORE the connection event — unauthenticated sockets never connect.
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret);

      socket.user = { id: decoded.id, role: decoded.role };
      next();
    } catch (error) {
      next(new Error('Invalid or expired token'));
    }
  });

  //--- Connection handler -----------
  io.on('connection', (socket) => {
    console.log(`🔌 ${socket.user.role} connected - socket: ${socket.id}`);

    if (socket.user.role === 'admin') {
      socket.join('admin:dashboard');
    }
    socket.join(`user:${socket.user.id}`);
    socket.on('ticket:join', async ({ ticketId }) => {
      if (!ticketId) return;

      try {
        const { Ticket } = require('../models/index');
        const ticket = await Ticket.findByPk(ticketId);

        if (!ticket) {
          socket.emit('error', { message: 'Ticket not found' });
        }

        const { canActOnTicket } = require('../utils/checkOwnership');
        if (!canActOnTicket(socket.user, ticket)) {
          socket.emit('error', { message: 'Not authorised for this ticket' });
          return;
        }

        const roomName = `ticket:${ticketId}`;
        socket.join(roomName);
        console.log(`  → joined room ${roomName}`);

        socket.emit('ticket:joined', { ticketId, roomName });
      } catch (error) {
        socket.emit('error', { message: 'Failed to join ticket room' });
      }
    });

    socket.on('ticket:leave', ({ ticketId }) => {
      const roomName = `ticket:${ticketId}`;
      socket.leave(roomName);
      console.log(`  ← left room ${roomName}`);
    });

    socket.on('comment:typing', ({ ticketId }) => {
      const roomName = `ticket:${ticketId}`;
      // broadcast.to = emit to everyone in the room EXCEPT the sender
      socket.broadcast.to(roomName).emit('comment:typing', {
        user: { id: socket.user.id, role: socket.user.role },
        ticketId,
      });
    });

    socket.on('comment:stopTyping', ({ ticketId }) => {
      socket.broadcast.to(`ticket:${ticketId}`).emit('comment:stopTyping', {
        userId: socket.user.id,
      });
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 ${socket.user.role} disconnected — ${reason}`);
    });
  });

  return io;
};

// ── Helper functions — emit events from controllers ───────────────────────────
// These are the functions controllers call after DB writes

const emitTicketCreated = (io, ticket) => {
  // New ticket — notify admin dashboard
  io.to('admin:dashboard').emit('ticket:created', ticket);
};

const emitTicketUpdated = (io, ticketId, data) => {
  // Notify everyone watching this specific ticket
  io.to(`ticket:${ticketId}`).emit('ticket:updated', data);
  // Also notify admin dashboard
  io.to('admin:dashboard').emit('ticket:updated', { ticketId, ...data });
};

const emitStatusChanged = (io, ticketId, data) => {
  io.to(`ticket:${ticketId}`).emit('ticket:statusChanged', data);
  io.to('admin:dashboard').emit('ticket:statusChanged', { ticketId, ...data });
};

const emitTicketAssigned = (io, ticketId, agentId) => {
  io.to(`ticket:${ticketId}`).emit('ticket:assigned', { ticketId, agentId });
  io.to('admin:dashboard').emit('ticket:assigned', { ticketId, agentId });
  // Notify the agent's personal room so their dashboard updates
  io.to(`user:${agentId}`).emit('ticket:assigned', { ticketId });
};

const emitCommentCreated = (io, ticketId, comment) => {
  io.to(`ticket:${ticketId}`).emit('comment:created', { ticketId, comment });
};

module.exports = {
  initSocket,
  emitTicketCreated,
  emitTicketUpdated,
  emitStatusChanged,
  emitTicketAssigned,
  emitCommentCreated,
};
