import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Loading from '../components/Loading';

interface ProtectedRouteProps {
  allowedRoles?: ('ADMIN' | 'EMPLOYEE' | 'TRAINEE' | 'INTERN' | string)[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading fullScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/employee/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
