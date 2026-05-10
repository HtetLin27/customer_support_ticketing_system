// client/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { TicketProvider } from './context/TicketContext';
import { NotificationProvider } from './context/NotificationContext';

// Pages — we'll build these in Phase 6 Steps 2 & 3
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TicketDetailPage from './pages/TicketDetailPage';
import NewTicketPage from './pages/NewTicketPage';
import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';

// Layout
import Navbar from './components/layout/Navbar';

// ── Route guards ──────────────────────────────────────────────────────────────

// Redirects to /login if not authenticated
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// Redirects to /dashboard if wrong role
const RoleRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

// Redirects logged-in users away from /login
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageSpinner />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

const PageSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

// ── Layout wrapper for authenticated pages ────────────────────────────────────
const AppLayout = ({ children }) => (
  <div className="min-h-screen bg-gray-50">
    <Navbar />
    <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
  </div>
);

// ── Route definitions ─────────────────────────────────────────────────────────
const AppRoutes = () => (
  <Routes>
    {/* Public routes */}
    <Route
      path="/login"
      element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      }
    />
    <Route
      path="/register"
      element={
        <PublicRoute>
          <RegisterPage />
        </PublicRoute>
      }
    />

    {/* Protected routes — any authenticated user */}
    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <AppLayout>
            <DashboardPage />
          </AppLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/tickets/new"
      element={
        <RoleRoute roles={['customer', 'admin']}>
          <AppLayout>
            <NewTicketPage />
          </AppLayout>
        </RoleRoute>
      }
    />
    <Route
      path="/tickets/:id"
      element={
        <ProtectedRoute>
          <AppLayout>
            <TicketDetailPage />
          </AppLayout>
        </ProtectedRoute>
      }
    />

    {/* Admin-only routes */}
    <Route
      path="/admin/*"
      element={
        <RoleRoute roles={['admin']}>
          <AppLayout>
            <AdminPage />
          </AppLayout>
        </RoleRoute>
      }
    />

    {/* Redirects */}
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

// ── Root app — provider tree ──────────────────────────────────────────────────
// Order matters — inner providers can access outer ones
const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <ToastProvider>
        <NotificationProvider>
          <TicketProvider>
            <AppRoutes />
          </TicketProvider>
        </NotificationProvider>
      </ToastProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
