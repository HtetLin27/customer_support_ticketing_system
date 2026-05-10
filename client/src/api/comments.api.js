import api from './axios';

export const getComments = (ticketId) => api.get(`/tickets/${ticketId}/comments`);
export const createComment = (ticketId, body, isInternal = false) =>
  api.post(`/tickets/${ticketId}/comments`, { body, is_internal: isInternal });
// api.post(`/tickets/${ticketId}/comments`, { body, is_internal: isInternal });
export const updateComment = (ticketId, commentId, body) =>
  api.patch(`/tickets/${ticketId}/comments/${commentId}`, { body });
export const deleteComment = (ticketId, commentId) =>
  api.delete(`/tickets/${ticketId}/comments/${commentId}`);
export const getCommentSummary = (ticketId) => api.get(`/tickets/${ticketId}/comments/summary`);
