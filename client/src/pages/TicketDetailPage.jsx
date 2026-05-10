import { useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useTicket from '../hooks/useTicket';
import useTicketSocket from '../hooks/useTicketSocket';
import { StatusBadge, PriorityBadge } from '../components/ui/StatusBadge';
import { PageSpinner, Spinner } from '../components/ui/Spinner';
import { updateStatus, getTransitions } from '../api/tickets.api';
import { createComment } from '../api/comments.api';

// ── Comment bubble ────────────────────────────────────────────────────────────
const CommentBubble = ({ comment, currentUserId }) => {
  const isOwn = comment.user_id === currentUserId;
  const isInternal = comment.is_internal;

  return (
    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
      {/* Author + time */}
      <div
        className={`flex items-center gap-2 mb-1
        ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
      >
        <span className="text-xs font-medium text-gray-700">{comment.author?.name}</span>
        <span className="text-xs text-gray-400 capitalize">{comment.author?.role}</span>
        {isInternal && (
          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
            🔒 internal
          </span>
        )}
        <span className="text-xs text-gray-400">
          {new Date(comment.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>

      {/* Bubble */}
      <div
        className={`max-w-lg px-4 py-2.5 rounded-2xl text-sm leading-relaxed
        ${
          isInternal
            ? 'bg-yellow-50 border border-yellow-200 text-yellow-900'
            : isOwn
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-200 text-gray-800'
        }`}
      >
        {comment.body}
      </div>
    </div>
  );
};

// ── Status transition bar ─────────────────────────────────────────────────────
const StatusBar = ({ ticket, onStatusUpdate }) => {
  const [allowed, setAllowed] = useState([]);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);
  const [target, setTarget] = useState(null);
  const toast = useToast();

  // Load allowed transitions when ticket loads
  useState(() => {
    if (!ticket) return;
    getTransitions(ticket.id)
      .then((r) => setAllowed(r.data.allowed))
      .catch(() => {});
  });

  const handleTransition = async (status) => {
    if (status === 'resolved' || status === 'closed') {
      setTarget(status);
      setShowNote(true);
      return;
    }
    await doTransition(status, '');
  };

  const doTransition = async (status, noteText) => {
    try {
      setLoading(true);
      await updateStatus(ticket.id, status, noteText);
      toast.success(`Status updated to ${status.replace('_', ' ')}`);
      onStatusUpdate(status);
      setAllowed([]); // will refresh on next render
      setShowNote(false);
      setNote('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  if (allowed.length === 0) return null;

  const STATUS_LABELS = {
    open: 'Reopen',
    assigned: 'Mark Assigned',
    in_progress: 'Start Working',
    resolved: 'Mark Resolved',
    closed: 'Close Ticket',
  };

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
      <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
        Update status
      </p>
      <div className="flex flex-wrap gap-2">
        {allowed.map((s) => (
          <button
            key={s}
            onClick={() => handleTransition(s)}
            disabled={loading}
            className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg
                       hover:bg-white hover:border-blue-400 hover:text-blue-600
                       disabled:opacity-50 transition"
          >
            {STATUS_LABELS[s] || s}
          </button>
        ))}
      </div>

      {/* Optional note for resolved/closed */}
      {showNote && (
        <div className="mt-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note about this resolution (optional)"
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2
                       text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => doTransition(target, note)}
              disabled={loading}
              className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded-lg
                         flex items-center gap-2 hover:bg-blue-700"
            >
              {loading ? <Spinner size="sm" /> : null} Confirm
            </button>
            <button
              onClick={() => setShowNote(false)}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TicketDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [body, setBody] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimer = useRef(null);
  const commentsEndRef = useRef(null);

  const {
    ticket,
    comments,
    loading,
    appendComment,
    replaceComment,
    removeComment,
    updateStatus: setStatus,
  } = useTicket(id);

  // ── Wire socket events ──────────────────────────────────────────────────
  const { sendTyping, sendStopTyping } = useTicketSocket(id, {
    onStatusChanged: ({ newStatus }) => {
      setStatus(newStatus);
      toast.info(`Status changed to ${newStatus.replace('_', ' ')}`);
    },
    onCommentCreated: ({ comment }) => {
      appendComment(comment);
      // Scroll to bottom when new comment arrives
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    },
    onCommentUpdated: ({ comment }) => replaceComment(comment),
    onCommentDeleted: ({ commentId }) => removeComment(commentId),
    onTyping: ({ user: u }) => {
      setTypingUsers((p) => [...new Set([...p, u.id])]);
    },
    onStopTyping: ({ userId }) => {
      setTypingUsers((p) => p.filter((id) => id !== userId));
    },
  });

  const handleBodyChange = (e) => {
    setBody(e.target.value);
    sendTyping();
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(sendStopTyping, 2000);
  };

  const handleSubmitComment = async () => {
    if (!body.trim()) return;
    try {
      setSubmitting(true);
      await createComment(id, body.trim(), isInternal);
      setBody('');
      setIsInternal(false);
      sendStopTyping();
      // Socket event handles appending — don't add manually
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send comment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageSpinner />;
  if (!ticket)
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Ticket not found</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-blue-600 hover:underline text-sm mt-2"
        >
          Back to dashboard
        </button>
      </div>
    );

  const canPostInternal = user?.role === 'agent' || user?.role === 'admin';

  return (
    <div className="max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link to="/dashboard" className="hover:text-gray-700">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium truncate">{ticket.title}</span>
      </div>

      {/* Ticket header card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900 mb-2">{ticket.title}</h1>
            <div className="flex flex-wrap gap-2 items-center">
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
              <span className="text-xs text-gray-400">#{ticket.id.slice(0, 8).toUpperCase()}</span>
            </div>
          </div>

          {/* Meta */}
          <div className="text-right text-xs text-gray-500 space-y-1">
            <p>
              Opened by <span className="font-medium text-gray-700">{ticket.customer?.name}</span>
            </p>
            <p>{new Date(ticket.created_at).toLocaleDateString()}</p>
            {ticket.agent ? (
              <p>
                Assigned to <span className="font-medium text-gray-700">{ticket.agent.name}</span>
              </p>
            ) : (
              <p className="text-orange-500">Unassigned</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-700 leading-relaxed">{ticket.description}</p>
        </div>

        {/* Status transition bar */}
        <StatusBar ticket={ticket} onStatusUpdate={setStatus} />
      </div>

      {/* Comments thread */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">
            Conversation
            <span className="ml-2 text-gray-400 font-normal">
              {comments.length} {comments.length === 1 ? 'message' : 'messages'}
            </span>
          </h2>
        </div>

        <div className="px-6 py-4 space-y-4 min-h-48 max-h-[480px] overflow-y-auto">
          {comments.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">
              No messages yet — start the conversation
            </p>
          ) : (
            comments.map((c) => <CommentBubble key={c.id} comment={c} currentUserId={user?.id} />)
          )}

          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <span
                  className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
              <span className="text-xs text-gray-400">Someone is typing...</span>
            </div>
          )}
          <div ref={commentsEndRef} />
        </div>

        {/* Reply box */}
        {ticket.status !== 'closed' && (
          <div className="px-6 pb-6 pt-4 border-t border-gray-100">
            <textarea
              value={body}
              onChange={handleBodyChange}
              placeholder={isInternal ? 'Write an internal note...' : 'Write a reply...'}
              rows={3}
              className={`w-full border rounded-xl px-4 py-3 text-sm outline-none
                focus:ring-2 transition resize-none mb-3
                ${
                  isInternal
                    ? 'border-yellow-300 bg-yellow-50 focus:ring-yellow-300'
                    : 'border-gray-200 focus:ring-blue-400'
                }`}
            />
            <div className="flex items-center justify-between">
              {/* Internal note toggle — agents and admins only */}
              {canPostInternal && (
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div
                    onClick={() => setIsInternal((p) => !p)}
                    className={`w-9 h-5 rounded-full transition-colors
                      ${isInternal ? 'bg-yellow-400' : 'bg-gray-200'}`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full shadow mt-0.5
                      transition-transform
                      ${isInternal ? 'translate-x-4' : 'translate-x-0.5'}`}
                    />
                  </div>
                  <span className="text-xs text-gray-600">
                    {isInternal ? '🔒 Internal note' : 'Public reply'}
                  </span>
                </label>
              )}
              {!canPostInternal && <span />}

              <button
                onClick={handleSubmitComment}
                disabled={submitting || !body.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50
                           text-white text-sm font-medium px-5 py-2 rounded-lg
                           flex items-center gap-2 transition-colors"
              >
                {submitting ? <Spinner size="sm" /> : null}
                {isInternal ? 'Add note' : 'Send reply'}
              </button>
            </div>
          </div>
        )}

        {ticket.status === 'closed' && (
          <div className="px-6 pb-6 pt-4 border-t border-gray-100">
            <p className="text-sm text-center text-gray-400">
              This ticket is closed. No further replies can be added.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
