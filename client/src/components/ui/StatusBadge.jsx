const STATUS_STYLES = {
  open: 'bg-blue-100 text-blue-800',
  assigned: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-purple-100 text-purple-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-700',
};

const PRIORITY_STYLES = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

export const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
    ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'}`}
  >
    {status?.replace('_', ' ')}
  </span>
);

export const PriorityBadge = ({ priority }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
    ${PRIORITY_STYLES[priority] || 'bg-gray-100 text-gray-600'}`}
  >
    {priority}
  </span>
);
