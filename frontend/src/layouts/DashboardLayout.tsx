import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import ErrorBoundary from '../components/ErrorBoundary';
import { Outlet } from 'react-router-dom';

const DashboardLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f7f9fc] dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col font-sans w-full max-w-full overflow-x-hidden transition-colors duration-200">
      {/* Sidebar with Desktop & Mobile Drawer support */}
      <Sidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />

      <div className="flex flex-col flex-1 md:pl-60 lg:pl-64 min-h-screen w-full max-w-full min-w-0 transition-all">
        <Navbar onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)} />
        <main className="flex-1 p-3 sm:p-4.5 md:p-6 lg:p-8 flex flex-col w-full max-w-7xl mx-auto min-w-0 overflow-x-hidden">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
