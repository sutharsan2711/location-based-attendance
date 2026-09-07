import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Calendar, ShieldCheck, LogOut, ChevronDown, UserCheck, Mail } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-100 bg-white/80 px-6 backdrop-blur-md">
      {/* Date */}
      <div className="hidden items-center gap-2 text-slate-500 md:flex">
        <Calendar className="h-4 w-4 text-primary-500" />
        <span className="text-xs font-semibold">{today}</span>
      </div>

      {/* App brand for mobile */}
      <div className="font-bold text-slate-800 md:hidden">AttendGPS Admin</div>

      {/* Admin badge + User Profile Menu + Quick Logout */}
      <div className="flex items-center gap-3">
        {user && (
          <div className="relative" ref={dropdownRef}>
            {/* Clickable Profile Trigger */}
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 rounded-2xl p-1.5 pr-2.5 transition-all duration-200 hover:bg-slate-50 focus:outline-none border border-transparent hover:border-slate-200"
              title="Admin Profile Menu"
            >
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-sm shadow-primary-200">
                {user.name.charAt(0)}
              </div>
              <div className="hidden sm:flex flex-col items-start text-left">
                <span className="text-sm font-bold text-slate-800 leading-tight flex items-center gap-1">
                  {user.name}
                  <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-primary-600 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Administrator
                </span>
              </div>
            </button>

            {/* Profile Dropdown Modal */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white p-3 shadow-xl border border-slate-100 ring-1 ring-slate-900/5 animate-scale-up z-50">
                <div className="px-3 py-2.5 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5 text-primary-500" />
                    {user.name}
                  </p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 truncate">
                    <Mail className="h-3 w-3 text-slate-400" />
                    {user.email}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-0.5 text-[10px] font-bold text-primary-600">
                    <ShieldCheck className="h-3 w-3" /> System Administrator
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-50"
                  >
                    <LogOut className="h-4 w-4 text-rose-500" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Standalone Quick Logout Button in Navbar */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-xl border border-rose-100 bg-rose-50/70 px-3 py-1.5 text-xs font-semibold text-rose-600 transition-all duration-200 hover:bg-rose-100 hover:border-rose-200 shadow-sm"
          title="Sign Out of Admin Panel"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
