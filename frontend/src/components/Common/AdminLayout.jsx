import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from '../Dashboard/Sidebar';

/**
 * Standardized Admin Layout Component
 * Provides clean responsive sidebar and top navigation without jitter or overlap.
 */
const AdminLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleToggleSidebar = () => {
    setMobileOpen((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans antialiased text-slate-900">
      {/* Top Navbar */}
      <Navbar onToggleSidebar={handleToggleSidebar} />

      {/* Responsive Collapsible Sidebar */}
      <Sidebar mobileOpen={mobileOpen} onToggleSidebar={handleToggleSidebar} />

      {/* Main Content Area */}
      <main className="flex-1 md:pl-64 pt-16 transition-all">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
