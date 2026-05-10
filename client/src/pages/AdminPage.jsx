import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import AdminOverview from '../components/admin/AdminOverview';
import AdminUsers from '../components/admin/AdminUsers';
import AdminAgents from '../components/admin/AdminAgents';
import AdminReports from '../components/admin/AdminReports';

const NAV_ITEMS = [
  { to: '/admin', label: '📊 Overview', end: true },
  { to: '/admin/users', label: '👥 Users' },
  { to: '/admin/agents', label: '🧑‍💼 Agents' },
  { to: '/admin/reports', label: '📈 Reports' },
];

export default function AdminPage() {
  return (
    <div className="flex gap-6">
      {/* Sidebar navigation */}
      <aside className="w-44 flex-shrink-0">
        <nav className="bg-white border border-gray-200 rounded-xl overflow-hidden sticky top-20">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Admin Panel
            </p>
          </div>
          <div className="py-2">
            {NAV_ITEMS.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `block px-4 py-2.5 text-sm transition-colors
                   ${
                     isActive
                       ? 'bg-blue-50 text-blue-700 font-medium'
                       : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                   }`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <Routes>
          <Route index element={<AdminOverview />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="agents" element={<AdminAgents />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  );
}
