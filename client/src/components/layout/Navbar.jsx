// client/src/components/layout/Navbar.jsx
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) =>
    location.pathname.startsWith(path)
      ? 'text-blue-600 font-medium'
      : 'text-gray-600 hover:text-gray-900';

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left — logo + nav links */}
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="font-semibold text-gray-900 flex items-center gap-2">
            🎫 <span>Support</span>
          </Link>

          <div className="flex items-center gap-4 text-sm">
            <Link to="/dashboard" className={isActive('/dashboard')}>
              Dashboard
            </Link>

            {/* Customer — can create tickets */}
            {user?.role === 'customer' && (
              <Link to="/tickets/new" className={isActive('/tickets/new')}>
                New Ticket
              </Link>
            )}

            {/* Admin — has admin panel link */}
            {user?.role === 'admin' && (
              <Link to="/admin" className={isActive('/admin')}>
                Admin Panel
              </Link>
            )}
          </div>
        </div>

        {/* Right — user info + logout */}
        <div className="flex items-center gap-3">
          {/* Notification bell */}
          <NotificationBell />

          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
            ${
              user?.role === 'admin'
                ? 'bg-purple-100 text-purple-700'
                : user?.role === 'agent'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-blue-100 text-blue-700'
            }`}
          >
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
