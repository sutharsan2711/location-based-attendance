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
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // State for collapsible sub-menus
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    'Leave': false,
    'Attendance': true,
  });

  const toggleMenu = (name: string) => {
    setOpenMenus((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const displayName = user?.name ? user.name.split(' ')[0] : 'Employee';

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-slate-200/80 bg-white md:flex select-none">
      {/* ── 1. EC Learnix Brand Header ── */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
        <div className="h-10 w-10 rounded-lg bg-blue-700 flex flex-col items-center justify-center text-white shadow-sm font-black leading-none shrink-0">
          <span className="text-xs tracking-tight font-extrabold">EC</span>
          <span className="text-[7px] font-semibold tracking-wider uppercase mt-0.5">Learnix</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-800 tracking-tight">EC Learnix</span>
          <span className="text-[10px] text-slate-400 font-medium">Employee Portal</span>
        </div>
      </div>

      {/* ── 2. User Info Card ── */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100/80 bg-slate-50/40">
        <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center text-white shadow-sm shrink-0">
          <UserIcon className="h-5 w-5 text-slate-200" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-800 truncate">Hi {displayName}</p>
            <button
              onClick={() => navigate('/employee/profile')}
              className="text-slate-400 hover:text-slate-600 transition-colors p-0.5"
              title="Settings"
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            onClick={() => navigate('/employee/profile')}
            className="text-[11px] text-blue-600 hover:underline font-medium block text-left"
          >
            View My Info
          </button>
        </div>
      </div>

      {/* ── 3. Navigation Links List ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 text-xs text-slate-600 custom-scrollbar">
        {/* Home */}
        <NavLink
          to="/employee/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${
              isActive || location.pathname === '/'
                ? 'bg-blue-50/80 text-blue-600 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`
          }
        >
          <Home className="h-4 w-4 shrink-0" />
          <span>Home</span>
        </NavLink>

        {/* Attendance (Collapsible - Open by Default) */}
        <div>
          <button
            onClick={() => toggleMenu('Attendance')}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="h-4 w-4 shrink-0 text-blue-600" />
              <span className="font-semibold text-slate-800">Attendance</span>
            </div>
            {openMenus['Attendance'] ? <ChevronUp className="h-3 w-3 text-slate-400" /> : <ChevronDown className="h-3 w-3 text-slate-400" />}
          </button>
          {openMenus['Attendance'] && (
            <div className="pl-9 pr-2 py-1 space-y-1 text-[11px]">
              <NavLink
                to="/employee/dashboard"
                className={({ isActive }) =>
                  `block py-1 transition-colors ${
                    isActive ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-blue-600'
                  }`
                }
              >
                Attendance Info
              </NavLink>
              <NavLink
                to="/employee/attendance"
                className={({ isActive }) =>
                  `block py-1 transition-colors ${
                    isActive ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-blue-600'
                  }`
                }
              >
                View Swipes & History
              </NavLink>
              <NavLink
                to="/employee/permissions"
                className={({ isActive }) =>
                  `block py-1 transition-colors ${
                    isActive ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-blue-600'
                  }`
                }
              >
                Permission Requests
              </NavLink>
            </div>
          )}
        </div>

        {/* Leave (Collapsible) */}
        <div>
          <button
            onClick={() => toggleMenu('Leave')}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
          >
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 shrink-0 text-slate-500" />
              <span>Leave</span>
            </div>
            {openMenus['Leave'] ? <ChevronUp className="h-3 w-3 text-slate-400" /> : <ChevronDown className="h-3 w-3 text-slate-400" />}
          </button>
          {openMenus['Leave'] && (
            <div className="pl-9 pr-2 py-1 space-y-1 text-[11px]">
              <NavLink
                to="/employee/leaves"
                end
                className={({ isActive }) =>
                  `block py-1 transition-colors ${
                    isActive ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-blue-600'
                  }`
                }
              >
                Leave Apply
              </NavLink>
              <NavLink
                to="/employee/leaves/balances"
                className={({ isActive }) =>
                  `block py-1 transition-colors ${
                    isActive ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-blue-600'
                  }`
                }
              >
                Leave Balances
              </NavLink>
              <NavLink
                to="/employee/leaves/calendar"
                className={({ isActive }) =>
                  `block py-1 transition-colors ${
                    isActive ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-blue-600'
                  }`
                }
              >
                Leave Calendar
              </NavLink>
              <NavLink
                to="/employee/leaves/holidays"
                className={({ isActive }) =>
                  `block py-1 transition-colors ${
                    isActive ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-blue-600'
                  }`
                }
              >
                Holiday Calendar
              </NavLink>
            </div>
          )}
        </div>

        {/* Document Center */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 cursor-pointer">
          <FileText className="h-4 w-4 shrink-0 text-slate-500" />
          <span>Document Center</span>
        </div>

        {/* Profile */}
        <NavLink
          to="/employee/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${
              isActive
                ? 'bg-blue-50/80 text-blue-600 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`
          }
        >
          <UserIcon className="h-4 w-4 shrink-0" />
          <span>My Profile</span>
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
