// client/src/hooks/useTickets.js
import { useState, useEffect, useCallback } from 'react';
import { getTickets } from '../api/tickets.api';
import { useToast } from '../context/ToastContext';
import { useTicketContext } from '../context/TicketContext';

const useTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { filters } = useTicketContext();
  const toast = useToast();

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getTickets(filters);
      setTickets(res.data.tickets);
      setPagination(res.data.pagination);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to load tickets';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Re-fetch whenever filters change
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return { tickets, pagination, loading, error, refetch: fetchTickets };
};

export default useTickets;
