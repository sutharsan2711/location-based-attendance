import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Home,
  Calendar,
  CheckCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  Settings,
  User as UserIcon,
  DollarSign,
  CheckSquare,
  Award,
  Sparkles,
  CalendarDays,
  Clock,
  Laptop,
  Megaphone,
  X,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onCloseMobile }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // State for collapsible sub-menus
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    Leave: location.pathname.includes('/leaves'),
    Attendance: location.pathname.includes('/attendance') || location.pathname === '/employee/dashboard',
  });

  const toggleMenu = (name: string) => {
    setOpenMenus((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const displayName = user?.name ? user.name.split(' ')[0] : 'Employee';
  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'EP';

  const handleLinkClick = () => {
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    if (onCloseMobile) onCloseMobile();
  };

  const menuContent = (
    <>
      {/* ── 1. Brand Header ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-indigo-500 flex flex-col items-center justify-center text-white shadow-md shadow-indigo-500/20 font-black leading-none shrink-0 ring-2 ring-indigo-50 dark:ring-slate-800">
            <span className="text-xs tracking-tight font-extrabold">EC</span>
            <span className="text-[7px] font-bold tracking-wider uppercase mt-0.5 opacity-90">Learnix</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-black text-slate-800 dark:text-white tracking-tight font-display">EC Learnix</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">Employee Portal</span>
          </div>
        </div>

        {/* Mobile Close Button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* ── 2. User Info Card ── */}
      <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-b from-slate-50/80 dark:from-slate-800/40 to-transparent shrink-0">
        <div className="flex items-center gap-3 p-2 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700 shadow-xs hover:border-indigo-200 dark:hover:border-indigo-800 transition-all">
          <div className="relative shrink-0">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
              {userInitials}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-800 dark:text-white truncate flex items-center gap-1">
              Hi, {displayName}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate uppercase tracking-wider">
              {user?.employeeCode || 'ECL-EMP'}
            </p>
          </div>
          <NavLink
            to="/employee/profile"
            onClick={handleLinkClick}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors"
            title="Account Settings"
          >
            <Settings className="h-3.5 w-3.5" />
          </NavLink>
        </div>
      </div>

      {/* ── 3. Navigation Links ── */}
      <nav className="flex-1 space-y-1 px-3 py-3 overflow-y-auto text-xs">
        {/* Dashboard */}
        <NavLink
          to="/employee/dashboard"
          onClick={handleLinkClick}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${
              isActive
                ? 'bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs border border-indigo-100 dark:border-indigo-800'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`
          }
        >
          <Home className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
          <span>Dashboard & Punch</span>
        </NavLink>

        {/* Announcements */}
        <NavLink
          to="/employee/announcements"
          onClick={handleLinkClick}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${
              isActive
                ? 'bg-amber-50/80 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold shadow-xs border border-amber-100 dark:border-amber-800'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`
          }
        >
          <Megaphone className="h-4 w-4 shrink-0 text-amber-500 dark:text-amber-400" />
          <span>Announcements</span>
        </NavLink>

        {/* Daily Tasks & Work Plans */}
        <NavLink
          to="/employee/tasks"
          onClick={handleLinkClick}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${
              isActive
                ? 'bg-blue-50/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold shadow-xs border border-blue-100 dark:border-blue-800'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`
          }
        >
          <CheckSquare className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
          <span>Daily Tasks & Plans</span>
        </NavLink>

        {/* ── Attendance Dropdown ── */}
        <div>
          <button
            onClick={() => toggleMenu('Attendance')}
            className={`flex w-full items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-all cursor-pointer ${
              location.pathname.includes('/attendance')
                ? 'bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>Attendance</span>
            </div>
            {openMenus['Attendance'] ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
          </button>

          {openMenus['Attendance'] && (
            <div className="pl-9 pr-2 py-1 space-y-1 animate-fade-in">
              <NavLink
                to="/employee/dashboard"
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  `block px-3 py-1.5 rounded-lg text-[11px] transition-all ${
                    isActive && location.pathname === '/employee/dashboard'
                      ? 'bg-emerald-100/70 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`
                }
              >
                Today's Overview
              </NavLink>
              <NavLink
                to="/employee/attendance"
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  `block px-3 py-1.5 rounded-lg text-[11px] transition-all ${
                    isActive
                      ? 'bg-emerald-100/70 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`
                }
              >
                Swipe History & Logs
              </NavLink>
            </div>
          )}
        </div>

        {/* ── Leave & Permission Dropdown ── */}
        <div>
          <button
            onClick={() => toggleMenu('Leave')}
            className={`flex w-full items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-all cursor-pointer ${
              location.pathname.includes('/leaves') || location.pathname.includes('/permissions')
                ? 'bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
              <span>Leave & Permission</span>
            </div>
            {openMenus['Leave'] ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
          </button>

          {openMenus['Leave'] && (
            <div className="pl-9 pr-2 py-1 space-y-1 animate-fade-in">
              <NavLink
                to="/employee/leaves"
                onClick={handleLinkClick}
                end
                className={({ isActive }) =>
                  `block px-3 py-1.5 rounded-lg text-[11px] transition-all ${
                    isActive
                      ? 'bg-indigo-100/70 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`
                }
              >
                My Applications
              </NavLink>
              <NavLink
                to="/employee/leaves/balances"
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  `block px-3 py-1.5 rounded-lg text-[11px] transition-all ${
                    isActive
                      ? 'bg-indigo-100/70 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`
                }
              >
                Leave Balances & Quota
              </NavLink>
              <NavLink
                to="/employee/leaves/calendar"
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  `block px-3 py-1.5 rounded-lg text-[11px] transition-all ${
                    isActive
                      ? 'bg-indigo-100/70 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`
                }
              >
                Leave Calendar
              </NavLink>
              <NavLink
                to="/employee/leaves/holidays"
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  `block px-3 py-1.5 rounded-lg text-[11px] transition-all ${
                    isActive
                      ? 'bg-indigo-100/70 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`
                }
              >
                Holiday Calendar
              </NavLink>
            </div>
          )}
        </div>

        {/* Payroll & Salary */}
        <NavLink
          to="/employee/payroll"
          onClick={handleLinkClick}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${
              isActive
                ? 'bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs border border-indigo-100 dark:border-indigo-800'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`
          }
        >
          <DollarSign className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>My Payroll & Payslips</span>
        </NavLink>

        {/* KPI & Ratings */}
        <NavLink
          to="/employee/kpi"
          onClick={handleLinkClick}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${
              isActive
                ? 'bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs border border-indigo-100 dark:border-indigo-800'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`
          }
        >
          <Award className="h-4 w-4 shrink-0 text-amber-500 dark:text-amber-400" />
          <span>My KPI & Ratings</span>
        </NavLink>

        {/* Assets */}
        <NavLink
          to="/employee/assets"
          onClick={handleLinkClick}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${
              isActive
                ? 'bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs border border-indigo-100 dark:border-indigo-800'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`
          }
        >
          <Laptop className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
          <span>My Assets & Requests</span>
        </NavLink>

        {/* Profile */}
        <NavLink
          to="/employee/profile"
          onClick={handleLinkClick}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${
              isActive
                ? 'bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs border border-indigo-100 dark:border-indigo-800'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`
          }
        >
          <UserIcon className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
          <span>My Profile & Info</span>
        </NavLink>
      </nav>

      {/* Mobile Logout Button at Bottom */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 md:hidden shrink-0">
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-xl transition-all"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* ── Desktop Permanent Sidebar ── */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md md:flex select-none shadow-sm transition-colors duration-200">
        {menuContent}
      </aside>

      {/* ── Mobile Slide-out Drawer ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-fade-in"
            onClick={onCloseMobile}
          />

          {/* Drawer Panel */}
          <aside className="relative z-50 w-72 max-w-[85vw] flex flex-col bg-white dark:bg-slate-900 shadow-2xl animate-in slide-in-from-left duration-200 select-none h-full transition-colors duration-200">
            {menuContent}
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
