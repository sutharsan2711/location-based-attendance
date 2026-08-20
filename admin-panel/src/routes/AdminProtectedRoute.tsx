import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Loading from '../components/Loading';

const AdminProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading fullScreen message="Verifying admin session..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Block employees from accessing admin panel
  if (user.role !== 'ADMIN') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-50">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h1>
          <p className="text-slate-500 text-sm">This portal is restricted to administrators only.</p>
          <button
            onClick={() => {
              localStorage.removeItem('admin_token');
              localStorage.removeItem('admin_user');
              window.location.href = '/login';
            }}
            className="mt-6 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default AdminProtectedRoute;
