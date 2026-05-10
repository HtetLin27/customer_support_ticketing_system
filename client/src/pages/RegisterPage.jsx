import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Spinner } from '../components/ui/Spinner';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.name || form.name.length < 2) e.name = 'Name must be at least 2 characters';
    if (!form.email) e.email = 'Email is required';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(form.password)) e.password = 'Password must contain an uppercase letter';
    if (!/[0-9]/.test(form.password)) e.password = 'Password must contain a number';
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
      // Register then immediately login — same token flow
      const api = await import('../api/auth.api');
      await api.register(form.name, form.email, form.password);
      await login(form.email, form.password);
      toast.success('Account created! Welcome.');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed';
      toast.error(msg);
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  const field = (key, label, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={form[key]}
        placeholder={placeholder}
        onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
        className={`w-full border rounded-lg px-3 py-2 text-sm outline-none
          focus:ring-2 focus:ring-blue-500 transition
          ${errors[key] ? 'border-red-400' : 'border-gray-300'}`}
      />
      {errors[key] && <p className="text-xs text-red-600 mt-1">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🎫</div>
          <h1 className="text-2xl font-bold text-gray-900">Create account</h1>
          <p className="text-sm text-gray-500 mt-1">Get support from our team</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          {errors.general && (
            <div
              className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6
                            text-sm text-red-700"
            >
              {errors.general}
            </div>
          )}
          <div className="space-y-4">
            {field('name', 'Full name', 'text', 'Your name')}
            {field('email', 'Email address', 'email', 'you@example.com')}
            {field('password', 'Password', 'password', '••••••••')}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60
                         text-white font-medium py-2 rounded-lg text-sm
                         flex items-center justify-center gap-2 transition-colors mt-2"
            >
              {loading ? (
                <>
                  <Spinner size="sm" /> Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>
          </div>
        </div>
        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
