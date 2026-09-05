import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AdminProtectedRoute from './AdminProtectedRoute';
import AdminLayout from '../layouts/AdminLayout';
import Loading from '../components/Loading';

// Pages
import AdminLogin from '../pages/auth/AdminLogin';
import AdminDashboard from '../pages/admin/AdminDashboard';
import Employees from '../pages/admin/Employees';
import Attendance from '../pages/admin/Attendance';
import LocationSettings from '../pages/admin/LocationSettings';
import AdminTimingSettings from '../pages/admin/AdminTimingSettings';
import AdminPermissionRequests from '../pages/admin/AdminPermissionRequests';
import AdminLeaveRequests from '../pages/admin/AdminLeaveRequests';
import AdminHolidayCalendar from '../pages/admin/AdminHolidayCalendar';
import Reports from '../pages/admin/Reports';
import DatabaseReset from '../pages/admin/DatabaseReset';
import AdminPayroll from '../pages/admin/AdminPayroll';
import AdminSalaryManagement from '../pages/admin/AdminSalaryManagement';
import AdminPayslipView from '../pages/admin/AdminPayslipView';
import AdminTasks from '../pages/admin/AdminTasks';
import AdminStickyNotes from '../pages/admin/AdminStickyNotes';

const HomeRedirect: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return <Loading fullScreen message="Loading..." />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to="/dashboard" replace />;
};

const LoginRoute: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return <Loading fullScreen message="Signing in..." />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <AdminLogin />;
};

const AdminRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<LoginRoute />} />

      {/* Protected Admin Routes */}
      <Route element={<AdminProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/dashboard" element={<AdminDashboard />} />
          <Route path="/tasks" element={<AdminTasks />} />
          <Route path="/notes" element={<AdminStickyNotes />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/payroll" element={<AdminPayroll />} />
          <Route path="/payroll/salary" element={<AdminSalaryManagement />} />
          <Route path="/payroll/payslip/:id" element={<AdminPayslipView />} />
          <Route path="/requests" element={<AdminLeaveRequests />} />
          <Route path="/requests/permissions" element={<AdminPermissionRequests />} />
          <Route path="/requests/leaves" element={<AdminLeaveRequests />} />
          <Route path="/settings/holidays" element={<AdminHolidayCalendar />} />
          <Route path="/holidays" element={<AdminHolidayCalendar />} />
          <Route path="/settings/timing" element={<AdminTimingSettings />} />
          <Route path="/settings/location" element={<LocationSettings />} />
          <Route path="/settings/database" element={<DatabaseReset />} />
          <Route path="/reports" element={<Reports />} />
        </Route>
      </Route>

      {/* Wildcard fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AdminRoutes;
