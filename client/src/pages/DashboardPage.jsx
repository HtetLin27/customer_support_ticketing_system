import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useTickets from '../hooks/useTickets';
import StatsRow from '../components/dashboard/StatsRow';
import FilterBar from '../components/dashboard/FilterBar';
import TicketCard from '../components/dashboard/TicketCard';
import Pagination from '../components/dashboard/Pagination';
import { PageSpinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';

export default function DashboardPage() {
  const { user } = useAuth();
  const { tickets, pagination, loading, error } = useTickets();

  const heading =
    {
      customer: 'My Tickets',
      agent: 'My Queue',
      admin: 'All Tickets',
    }[user?.role] || 'Tickets';

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{heading}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {user?.role === 'customer'
              ? 'Track and manage your support requests'
              : user?.role === 'agent'
                ? 'Tickets assigned to you'
                : 'All tickets across the system'}
          </p>
        </div>
        {/* Only customers (and admins) can create tickets */}
        {(user?.role === 'customer' || user?.role === 'admin') && (
          <Link
            to="/tickets/new"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm
                       font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + New Ticket
          </Link>
        )}
      </div>

      {/* Stats row */}
      <StatsRow />

      {/* Filter bar */}
      <FilterBar />

      {/* Ticket list */}
      {loading ? (
        <PageSpinner />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState
          icon="📭"
          title="No tickets found"
          description="Try adjusting your filters or create a new ticket"
          action={
            user?.role === 'customer' && (
              <Link
                to="/tickets/new"
                className="inline-block bg-blue-600 text-white text-sm
                           px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Open a ticket
              </Link>
            )
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
          <Pagination pagination={pagination} />
        </>
      )}
    </div>
  );
}
