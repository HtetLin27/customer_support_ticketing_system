import { useTicketContext } from '../../context/TicketContext';

const STATUSES = ['open', 'assigned', 'in_progress', 'resolved', 'closed'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export default function FilterBar() {
  const { filters, updateFilter, resetFilters } = useTicketContext();

  const hasActiveFilters = filters.status || filters.priority || filters.search;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <input
          type="text"
          placeholder="Search tickets..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm
                     outline-none focus:ring-2 focus:ring-blue-500 w-48"
        />

        {/* Status filter */}
        <select
          value={filters.status}
          onChange={(e) => updateFilter('status', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm
                     outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>

        {/* Priority filter */}
        <select
          value={filters.priority}
          onChange={(e) => updateFilter('priority', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm
                     outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        {/* Active filter chips + clear */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 ml-auto">
            {filters.status && (
              <span
                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full
                               flex items-center gap-1"
              >
                {filters.status}
                <button
                  onClick={() => updateFilter('status', '')}
                  className="hover:text-blue-900 font-bold"
                >
                  ×
                </button>
              </span>
            )}
            {filters.priority && (
              <span
                className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full
                               flex items-center gap-1"
              >
                {filters.priority}
                <button
                  onClick={() => updateFilter('priority', '')}
                  className="hover:text-orange-900 font-bold"
                >
                  ×
                </button>
              </span>
            )}
            <button
              onClick={resetFilters}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
