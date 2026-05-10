import { io } from 'socket.io-client';

let socket = null;

export const connectSocket = (token) => {
  if (socket?.connected) return socket;

  socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5002', {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect', () => {
    console.log(' 🔌 Socket connected: ', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connection failed:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.warn('Socket disconnected:', reason);

    if (reason === 'io server disconnect') {
      socket.connect();
    }
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export const joinTicketRoom = (ticketId) => {
  if (!socket) return;
  socket.emit('ticket:join', { ticketId });
};

export const leaveTicketRoom = (ticketId) => {
  if (!socket) return;
  socket.emit('ticket:leave', { ticketId });
};

export const emitTyping = (ticketId) => {
  socket?.emit('comment:typing', { ticketId });
};

export const emitStopTyping = (ticketId) => {
  socket?.emit('comment:stopTyping', { ticketId });
};
