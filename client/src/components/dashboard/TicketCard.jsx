import { useNavigate } from 'react-router-dom';
import { StatusBadge, PriorityBadge } from '../ui/StatusBadge';

const timeAgo = (date) => {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

export default function TicketCard({ ticket }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/tickets/${ticket.id}`)}
      className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer
                 hover:border-blue-300 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left — title + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            {ticket.priority === 'urgent' && (
              <span className="text-xs text-red-600 font-medium animate-pulse">⚡ urgent</span>
            )}
          </div>

          <h3
            className="text-sm font-medium text-gray-900 truncate
                         group-hover:text-blue-600 transition-colors"
          >
            {ticket.title}
          </h3>

          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{ticket.description}</p>
        </div>

        {/* Right — assignee + time */}
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-gray-400">{timeAgo(ticket.created_at)}</p>
          {ticket.agent ? (
            <p className="text-xs text-gray-500 mt-1">👤 {ticket.agent.name}</p>
          ) : (
            <p className="text-xs text-orange-500 mt-1">Unassigned</p>
          )}
        </div>
      </div>

      {/* Bottom — customer info */}
      <div
        className="mt-3 pt-3 border-t border-gray-100 flex items-center
                      justify-between"
      >
        <p className="text-xs text-gray-400">
          By <span className="font-medium text-gray-600">{ticket.customer?.name || 'Unknown'}</span>
        </p>
        <span className="text-xs text-gray-400">#{ticket.id.slice(0, 8).toUpperCase()}</span>
      </div>
    </div>
  );
}
