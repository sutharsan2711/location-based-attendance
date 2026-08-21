import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Bell,
  Power,
  ChevronDown,
  ExternalLink,
  HelpCircle,
  FileText,
  Calendar,
  Layers,
} from 'lucide-react';

const Navbar: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showQuickLinks, setShowQuickLinks] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Dynamic breadcrumb title based on path
  let pageTitle = 'Home';
  if (location.pathname.includes('/attendance')) pageTitle = 'Attendance / Swipes';
  else if (location.pathname.includes('/leaves')) pageTitle = 'Leaves';
  else if (location.pathname.includes('/permissions')) pageTitle = 'Permissions';
  else if (location.pathname.includes('/profile')) pageTitle = 'My Profile';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b border-slate-200/80 bg-white px-6">
      {/* ── Left: Breadcrumb / Page Title ── */}
      <div className="flex items-center gap-2.5">
        <div className="h-5 w-4 rounded-sm bg-blue-500/80 transform rotate-12 flex items-center justify-center opacity-80" />
        <h1 className="text-base font-semibold text-slate-800 tracking-tight">{pageTitle}</h1>
      </div>

      {/* ── Right Action Icons ── */}
      <div className="flex items-center gap-4 text-slate-600 text-xs font-medium relative">
        {/* Quick Links dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowQuickLinks(!showQuickLinks)}
            className="flex items-center gap-1.5 py-1.5 px-2 rounded-lg hover:bg-slate-100/80 text-slate-700 font-medium transition-colors"
          >
            <span>Quick Links</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {showQuickLinks && (
            <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white shadow-xl border border-slate-200/80 py-2 z-50 animate-slide">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fast Access</div>
              <button
                onClick={() => { navigate('/employee/attendance'); setShowQuickLinks(false); }}
                className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
              >
                <Calendar className="h-4 w-4 text-blue-600" /> View Swipe Logs
              </button>
              <button
                onClick={() => { navigate('/employee/leaves'); setShowQuickLinks(false); }}
                className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
              >
                <Calendar className="h-4 w-4 text-indigo-600" /> Apply Leaves
              </button>
              <button
                onClick={() => { navigate('/employee/profile'); setShowQuickLinks(false); }}
                className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
              >
                <FileText className="h-4 w-4 text-emerald-600" /> Employee Info
              </button>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 transition-colors"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-blue-600" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white shadow-xl border border-slate-200/80 p-4 z-50 animate-slide">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-800 text-xs">Notifications</span>
                <span className="text-[10px] text-blue-600 font-semibold cursor-pointer">Mark all as read</span>
              </div>
              <div className="py-3 space-y-2">
                <div className="p-2 bg-blue-50/50 rounded-lg text-[11px] text-slate-600">
                  🎉 Welcome to EC Learnix Attendance Portal!
                </div>
                <div className="p-2 bg-slate-50 rounded-lg text-[11px] text-slate-600">
                  📍 Office geo-fence boundary active.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Power / Sign Out */}
        <button
          onClick={handleLogout}
          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          title="Sign Out"
        >
          <Power className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
