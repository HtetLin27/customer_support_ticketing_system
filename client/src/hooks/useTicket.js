import { useState, useEffect, useCallback } from 'react';
import { getTicket } from '../api/tickets.api';
import { getComments } from '../api/comments.api';
import { useToast } from '../context/ToastContext';

const useTicket = (id) => {
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetch = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [ticketRes, commentsRes] = await Promise.all([getTicket(id), getComments(id)]);
      setTicket(ticketRes.data.ticket);
      setComments(commentsRes.data.comments);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  // These are called by useTicketSocket when real-time events arrive
  const appendComment = (comment) => setComments((prev) => [...prev, comment]);
  const replaceComment = (comment) =>
    setComments((prev) => prev.map((c) => (c.id === comment.id ? comment : c)));
  const removeComment = (cid) => setComments((prev) => prev.filter((c) => c.id !== cid));
  const updateStatus = (status) => setTicket((prev) => ({ ...prev, status }));

  return {
    ticket,
    comments,
    loading,
    appendComment,
    replaceComment,
    removeComment,
    updateStatus,
    refetch: fetch,
  };
};

export default useTicket;
