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
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const adminMenu = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Employees', path: '/employees', icon: Users },
    { name: 'Attendance & Grid', path: '/attendance', icon: CalendarDays },
    { name: 'Leave & Permissions', path: '/requests', icon: FileCheck },
    { name: 'Holiday Calendar', path: '/settings/holidays', icon: CalendarRange },
    { name: 'Office Timing', path: '/settings/timing', icon: Sliders },
    { name: 'Location Settings', path: '/settings/location', icon: MapPin },
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

      {/* Menu links */}
      <nav className="flex-1 space-y-1.5 px-4 py-6">
        {adminMenu.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-3 text-sm font-semibold rounded-2xl transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom user + logout section */}
      <div className="border-t border-slate-100 p-4 space-y-2">
        <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl bg-slate-50">
          <div className="h-9 w-9 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm shrink-0">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
            <p className="text-[10px] text-slate-400 font-medium truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-semibold text-rose-500 hover:bg-rose-50 rounded-xl transition-all duration-200"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
