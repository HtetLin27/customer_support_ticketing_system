import { useCallback, useEffect } from 'react';
import {
  emitStopTyping,
  emitTyping,
  getSocket,
  joinTicketRoom,
  leaveTicketRoom,
} from '../services/socket';

const useTicketSocket = (ticketId, handlers = {}) => {
  useEffect(() => {
    const socket = getSocket();

    if (!socket || !ticketId) return;

    joinTicketRoom(ticketId);

    if (handlers.onTicketJoined) socket.on('ticket:joined', handlers.onTicketJoined);
    if (handlers.onStatusChanged) socket.on('ticket:statusChanged', handlers.onStatusChanged);
    if (handlers.onAssigned) socket.on('ticket:assigned', handlers.onAssigned);
    if (handlers.onUpdated) socket.on('ticket:updated', handlers.onUpdated);
    if (handlers.onCommentCreated) socket.on('comment:created', handlers.onCommentCreated);
    if (handlers.onCommentUpdated) socket.on('comment:updated', handlers.onCommentUpdated);
    if (handlers.onCommentDeleted) socket.on('comment:deleted', handlers.onCommentDeleted);
    if (handlers.onTyping) socket.on('comment:typing', handlers.onTyping);
    if (handlers.onStopTyping) socket.on('comment:stopTyping', handlers.onStopTyping);

    // ── Cleanup —
    return () => {
      leaveTicketRoom(ticketId);

      socket.off('ticket:joined');
      socket.off('ticket:statusChanged');
      socket.off('ticket:assigned');
      socket.off('ticket:updated');
      socket.off('comment:created');
      socket.off('comment:updated');
      socket.off('comment:deleted');
      socket.off('comment:typing');
      socket.off('comment:stopTyping');
    };
  }, [ticketId]);

  const sendTyping = useCallback(() => emitTyping(ticketId), [ticketId]);
  const sendStopTyping = useCallback(() => emitStopTyping(ticketId), [ticketId]);

  return { sendTyping, sendStopTyping };
};

export default useTicketSocket;
