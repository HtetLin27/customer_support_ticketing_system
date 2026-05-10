import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getNotifications, markRead, markAllRead } from '../api/notifications.api';
import { connectSocket, getSocket } from '../services/socket';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  // Load notifications on mount
  const load = useCallback(async () => {
    if (!user) return;
    try {
      const res = await getNotifications();
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch (err) {
      console.error('Failed to load notifications:', err?.response?.data || err.message);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  // Listen for real-time notifications via socket
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('token');
    const socket = getSocket() || (token ? connectSocket(token) : null);
    if (!socket) return;

    const handleNew = (notification) => {
      // Prepend new notification to the list
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    const handleConnect = () => {
      // Re-sync in case any notifications were missed while disconnected
      load();
    };

    socket.on('notification:new', handleNew);
    socket.on('connect', handleConnect);
    return () => {
      socket.off('notification:new', handleNew);
      socket.off('connect', handleConnect);
    };
  }, [user, load]);

  const handleMarkRead = async (id) => {
    await markRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
    );
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markRead: handleMarkRead,
        markAllRead: handleMarkAllRead,
        reload: load,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be inside NotificationProvider');
  return ctx;
};
