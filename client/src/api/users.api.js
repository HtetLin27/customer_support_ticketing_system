import api from './axios';

export const getAgentWorkload = () => api.get('/users/agents/workload');
export const changeUserRole = (id, role) => api.patch(`/users/${id}/role`, { role });
export const getUsers = () => api.get('/users');
