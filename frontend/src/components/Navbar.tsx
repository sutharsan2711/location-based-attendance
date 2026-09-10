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
  Menu,
} from 'lucide-react';

interface NavbarProps {
  onToggleMobileMenu?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showQuickLinks, setShowQuickLinks] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Dynamic breadcrumb title and icon based on path
  let pageTitle = 'Dashboard & Punch';
  let pageIcon = <Clock className="h-4 w-4 text-indigo-600" />;

  if (location.pathname.includes('/attendance')) {
    pageTitle = 'Attendance & Swipes';
    pageIcon = <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  } else if (location.pathname.includes('/tasks')) {
    pageTitle = 'Daily Tasks';
    pageIcon = <FileText className="h-4 w-4 text-blue-600" />;
  } else if (location.pathname.includes('/leaves')) {
    pageTitle = 'Leave & Permissions';
    pageIcon = <Calendar className="h-4 w-4 text-indigo-600" />;
  } else if (location.pathname.includes('/payroll')) {
    pageTitle = 'Payroll & Salary';
    pageIcon = <DollarSign className="h-4 w-4 text-emerald-600" />;
  } else if (location.pathname.includes('/kpi')) {
    pageTitle = 'KPI Ratings';
    pageIcon = <Award className="h-4 w-4 text-amber-500" />;
  } else if (location.pathname.includes('/assets')) {
    pageTitle = 'My Assets';
    pageIcon = <Laptop className="h-4 w-4 text-indigo-600" />;
  } else if (location.pathname.includes('/profile')) {
    pageTitle = 'My Profile';
    pageIcon = <User className="h-4 w-4 text-slate-700" />;
  }

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-3 sm:px-6 shadow-xs">
      {/* ── Left: Hamburger Toggle & Breadcrumb / Page Title ── */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors focus:outline-none cursor-pointer"
          title="Open Navigation Menu"
          aria-label="Open Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="h-8 w-8 rounded-xl bg-slate-100 hidden xs:flex items-center justify-center shrink-0 border border-slate-200/60 shadow-2xs">
          {pageIcon}
        </div>
        <div className="min-w-0">
          <h1 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight leading-none font-display truncate">
            {pageTitle}
          </h1>
          <span className="text-[9px] sm:text-[10px] font-semibold text-slate-400 block truncate">EC Learnix Workspace</span>
        </div>
      </div>

      {/* ── Right: Live Date, Quick Actions, Profile & Sign Out ── */}
      <div className="flex items-center gap-1.5 sm:gap-3 text-slate-600 text-xs font-medium shrink-0">
        {/* Live Date Chip */}
        <div className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-semibold">
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
            className="flex items-center gap-1 sm:gap-1.5 py-1.5 px-2.5 sm:px-3 rounded-xl bg-indigo-50/60 hover:bg-indigo-100/70 border border-indigo-100 text-indigo-700 font-bold transition-all cursor-pointer text-xs"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Shortcuts</span>
            <ChevronDown className="h-3 w-3 text-indigo-400" />
          </button>

          {showQuickLinks && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-xl border border-slate-200/80 py-2 z-50 animate-scale-up">
              <div className="px-3.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fast Navigation</div>
              <button
                onClick={() => {
                  navigate('/employee/dashboard');
                  setShowQuickLinks(false);
                }}
                className="w-full text-left flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-indigo-50/50 hover:text-indigo-700 transition-colors font-medium cursor-pointer"
              >
                <Clock className="h-4 w-4 text-indigo-600" /> Check-In / Punch
              </button>
              <button
                onClick={() => {
                  navigate('/employee/tasks');
                  setShowQuickLinks(false);
                }}
                className="w-full text-left flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-indigo-50/50 hover:text-indigo-700 transition-colors font-medium cursor-pointer"
              >
                <FileText className="h-4 w-4 text-blue-600" /> Daily Work Plans
              </button>
              <button
                onClick={() => {
                  navigate('/employee/leaves');
                  setShowQuickLinks(false);
                }}
                className="w-full text-left flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-indigo-50/50 hover:text-indigo-700 transition-colors font-medium cursor-pointer"
              >
                <Calendar className="h-4 w-4 text-emerald-600" /> Apply Leaves / Permission
              </button>
              <button
                onClick={() => {
                  navigate('/employee/assets');
                  setShowQuickLinks(false);
                }}
                className="w-full text-left flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-indigo-50/50 hover:text-indigo-700 transition-colors font-medium cursor-pointer"
              >
                <Laptop className="h-4 w-4 text-indigo-600" /> My Assets & Requests
              </button>
              <button
                onClick={() => {
                  navigate('/employee/payroll');
                  setShowQuickLinks(false);
                }}
                className="w-full text-left flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-indigo-50/50 hover:text-indigo-700 transition-colors font-medium cursor-pointer"
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
            <div className="absolute right-0 mt-2 w-72 max-w-[88vw] rounded-2xl bg-white shadow-xl border border-slate-200/80 p-4 z-50 animate-scale-up">
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
