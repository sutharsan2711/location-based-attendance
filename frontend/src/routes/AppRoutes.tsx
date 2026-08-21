import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ProtectedRoute from './ProtectedRoute';
import DashboardLayout from '../layouts/DashboardLayout';

import Loading from '../components/Loading';

// Employee Pages only
import Login from '../pages/auth/Login';
import EmployeeDashboard from '../pages/employee/EmployeeDashboard';
import AttendanceHistory from '../pages/employee/AttendanceHistory';
import EmployeePermissions from '../pages/employee/EmployeePermissions';
import EmployeeLeaves from '../pages/employee/EmployeeLeaves';
import LeaveBalances from '../pages/employee/LeaveBalances';
import LeaveCalendar from '../pages/employee/LeaveCalendar';
import HolidayCalendar from '../pages/employee/HolidayCalendar';
import EmployeeProfile from '../pages/employee/EmployeeProfile';

const ADMIN_PANEL_URL = 'http://localhost:5200';

const HomeRedirect: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return <Loading fullScreen message="Loading..." />;
  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'ADMIN') {
    window.location.href = ADMIN_PANEL_URL;
    return null;
  }

  return <Navigate to="/employee/dashboard" replace />;
};

const LoginRoute: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return <Loading fullScreen message="Signing in..." />;
  if (user) {
    if (user.role === 'ADMIN') {
      window.location.href = ADMIN_PANEL_URL;
      return null;
    }
    return <Navigate to="/employee/dashboard" replace />;
  }
  return <Login />;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginRoute />} />

      {/* Protected Layout Routes */}
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<HomeRedirect />} />

        {/* Employee-only Routes */}
        <Route element={<ProtectedRoute allowedRoles={['EMPLOYEE']} />}>
          <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
          <Route path="/employee/attendance" element={<AttendanceHistory />} />
          <Route path="/employee/permissions" element={<EmployeePermissions />} />
          <Route path="/employee/leaves" element={<EmployeeLeaves />} />
          <Route path="/employee/leaves/balances" element={<LeaveBalances />} />
          <Route path="/employee/leaves/calendar" element={<LeaveCalendar />} />
          <Route path="/employee/leaves/holidays" element={<HolidayCalendar />} />
          <Route path="/employee/profile" element={<EmployeeProfile />} />
        </Route>
      </Route>


      {/* Wildcard fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
