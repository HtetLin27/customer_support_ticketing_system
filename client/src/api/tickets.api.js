import api from './axios';

const toParams = (filters) =>
  new URLSearchParams(
    Object.entries(filters).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  ).toString();

export const getTickets = (filters = {}) => api.get(`/tickets?${toParams(filters)}`);
export const getTicket = (id) => api.get(`/tickets/${id}`);
export const createTicket = (data) => api.post('/tickets', data);
export const updateTicket = (id, data) => api.patch(`/tickets/${id}`, data);
export const updateStatus = (id, status, note) =>
  api.patch(`/tickets/${id}/status`, { status, note });
export const assignTicket = (id, agent_id) => api.patch(`/tickets/${id}/assign`, { agent_id });
export const autoAssign = (id) => api.post(`/tickets/${id}/assign/auto`);
export const deleteTicket = (id) => api.delete(`/tickets/${id}`);
export const getTransitions = (id) => api.get(`/tickets/${id}/transitions`);
export const getHistory = (id) => api.get(`/tickets/${id}/history`);
export const getTicketFeed = (cursor) =>
  api.get(`/tickets/feed${cursor ? `?cursor=${cursor}` : ''}`);
