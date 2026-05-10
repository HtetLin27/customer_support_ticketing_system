import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createTicket } from '../api/tickets.api';
import { useToast } from '../context/ToastContext';
import { Spinner } from '../components/ui/Spinner';

const PRIORITIES = [
  { value: 'low', label: 'Low', desc: 'Minor issue, no urgency', color: 'text-gray-600' },
  { value: 'medium', label: 'Medium', desc: 'Normal priority', color: 'text-blue-600' },
  {
    value: 'high',
    label: 'High',
    desc: 'Important, needs prompt attention',
    color: 'text-orange-600',
  },
  { value: 'urgent', label: 'Urgent', desc: 'Critical, business impacted', color: 'text-red-600' },
];

export default function NewTicketPage() {
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const toast = useToast();

  const validate = () => {
    const e = {};
    if (!form.title || form.title.length < 5) e.title = 'Title must be at least 5 characters';
    if (!form.description || form.description.length < 10)
      e.description = 'Description must be at least 10 characters';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    try {
      setLoading(true);
      const res = await createTicket(form);
      toast.success('Ticket created! We will get back to you soon.');
      navigate(`/tickets/${res.data.ticket.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
          ← Dashboard
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">Open a ticket</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        {/* Title */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            What's the issue? <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="Brief summary of the problem"
            maxLength={255}
            className={`w-full border rounded-lg px-3 py-2 text-sm outline-none
              focus:ring-2 focus:ring-blue-500 transition
              ${errors.title ? 'border-red-400' : 'border-gray-300'}`}
          />
          <div className="flex justify-between mt-1">
            {errors.title ? <p className="text-xs text-red-600">{errors.title}</p> : <span />}
            <span className="text-xs text-gray-400">{form.title.length}/255</span>
          </div>
        </div>

        {/* Description */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Describe the issue in detail <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="What happened? What were you trying to do? Any error messages?"
            rows={6}
            maxLength={5000}
            className={`w-full border rounded-lg px-3 py-2 text-sm outline-none
              focus:ring-2 focus:ring-blue-500 transition resize-none
              ${errors.description ? 'border-red-400' : 'border-gray-300'}`}
          />
          <div className="flex justify-between mt-1">
            {errors.description ? (
              <p className="text-xs text-red-600">{errors.description}</p>
            ) : (
              <span />
            )}
            <span className="text-xs text-gray-400">{form.description.length}/5000</span>
          </div>
        </div>

        {/* Priority */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PRIORITIES.map((p) => (
              <button
                key={p.value}
                onClick={() => setForm((prev) => ({ ...prev, priority: p.value }))}
                className={`border rounded-lg p-3 text-left transition-all
                  ${
                    form.priority === p.value
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <p className={`text-sm font-medium ${p.color}`}>{p.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{p.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 justify-end">
          <Link to="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">
            Cancel
          </Link>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60
                       text-white text-sm font-medium px-6 py-2 rounded-lg
                       flex items-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <Spinner size="sm" /> Submitting...
              </>
            ) : (
              'Submit ticket'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
