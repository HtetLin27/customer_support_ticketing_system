// server/src/index.js

require('dotenv').config(); // Load .env variables first — always first

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const config = require('./config/config');
const { connectDB } = require('./config/database');
require('./models/index');

const { initSocket } = require('./services/socket.service');

const app = express();
const server = http.createServer(app); // Wrap Express in an HTTP server (needed for Socket.io)
const { port, clientUrl } = config.app;

// ─── Socket.io setup ──────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: config.app.clientUrl,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // How long to wait before giving up on a reconnect
  pingTimeout: 60000,
  pingInterval: 25000,
});

initSocket(io);

app.set('io', io); // Attach io to app so controllers can access it

// ─── Global middleware ─────────────────────────────────────────────────────────
app.use(helmet()); // Security headers
app.use(cors({ origin: clientUrl }));
app.use(morgan('dev')); // Request logging
app.use(express.json()); // Parse JSON request bodies
app.use('/api/admin', require('./routes/admin.routes'));

// ─── Routes (we'll fill these in Phase 3 & 4) ─────────────────────────────────
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/tickets', require('./routes/tickets.routes'));
app.use('/api/users', require('./routes/users.routes'));
app.use('/api/tickets/:ticketId/comments', require('./routes/comments.routes'));
app.use('/api/notifications', require('./routes/notifications.routes'));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ─── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// ─── Start server ─────────────────────────────────────────────────────────────
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Set PORT in server/.env to a free port.`);
  } else {
    console.error('Server failed to start:', error);
  }
  process.exit(1);
});

connectDB()
  .then(() => {
    server.listen(port, () => console.log(`🚀 Server running on port ${port}`));
  })
  .catch((error) => {
    console.error('Database connection failed:', error);
    process.exit(1);
  });
