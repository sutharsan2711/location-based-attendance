import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { Calendar, ShieldCheck, LogOut, ChevronDown, UserCheck, Mail, Menu } from 'lucide-react';

interface NavbarProps {
  onToggleMobileMenu?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
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
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-3 sm:px-6 backdrop-blur-md transition-colors duration-200">
      {/* Mobile Menu Button + App Brand */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none cursor-pointer"
          title="Open Menu"
          aria-label="Open Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Date on desktop */}
        <div className="hidden items-center gap-2 text-slate-500 dark:text-slate-400 md:flex">
          <Calendar className="h-4 w-4 text-primary-500" />
          <span className="text-xs font-semibold">{today}</span>
        </div>

        {/* App brand for mobile */}
        <div className="font-extrabold text-slate-800 dark:text-white text-sm md:hidden truncate">
          AttendGPS Admin
        </div>
      </div>

      {/* Theme Toggle + Admin badge + User Profile Menu + Quick Logout */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Dark / Light Theme Toggle Switch */}
        <ThemeToggle />

        {user && (
          <div className="relative" ref={dropdownRef}>
            {/* Clickable Profile Trigger */}
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 sm:gap-3 rounded-2xl p-1 sm:p-1.5 pr-2 sm:pr-2.5 transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer"
              title="Admin Profile Menu"
            >
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-sm shadow-primary-200">
                {user.name.charAt(0)}
              </div>
              <div className="hidden sm:flex flex-col items-start text-left">
                <span className="text-sm font-bold text-slate-800 dark:text-white leading-tight flex items-center gap-1">
                  {user.name}
                  <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Administrator
                </span>
              </div>
            </button>

            {/* Profile Dropdown Modal */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 max-w-[88vw] rounded-2xl bg-white dark:bg-slate-900 p-3 shadow-xl border border-slate-100 dark:border-slate-800 ring-1 ring-slate-900/5 animate-scale-up z-50">
                <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5 text-primary-500" />
                    {user.name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                    <Mail className="h-3 w-3 text-slate-400" />
                    {user.email}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary-50 dark:bg-primary-950/50 px-2.5 py-0.5 text-[10px] font-bold text-primary-600 dark:text-primary-400">
                    <ShieldCheck className="h-3 w-3" /> System Administrator
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
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
          className="flex items-center gap-1.5 rounded-xl border border-rose-100 dark:border-rose-900/50 bg-rose-50/70 dark:bg-rose-950/40 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 transition-all duration-200 hover:bg-rose-100 dark:hover:bg-rose-900/60 hover:border-rose-200 shadow-sm cursor-pointer"
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
