import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Bell,
  Power,
  ChevronDown,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
  Clock,
  User,
  Shield,
  FileText,
  DollarSign,
  Award,
  Laptop,
} from 'lucide-react';

const Navbar: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showQuickLinks, setShowQuickLinks] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Dynamic breadcrumb title and icon based on path
  let pageTitle = 'Dashboard & Punch';
  let pageIcon = <Clock className="h-4 w-4 text-indigo-600" />;

  if (location.pathname.includes('/attendance')) {
    pageTitle = 'Attendance & Swipe Logs';
    pageIcon = <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  } else if (location.pathname.includes('/tasks')) {
    pageTitle = 'Daily Tasks & Work Plans';
    pageIcon = <FileText className="h-4 w-4 text-blue-600" />;
  } else if (location.pathname.includes('/leaves')) {
    pageTitle = 'Leave & Permission Manager';
    pageIcon = <Calendar className="h-4 w-4 text-indigo-600" />;
  } else if (location.pathname.includes('/payroll')) {
    pageTitle = 'Payroll & Salary Slips';
    pageIcon = <DollarSign className="h-4 w-4 text-emerald-600" />;
  } else if (location.pathname.includes('/kpi')) {
    pageTitle = 'My KPI & Ratings';
    pageIcon = <Award className="h-4 w-4 text-amber-500" />;
  } else if (location.pathname.includes('/assets')) {
    pageTitle = 'My Assigned Assets & Requests';
    pageIcon = <Laptop className="h-4 w-4 text-indigo-600" />;
  } else if (location.pathname.includes('/profile')) {
    pageTitle = 'My Profile & Account';
    pageIcon = <User className="h-4 w-4 text-slate-700" />;
  }

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-6 shadow-xs">
      {/* ── Left: Breadcrumb / Page Title ── */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200/60 shadow-2xs">
          {pageIcon}
        </div>
        <div>
          <h1 className="text-sm font-extrabold text-slate-900 tracking-tight leading-none font-display">
            {pageTitle}
          </h1>
          <span className="text-[10px] font-semibold text-slate-400">EC Learnix Workspace</span>
        </div>
      </div>

      {/* ── Right: Live Date, Quick Actions, Profile & Sign Out ── */}
      <div className="flex items-center gap-3 text-slate-600 text-xs font-medium">
        {/* Live Date Chip */}
        <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-semibold">
          <Calendar className="h-3.5 w-3.5 text-indigo-500" />
          <span>{todayStr}</span>
        </div>

        {/* Quick Links dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowQuickLinks(!showQuickLinks);
              setShowNotifications(false);
            }}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-indigo-50/60 hover:bg-indigo-100/70 border border-indigo-100 text-indigo-700 font-bold transition-all cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            <span>Shortcuts</span>
            <ChevronDown className="h-3 w-3 text-indigo-400" />
          </button>

          {showQuickLinks && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-xl border border-slate-200/80 py-2 z-50 animate-scale-up">
              <div className="px-3.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fast Navigation</div>
              <button
                onClick={() => { navigate('/employee/dashboard'); setShowQuickLinks(false); }}
                className="w-full text-left flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-indigo-50/50 hover:text-indigo-700 transition-colors font-medium"
              >
                <Clock className="h-4 w-4 text-indigo-600" /> Check-In / Punch
              </button>
              <button
                onClick={() => { navigate('/employee/tasks'); setShowQuickLinks(false); }}
                className="w-full text-left flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-indigo-50/50 hover:text-indigo-700 transition-colors font-medium"
              >
                <FileText className="h-4 w-4 text-blue-600" /> Daily Work Plans
              </button>
              <button
                onClick={() => { navigate('/employee/leaves'); setShowQuickLinks(false); }}
                className="w-full text-left flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-indigo-50/50 hover:text-indigo-700 transition-colors font-medium"
              >
                <Calendar className="h-4 w-4 text-emerald-600" /> Apply Leaves / Permission
              </button>
              <button
                onClick={() => { navigate('/employee/assets'); setShowQuickLinks(false); }}
                className="w-full text-left flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-indigo-50/50 hover:text-indigo-700 transition-colors font-medium"
              >
                <Laptop className="h-4 w-4 text-indigo-600" /> My Assets & Requests
              </button>
              <button
                onClick={() => { navigate('/employee/payroll'); setShowQuickLinks(false); }}
                className="w-full text-left flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-indigo-50/50 hover:text-indigo-700 transition-colors font-medium"
              >
                <DollarSign className="h-4 w-4 text-amber-600" /> View Payslips
              </button>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowQuickLinks(false);
            }}
            className="relative p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50 border border-slate-200/60 transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-600 ring-2 ring-white animate-pulse" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white shadow-xl border border-slate-200/80 p-4 z-50 animate-scale-up">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-900 text-xs">System Notifications</span>
                <span className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer">Clear</span>
              </div>
              <div className="py-2.5 space-y-2">
                <div className="p-2.5 bg-indigo-50/50 rounded-xl border border-indigo-100/60 text-[11px] text-indigo-950 font-medium">
                  🎉 Welcome to EC Learnix Attendance & Task Manager!
                </div>
                <div className="p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-100/60 text-[11px] text-emerald-950 font-medium">
                  📍 Office geo-fence boundary validated & active.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/60 transition-all cursor-pointer"
          title="Sign Out"
        >
          <Power className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};

export default Navbar;

