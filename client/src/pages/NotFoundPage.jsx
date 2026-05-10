import { Link } from 'react-router-dom';
export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <p className="text-6xl font-bold text-gray-200 mb-4">404</p>
      <h1 className="text-xl font-semibold text-gray-800 mb-2">Page not found</h1>
      <Link to="/dashboard" className="text-sm text-blue-600 hover:underline">
        Back to dashboard
      </Link>
    </div>
  );
}
