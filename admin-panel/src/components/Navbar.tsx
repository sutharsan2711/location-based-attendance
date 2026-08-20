import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Calendar, ShieldCheck } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user } = useAuth();

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-100 bg-white/80 px-6 backdrop-blur-md">
      {/* Date */}
      <div className="hidden items-center gap-2 text-slate-500 md:flex">
        <Calendar className="h-4 w-4 text-primary-500" />
        <span className="text-xs font-semibold">{today}</span>
      </div>

      {/* App brand for mobile */}
      <div className="font-bold text-slate-800 md:hidden">AttendGPS Admin</div>

      {/* Admin badge + user info */}
      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-bold text-slate-800 leading-tight">{user.name}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary-500 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Administrator
              </span>
            </div>
            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm border border-primary-200">
              {user.name.charAt(0)}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
