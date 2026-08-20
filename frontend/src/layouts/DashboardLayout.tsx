import React from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { Outlet } from 'react-router-dom';

const DashboardLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f7f9fc] flex flex-col font-sans">
      <Sidebar />
      <div className="flex flex-col md:pl-60 min-h-screen">
        <Navbar />
        <main className="flex-1 p-5 md:p-6 animate-slide">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
