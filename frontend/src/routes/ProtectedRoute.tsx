import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Loading from '../components/Loading';

interface ProtectedRouteProps {
  allowedRoles?: ('ADMIN' | 'EMPLOYEE' | 'TRAINEE' | 'INTERN' | string)[];
}

const ADMIN_PANEL_URL = 'http://localhost:5200';

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading fullScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If an ADMIN tries to access an employee route, redirect them to admin panel
    if (user.role === 'ADMIN') {
      window.location.href = ADMIN_PANEL_URL;
      return null;
    }
    return <Navigate to="/employee/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
