import { useState, useEffect } from 'react';
import { getVolumeReport, getAgentReport } from '../../api/admin.api';
import { PageSpinner } from '../ui/Spinner';

// Simple sparkline bar chart — no library needed
const MiniBarChart = ({ data, valueKey, labelKey, color = 'bg-blue-400' }) => {
  const max = Math.max(...data.map((d) => Number(d[valueKey])), 1);
  return (
    <div className="flex items-end gap-0.5 h-16">
      {data.map((d, i) => (
        <div key={i} className="flex-1 h-full flex items-end group relative">
          <div
            className={`w-full ${color} rounded-t opacity-80 hover:opacity-100
                        transition-all`}
            style={{ minHeight: 4, height: `${(Number(d[valueKey]) / max) * 100}%` }}
          />
          {/* Tooltip on hover */}
          <div
            className="absolute bottom-full mb-1 hidden group-hover:block
                          bg-gray-900 text-white text-xs px-2 py-1 rounded
                          whitespace-nowrap z-10"
          >
            {d[labelKey]}: {d[valueKey]}
          </div>
        </div>
      ))}
    </div>
  );
};

export default function AdminReports() {
  const [volume, setVolume] = useState({ opened: [], closed: [] });
  const [agents, setAgents] = useState([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  const load = async (d) => {
    setLoading(true);
    try {
      const [volRes, agentRes] = await Promise.all([getVolumeReport(d), getAgentReport()]);
      setVolume(volRes.data);
      setAgents(agentRes.data.agents);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(days);
  }, [days]);

  if (loading) return <PageSpinner />;

  // Take last 14 entries for the chart — one bar per day
  const chartData = volume.opened.slice(-14);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Reports</h1>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm
                     outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Volume chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Ticket volume</h2>
        <p className="text-xs text-gray-400 mb-4">
          Tickets opened per day (last {Math.min(14, chartData.length)} days shown)
        </p>
        {chartData.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No data for selected period</p>
        ) : (
          <div>
            <MiniBarChart data={chartData} valueKey="count" labelKey="date" color="bg-blue-400" />
            <div className="flex justify-between mt-1">
              {chartData.map((row) => (
                <span key={row.date} className="flex-1 text-center text-[10px] text-gray-400">
                  {new Date(row.date).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              ))}
            </div>
            <div className="flex gap-4 mt-3">
              <span className="text-xs text-gray-500">
                📥 Opened: <strong>{volume.opened.reduce((s, r) => s + Number(r.count), 0)}</strong>
              </span>
              <span className="text-xs text-gray-500">
                ✅ Resolved/Closed:{' '}
                <strong>{volume.closed.reduce((s, r) => s + Number(r.count), 0)}</strong>
              </span>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Chart data
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {chartData.map((row) => (
                  <div key={row.date} className="border border-gray-100 rounded-lg px-2 py-1.5">
                    <p className="text-[11px] text-gray-400">{row.date}</p>
                    <p className="text-sm font-semibold text-gray-800">{row.count}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Agent performance */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Agent performance</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {['Agent', 'Assigned', 'Resolved', 'Resolution Rate', 'Avg Response'].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3 text-xs font-medium
                             text-gray-500 uppercase tracking-wide"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {agents.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">
                  No agent data available
                </td>
              </tr>
            ) : (
              agents.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full bg-orange-100
                                      text-orange-700 flex items-center justify-center
                                      text-xs font-medium"
                      >
                        {a.name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{a.name}</p>
                        <p className="text-xs text-gray-400">{a.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{a.stats.totalAssigned}</td>
                  <td className="px-4 py-3 text-gray-700">{a.stats.totalResolved}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            a.stats.resolutionRate > 70
                              ? 'bg-green-400'
                              : a.stats.resolutionRate > 40
                                ? 'bg-yellow-400'
                                : 'bg-red-400'
                          }`}
                          style={{ width: `${a.stats.resolutionRate}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-700">
                        {a.stats.resolutionRate}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 text-xs">
                    {a.stats.avgResponseMins != null ? `${a.stats.avgResponseMins} min` : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
