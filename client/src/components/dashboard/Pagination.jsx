// client/src/components/dashboard/Pagination.jsx
import { useTicketContext } from '../../context/TicketContext';

export default function Pagination({ pagination }) {
  const { filters, setPage } = useTicketContext();
  if (!pagination || pagination.totalPages <= 1) return null;

  const { page, totalPages, total, limit } = pagination;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between mt-4 px-1">
      <p className="text-sm text-gray-500">
        Showing{' '}
        <span className="font-medium">
          {from}–{to}
        </span>{' '}
        of <span className="font-medium">{total}</span> tickets
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setPage(page - 1)}
          disabled={!pagination.hasPrev}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg
                     disabled:opacity-40 hover:bg-gray-50 transition"
        >
          ← Prev
        </button>

        {/* Page number buttons */}
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .reduce((acc, p, i, arr) => {
            // Insert ellipsis where pages are skipped
            if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) =>
            p === '...' ? (
              <span key={`e${i}`} className="px-2 text-gray-400 text-sm">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-3 py-1.5 text-sm border rounded-lg transition
                  ${
                    p === page
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
              >
                {p}
              </button>
            )
          )}

        <button
          onClick={() => setPage(page + 1)}
          disabled={!pagination.hasNext}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg
                     disabled:opacity-40 hover:bg-gray-50 transition"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
