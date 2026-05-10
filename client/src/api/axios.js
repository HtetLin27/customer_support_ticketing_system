import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5002/api',
});

// Before every request — attach the JWT token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If any response returns 401 — token expired, force logout
api.interceptors.response.use(
  (response) => response, // Just return the response if it's successful
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token'); // Clear the token
      window.location.href = '/login'; // Redirect to login page
    }
    return Promise.reject(error);
  }
);

export default api;
