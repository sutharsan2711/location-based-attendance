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
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // State for collapsible sub-menus
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    'Leave': location.pathname.includes('/leaves'),
    'Attendance': location.pathname.includes('/attendance') || location.pathname === '/employee/dashboard',
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

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-slate-200/80 bg-white/95 backdrop-blur-md md:flex select-none shadow-sm">
      {/* ── 1. Brand Header ── */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
        <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-indigo-500 flex flex-col items-center justify-center text-white shadow-md shadow-indigo-500/20 font-black leading-none shrink-0 ring-2 ring-indigo-50">
          <span className="text-xs tracking-tight font-extrabold">EC</span>
          <span className="text-[7px] font-bold tracking-wider uppercase mt-0.5 opacity-90">Learnix</span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-black text-slate-800 tracking-tight font-display">EC Learnix</span>
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Employee Portal</span>
        </div>
      </div>

      {/* ── 2. User Info Card ── */}
      <div className="px-4 py-3.5 border-b border-slate-100 bg-gradient-to-b from-slate-50/80 to-transparent">
        <div className="flex items-center gap-3 p-2 rounded-2xl bg-white border border-slate-200/70 shadow-xs hover:border-indigo-200 transition-all">
          <div className="relative shrink-0">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
              {userInitials}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate leading-tight">Hi, {displayName}</p>
            <p className="text-[10px] text-slate-400 font-medium truncate font-mono">
              {user?.employeeCode || 'Employee'}
            </p>
          </div>
          <button
            onClick={() => navigate('/employee/profile')}
            className="text-slate-400 hover:text-indigo-600 transition-colors p-1 hover:bg-indigo-50 rounded-lg"
            title="My Profile"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── 3. Navigation Links List ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1 text-xs text-slate-600 custom-scrollbar">
        {/* Home / Dashboard */}
        <NavLink
          to="/employee/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${
              isActive || location.pathname === '/'
                ? 'bg-indigo-50/80 text-indigo-700 font-bold shadow-xs border border-indigo-100'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`
          }
        >
          <Home className="h-4 w-4 shrink-0 text-indigo-600" />
          <span>Dashboard & Punch</span>
        </NavLink>

        {/* Company Announcements */}
        <NavLink
          to="/employee/announcements"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${
              isActive
                ? 'bg-indigo-50/80 text-indigo-700 font-bold shadow-xs border border-indigo-100'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`
          }
        >
          <Megaphone className="h-4 w-4 shrink-0 text-amber-500" />
          <span>Announcements</span>
        </NavLink>

        {/* My Tasks */}
        <NavLink
          to="/employee/tasks"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${
              isActive
                ? 'bg-indigo-50/80 text-indigo-700 font-bold shadow-xs border border-indigo-100'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`
          }
        >
          <CheckSquare className="h-4 w-4 shrink-0 text-blue-600" />
          <span>Daily Tasks & Plans</span>
        </NavLink>

        {/* Attendance (Collapsible) */}
        <div>
          <button
            onClick={() => toggleMenu('Attendance')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-all cursor-pointer ${
              location.pathname.includes('/attendance')
                ? 'bg-slate-100/80 text-slate-900 font-bold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
              <span className="font-semibold text-slate-800">Attendance</span>
            </div>
            {openMenus['Attendance'] ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
          </button>
          {openMenus['Attendance'] && (
            <div className="pl-9 pr-2 py-1 space-y-1 text-[11px] animate-fade-in">
              <NavLink
                to="/employee/dashboard"
                className={({ isActive }) =>
                  `block py-1.5 px-2 rounded-lg transition-colors ${
                    isActive ? 'text-indigo-600 font-bold bg-indigo-50/50' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'
                  }`
                }
              >
                Today's Overview
              </NavLink>
              <NavLink
                to="/employee/attendance"
                className={({ isActive }) =>
                  `block py-1.5 px-2 rounded-lg transition-colors ${
                    isActive ? 'text-indigo-600 font-bold bg-indigo-50/50' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'
                  }`
                }
              >
                Swipe History & Logs
              </NavLink>
            </div>
          )}
        </div>

        {/* Leave & Permissions (Collapsible) */}
        <div>
          <button
            onClick={() => toggleMenu('Leave')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-all cursor-pointer ${
              location.pathname.includes('/leaves')
                ? 'bg-slate-100/80 text-slate-900 font-bold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 shrink-0 text-indigo-500" />
              <span className="font-semibold text-slate-800">Leave & Permission</span>
            </div>
            {openMenus['Leave'] ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
          </button>
          {openMenus['Leave'] && (
            <div className="pl-9 pr-2 py-1 space-y-1 text-[11px] animate-fade-in">
              <NavLink
                to="/employee/leaves"
                end
                className={({ isActive }) =>
                  `block py-1.5 px-2 rounded-lg transition-colors ${
                    isActive ? 'text-indigo-600 font-bold bg-indigo-50/50' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'
                  }`
                }
              >
                My Applications
              </NavLink>
              <NavLink
                to="/employee/leaves/balances"
                className={({ isActive }) =>
                  `block py-1.5 px-2 rounded-lg transition-colors ${
                    isActive ? 'text-indigo-600 font-bold bg-indigo-50/50' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'
                  }`
                }
              >
                Leave Balances & Quota
              </NavLink>
              <NavLink
                to="/employee/leaves/calendar"
                className={({ isActive }) =>
                  `block py-1.5 px-2 rounded-lg transition-colors ${
                    isActive ? 'text-indigo-600 font-bold bg-indigo-50/50' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'
                  }`
                }
              >
                Leave Calendar
              </NavLink>
              <NavLink
                to="/employee/leaves/holidays"
                className={({ isActive }) =>
                  `block py-1.5 px-2 rounded-lg transition-colors ${
                    isActive ? 'text-indigo-600 font-bold bg-indigo-50/50' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'
                  }`
                }
              >
                Holiday Calendar
              </NavLink>
            </div>
          )}
        </div>

        {/* My Payroll */}
        <NavLink
          to="/employee/payroll"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${
              isActive
                ? 'bg-indigo-50/80 text-indigo-700 font-bold shadow-xs border border-indigo-100'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`
          }
        >
          <DollarSign className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>My Payroll & Payslips</span>
        </NavLink>

        {/* My KPI Performance */}
        <NavLink
          to="/employee/kpi"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${
              isActive
                ? 'bg-indigo-50/80 text-indigo-700 font-bold shadow-xs border border-indigo-100'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`
          }
        >
          <Award className="h-4 w-4 shrink-0 text-amber-500" />
          <span>My KPI & Ratings</span>
        </NavLink>

        {/* My Assets & Requests */}
        <NavLink
          to="/employee/assets"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${
              isActive
                ? 'bg-indigo-50/80 text-indigo-700 font-bold shadow-xs border border-indigo-100'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`
          }
        >
          <Laptop className="h-4 w-4 shrink-0 text-indigo-600" />
          <span>My Assets & Requests</span>
        </NavLink>

        {/* Profile */}
        <NavLink
          to="/employee/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${
              isActive
                ? 'bg-indigo-50/80 text-indigo-700 font-bold shadow-xs border border-indigo-100'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`
          }
        >
          <UserIcon className="h-4 w-4 shrink-0 text-slate-500" />
          <span>My Profile & Info</span>
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;

