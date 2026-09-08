import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Clock,
  FileCheck,
  MapPin,
  FileText,
  Map,
  LogOut,
  Sliders,
  CalendarRange,
  Database,
  DollarSign,
  CheckSquare,
  StickyNote,
  BarChart3,
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const adminMenu = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'KPI Dashboard', path: '/kpi', icon: BarChart3 },
    { name: 'Task Management', path: '/tasks', icon: CheckSquare },
    { name: 'Sticky Notes', path: '/notes', icon: StickyNote },
    { name: 'Employees', path: '/employees', icon: Users },
    { name: 'Attendance & Grid', path: '/attendance', icon: CalendarDays },
    { name: 'Payroll & Salary', path: '/payroll', icon: DollarSign },
    { name: 'Leave & Permissions', path: '/requests', icon: FileCheck },
    { name: 'Holiday Calendar', path: '/settings/holidays', icon: CalendarRange },
    { name: 'Office Timing', path: '/settings/timing', icon: Sliders },
    { name: 'Location Settings', path: '/settings/location', icon: MapPin },
    { name: 'Database Reset', path: '/settings/database', icon: Database },
    { name: 'Reports', path: '/reports', icon: FileText },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-100 bg-white md:flex">
      {/* Brand logo */}
      <div className="flex h-16 items-center gap-2.5 px-6 border-b border-slate-100">
        <Map className="h-6 w-6 text-primary-500 stroke-[2.5]" />
        <div>
          <span className="text-base font-bold text-slate-800 tracking-tight block leading-tight">AttendGPS</span>
          <span className="text-[10px] font-semibold text-primary-500 uppercase tracking-widest">Admin Panel</span>
        </div>
      </div>

      {/* Menu links with smooth scrolling */}
      <nav className="flex-1 space-y-1 px-4 py-3 overflow-y-auto min-h-0">
        {adminMenu.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-2.5 text-sm font-semibold rounded-2xl transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-50 text-primary-600 font-bold'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`
              }
            >
              <Icon className="h-4.5 w-4.5 shrink-0" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom user + logout section - Always visible */}
      <div className="border-t border-slate-100 p-3.5 space-y-2 shrink-0 bg-white shadow-sm">
        <div className="flex items-center gap-3 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-100">
          <div className="h-8 w-8 rounded-lg bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm shrink-0">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
            <p className="text-[10px] text-slate-400 font-medium truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 bg-rose-50/80 hover:bg-rose-100 border border-rose-100 rounded-xl transition-all duration-200 shadow-sm"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
