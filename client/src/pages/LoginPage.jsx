import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Spinner } from '../components/ui/Spinner';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    if (!form.password) e.password = 'Password is required';
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
      setErrors({});
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed';
      toast.error(msg);
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🎫</div>
          <h1 className="text-2xl font-bold text-gray-900">Sign in</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back to Support Desk</p>
        </div>

        {/* Card */}
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
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                onKeyDown={handleKeyDown}
                placeholder="you@example.com"
                className={`w-full border rounded-lg px-3 py-2 text-sm outline-none
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition
                  ${errors.email ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                onKeyDown={handleKeyDown}
                placeholder="••••••••"
                className={`w-full border rounded-lg px-3 py-2 text-sm outline-none
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition
                  ${errors.password ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60
                         text-white font-medium py-2 rounded-lg text-sm
                         flex items-center justify-center gap-2 transition-colors mt-2"
            >
              {loading ? (
                <>
                  <Spinner size="sm" /> Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </div>

        {/* Register link */}
        <p className="text-center text-sm text-gray-500 mt-4">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:underline font-medium">
            Create one
          </Link>
        </p>

        {/* Dev shortcuts */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs font-medium text-yellow-800 mb-2">Dev quick-login:</p>
            <div className="flex gap-2 flex-wrap">
              {[
                { label: 'Admin', email: 'admin@ticketing.dev' },
                { label: 'Agent', email: 'alice@ticketing.dev' },
                { label: 'Customer', email: 'bob@ticketing.dev' },
              ].map(({ label, email }) => (
                <button
                  key={email}
                  onClick={() => setForm({ email, password: 'password123' })}
                  className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800
                             px-3 py-1 rounded-md transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
