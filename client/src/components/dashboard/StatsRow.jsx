import { useEffect, useState } from 'react';
import { getTickets } from '../../api/tickets.api';

const STATS = [
  { key: 'open', label: 'Open', color: 'border-blue-400', bg: 'bg-blue-50', text: 'text-blue-700' },
  {
    key: 'assigned',
    label: 'Assigned',
    color: 'border-yellow-400',
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
  },
  {
    key: 'in_progress',
    label: 'In Progress',
    color: 'border-purple-400',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
  },
  {
    key: 'resolved',
    label: 'Resolved',
    color: 'border-green-400',
    bg: 'bg-green-50',
    text: 'text-green-700',
  },
];

export default function StatsRow() {
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch counts for each status in parallel
    const fetchCounts = async () => {
      try {
        const results = await Promise.all(
          STATS.map((s) => getTickets({ status: s.key, limit: 1 }))
        );
        const c = {};
        STATS.forEach((s, i) => {
          c[s.key] = results[i].data.pagination.total;
        });
        setCounts(c);
      } finally {
        setLoading(false);
      }
    };
    fetchCounts();
  }, []);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      {STATS.map((s) => (
        <div key={s.key} className={`${s.bg} border-l-4 ${s.color} rounded-lg p-4`}>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            {s.label}
          </p>
          <p className={`text-2xl font-bold ${s.text}`}>{loading ? '–' : (counts[s.key] ?? 0)}</p>
        </div>
      ))}
    </div>
  );
}
