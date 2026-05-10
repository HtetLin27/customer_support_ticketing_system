import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';

const timeAgo = (date) => {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleClick = async (notification) => {
    if (!notification.read_at) {
      await markRead(notification.id);
    }
    setOpen(false);
    navigate(`/tickets/${notification.ticket_id}`);
  };

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition"
        aria-label="Notifications"
      >
        {/* Bell icon */}
        <svg
          className="w-5 h-5 text-gray-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002
               6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388
               6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3
               0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500
                           text-white text-xs rounded-full flex items-center
                           justify-center font-medium leading-none"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 bg-white border
                        border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden"
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3
                          border-b border-gray-100"
          >
            <h3 className="text-sm font-semibold text-gray-900">
              Notifications
              {unreadCount > 0 && (
                <span
                  className="ml-2 bg-red-100 text-red-600 text-xs
                                 px-1.5 py-0.5 rounded-full"
                >
                  {unreadCount} new
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-2xl mb-2">🔔</p>
                <p className="text-sm text-gray-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`px-4 py-3 cursor-pointer transition-colors
                    hover:bg-gray-50
                    ${!n.read_at ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Unread dot */}
                    <div
                      className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0
                      ${!n.read_at ? 'bg-blue-500' : 'bg-transparent'}`}
                    />

                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm leading-snug
                        ${!n.read_at ? 'text-gray-900 font-medium' : 'text-gray-600'}`}
                      >
                        {n.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-400 text-center">
                Showing last {notifications.length} notifications
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
