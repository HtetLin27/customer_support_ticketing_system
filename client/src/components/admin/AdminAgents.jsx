import { useState, useEffect } from 'react';
import { getAdminAgentWorkload } from '../../api/admin.api';
import { getTickets } from '../../api/tickets.api';
import { assignTicket, autoAssign } from '../../api/tickets.api';
import { useToast } from '../../context/ToastContext';
import { PageSpinner } from '../ui/Spinner';
import { PriorityBadge } from '../ui/StatusBadge';

const WorkloadBar = ({ value, max }) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const color = pct > 80 ? 'bg-red-400' : pct > 50 ? 'bg-yellow-400' : 'bg-green-400';
  return (
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden w-24">
      <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
    </div>
  );
};

export default function AdminAgents() {
  const [agents, setAgents] = useState([]);
  const [unassigned, setUnassigned] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(null);
  const toast = useToast();

  const load = async () => {
    try {
      const [agentsRes, ticketsRes] = await Promise.all([
        getAdminAgentWorkload(),
        getTickets({ status: 'open', unassigned: true, limit: 20 }),
      ]);
      setAgents(agentsRes.data.agents);
      setUnassigned(ticketsRes.data.tickets);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAssign = async (ticketId, agentId) => {
    try {
      setAssigning(ticketId);
      await assignTicket(ticketId, agentId);
      toast.success('Ticket assigned');
      // Remove from unassigned list
      setUnassigned((prev) => prev.filter((t) => t.id !== ticketId));
      // Reload agent workload
      const r = await getAdminAgentWorkload();
      setAgents(r.data.agents);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to assign ticket');
    } finally {
      setAssigning(null);
    }
  };

  const handleAutoAssign = async (ticketId) => {
    try {
      setAssigning(ticketId);
      const r = await autoAssign(ticketId);
      toast.success(`Auto-assigned to ${r.data.agent.name}`);
      setUnassigned((prev) => prev.filter((t) => t.id !== ticketId));
      const ar = await getAdminAgentWorkload();
      setAgents(ar.data.agents);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Auto-assign failed');
    } finally {
      setAssigning(null);
    }
  };

  if (loading) return <PageSpinner />;

  const maxLoad = Math.max(...agents.map((a) => a.workload.total_active), 1);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Agents</h1>

      {/* Agent workload cards */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Agent workload</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-9 h-9 rounded-full bg-orange-100 text-orange-700
                                flex items-center justify-center text-sm font-medium"
                >
                  {agent.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{agent.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <WorkloadBar value={agent.workload.total_active} max={maxLoad} />
                    <span className="text-xs text-gray-500">
                      {agent.workload.total_active} active
                    </span>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium
                  ${agent.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                >
                  {agent.available ? 'Available' : 'Busy'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'Assigned', v: agent.workload.assigned },
                  { label: 'In Progress', v: agent.workload.in_progress },
                  { label: 'Resolved', v: agent.workload.resolved },
                ].map(({ label, v }) => (
                  <div key={label} className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="text-sm font-semibold text-gray-900">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Unassigned tickets */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">
            Unassigned tickets
            {unassigned.length > 0 && (
              <span
                className="ml-2 bg-orange-100 text-orange-700 text-xs
                               px-2 py-0.5 rounded-full"
              >
                {unassigned.length}
              </span>
            )}
          </h2>
        </div>

        {unassigned.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <p className="text-sm text-green-700">✅ All tickets are assigned</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th
                    className="text-left px-4 py-3 text-xs font-medium
                                 text-gray-500 uppercase tracking-wide"
                  >
                    Ticket
                  </th>
                  <th
                    className="text-left px-4 py-3 text-xs font-medium
                                 text-gray-500 uppercase tracking-wide"
                  >
                    Priority
                  </th>
                  <th
                    className="text-left px-4 py-3 text-xs font-medium
                                 text-gray-500 uppercase tracking-wide"
                  >
                    Customer
                  </th>
                  <th
                    className="text-right px-4 py-3 text-xs font-medium
                                 text-gray-500 uppercase tracking-wide"
                  >
                    Assign to
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {unassigned.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 truncate max-w-48">{t.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        #{t.id.slice(0, 8).toUpperCase()}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{t.customer?.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end flex-wrap">
                        {/* Auto assign */}
                        <button
                          onClick={() => handleAutoAssign(t.id)}
                          disabled={assigning === t.id}
                          className="text-xs bg-blue-600 text-white px-3 py-1.5
                                     rounded-lg hover:bg-blue-700 disabled:opacity-50
                                     transition"
                        >
                          {assigning === t.id ? '...' : 'Auto'}
                        </button>
                        {/* Manual assign dropdown */}
                        <select
                          defaultValue=""
                          disabled={assigning === t.id}
                          onChange={(e) => e.target.value && handleAssign(t.id, e.target.value)}
                          className="text-xs border border-gray-300 rounded-lg
                                     px-2 py-1.5 outline-none
                                     focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="" disabled>
                            Choose agent
                          </option>
                          {agents.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                              {a.available ? ' ✓' : ' (busy)'}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
