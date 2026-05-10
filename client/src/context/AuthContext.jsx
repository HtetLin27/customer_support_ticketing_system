import { connectSocket, disconnectSocket } from '../services/socket';
import api from '../api/axios';
import { createContext, useContext, useEffect, useState } from 'react';

const Authcontext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const saved = localStorage.getItem('user');
    if (token && saved) {
      const user = JSON.parse(saved);
      setUser(user);
      connectSocket(token);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    connectSocket(token);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    disconnectSocket();
  };

  return (
    <Authcontext.Provider value={{ user, loading, login, logout }}>
      {!loading && children}
    </Authcontext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(Authcontext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
