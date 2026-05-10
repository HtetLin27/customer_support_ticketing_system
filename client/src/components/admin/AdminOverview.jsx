import { useState, useEffect } from 'react';
import { getAdminStats, getTicketsByStatus } from '../../api/admin.api';
import { getTickets } from '../../api/tickets.api';
import { PageSpinner } from '../ui/Spinner';
import { StatusBadge, PriorityBadge } from '../ui/StatusBadge';
import { useNavigate } from 'react-router-dom';

// Simple bar component — no chart library needed for basics
const Bar = ({ value, max, color }) => (
  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
    <div
      className={`h-full ${color} rounded-full transition-all duration-500`}
      style={{ width: max > 0 ? `${(value / max) * 100}%` : '0%' }}
    />
  </div>
);

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [byStatus, setByStatus] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, statusRes, recentRes] = await Promise.all([
          getAdminStats(),
          getTicketsByStatus(),
          getTickets({ limit: 5 }),
        ]);
        setStats(statsRes.data.stats);
        setByStatus(statusRes.data.data);
        setRecent(recentRes.data.tickets);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <PageSpinner />;
  if (!stats) return null;

  const kpis = [
    { label: 'Total Tickets', value: stats.totalTickets, color: 'text-gray-900' },
    { label: 'Open', value: stats.openTickets, color: 'text-blue-600' },
    { label: 'In Progress', value: stats.inProgressTickets, color: 'text-purple-600' },
    { label: 'Resolution Rate', value: `${stats.resolutionRate}%`, color: 'text-green-600' },
    {
      label: 'Avg Response',
      value: stats.avgFirstResponseMins != null ? `${stats.avgFirstResponseMins}m` : '—',
      color: 'text-orange-600',
    },
    { label: 'Active Agents', value: stats.totalAgents, color: 'text-indigo-600' },
  ];

  const STATUS_COLORS = {
    open: 'bg-blue-400',
    assigned: 'bg-yellow-400',
    in_progress: 'bg-purple-400',
    resolved: 'bg-green-400',
    closed: 'bg-gray-400',
  };

  const maxStatusCount = Math.max(...byStatus.map((s) => s.count), 1);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Overview</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{k.label}</p>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tickets by status */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Tickets by status</h2>
          <div className="space-y-3">
            {byStatus.map((s) => (
              <div key={s.status}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="capitalize text-gray-600">{s.status.replace('_', ' ')}</span>
                  <span className="font-medium text-gray-900">{s.count}</span>
                </div>
                <Bar
                  value={s.count}
                  max={maxStatusCount}
                  color={STATUS_COLORS[s.status] || 'bg-gray-400'}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Recent tickets */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Recent tickets</h2>
          <div className="space-y-3">
            {recent.map((t) => (
              <div
                key={t.id}
                onClick={() => navigate(`/tickets/${t.id}`)}
                className="flex items-center gap-3 p-2 rounded-lg
                           hover:bg-gray-50 cursor-pointer transition"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{t.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{t.customer?.name}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <PriorityBadge priority={t.priority} />
                  <StatusBadge status={t.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
