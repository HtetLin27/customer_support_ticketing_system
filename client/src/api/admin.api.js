import api from './axios';

export const getAdminStats = () => api.get('/admin/stats');
export const getVolumeReport = (days) => api.get(`/admin/reports/volume?days=${days}`);
export const getAgentReport = () => api.get('/admin/reports/agents');
export const getTicketsByStatus = () => api.get('/admin/reports/tickets-by-status');
export const getAdminUsers = () => api.get('/admin/users');
export const updateUserRole = (id, role) => api.patch(`/admin/users/${id}/role`, { role });
export const getAdminAgentWorkload = () => api.get('/admin/agents/workload');
