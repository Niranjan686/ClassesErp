import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, UserPlus, BookOpen, Layers, CheckCircle2,
  Calendar, CreditCard, Award, FileText, School, UserCheck, MessageSquare,
  BarChart3, LogOut, ChevronDown, ChevronRight, X, Smartphone, Sparkles,
  ShieldCheck, HelpCircle, FileCheck
} from 'lucide-react';

export const DRAWER_WIDTH = 256;

const Sidebar = ({ mobileOpen, onToggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Accordion state
  const [openGroups, setOpenGroups] = useState({
    students: true,
    academics: true,
    attendance: true,
    finance: true,
    reports: false,
  });

  const toggleGroup = (key) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isPathActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('institute');
    navigate('/login');
  };

  const NavItem = ({ path, label, icon: Icon, badge }) => {
    const active = isPathActive(path);
    return (
      <Link
        to={path}
        className={`relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors group ${
          active
            ? 'text-[#4338CA] font-bold'
            : 'text-[#64748B] hover:text-[#172033] hover:bg-slate-50'
        }`}
      >
        {/* Smooth Gliding Active Pill Indicator */}
        {active && (
          <motion.div
            layoutId="activeNavPill"
            className="absolute inset-0 bg-[#EEF2FF] border border-[#E0E7FF] rounded-xl -z-10"
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          />
        )}

        <div className="flex items-center gap-3 z-10">
          <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${active ? 'text-[#4338CA]' : 'text-[#64748B]'}`} />
          <span>{label}</span>
        </div>

        {badge && (
          <span className="z-10 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#EEF2FF] text-[#4338CA]">
            {badge}
          </span>
        )}
      </Link>
    );
  };

  const content = (
    <div className="h-full flex flex-col justify-between bg-white text-[#172033] border-r border-[#E8EDF4] select-none">
      
      {/* Top Brand Header */}
      <div>
        <div className="h-16 flex items-center justify-between px-5 border-b border-[#E8EDF4]">
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-[#4338CA] text-white flex items-center justify-center shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform">
              <School className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="font-extrabold text-base text-[#172033] tracking-tight font-display flex items-center gap-1.5">
                ClassTech
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
              </span>
              <span className="text-[10px] text-[#64748B] block -mt-0.5 font-medium">EdTech Operating System</span>
            </div>
          </Link>

          {/* Close button for mobile drawer */}
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-1.5 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Navigation Menu */}
        <div className="p-3 space-y-3.5 max-h-[calc(100vh-140px)] overflow-y-auto">
          
          {/* Main Dashboard */}
          <div>
            <NavItem path="/dashboard" label="Overview Dashboard" icon={LayoutDashboard} />
          </div>

          {/* Section: Student Operations */}
          <div className="space-y-0.5">
            <button
              onClick={() => toggleGroup('students')}
              className="w-full flex items-center justify-between px-3 py-1 text-[10px] font-bold text-[#64748B] uppercase tracking-wider hover:text-[#172033]"
            >
              <span>Students & Admissions</span>
              {openGroups.students ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {openGroups.students && (
              <div className="space-y-0.5 pl-1">
                <NavItem path="/students" label="Student Directory" icon={Users} />
                <NavItem path="/student-master" label="Add Student" icon={UserPlus} />
              </div>
            )}
          </div>

          {/* Section: Attendance Engine */}
          <div className="space-y-0.5">
            <button
              onClick={() => toggleGroup('attendance')}
              className="w-full flex items-center justify-between px-3 py-1 text-[10px] font-bold text-[#64748B] uppercase tracking-wider hover:text-[#172033]"
            >
              <span>Attendance Engine</span>
              {openGroups.attendance ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {openGroups.attendance && (
              <div className="space-y-0.5 pl-1">
                <NavItem path="/attendance-entry" label="Daily Batch Register" icon={CheckCircle2} />
                <NavItem path="/attendance-monthly" label="Monthly Matrix" icon={Calendar} />
              </div>
            )}
          </div>

          {/* Section: Academic Masters */}
          <div className="space-y-0.5">
            <button
              onClick={() => toggleGroup('academics')}
              className="w-full flex items-center justify-between px-3 py-1 text-[10px] font-bold text-[#64748B] uppercase tracking-wider hover:text-[#172033]"
            >
              <span>Academic Masters</span>
              {openGroups.academics ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {openGroups.academics && (
              <div className="space-y-0.5 pl-1">
                <NavItem path="/course-master" label="Course Management" icon={BookOpen} />
                <NavItem path="/batch-master" label="Batch Schedules" icon={Layers} />
                <NavItem path="/marks-entry" label="Marks & Report Cards" icon={Award} />
                <NavItem path="/study-notes" label="Study Notes & PDFs" icon={FileText} />
              </div>
            )}
          </div>

          {/* Section: Fees & Staff */}
          <div className="space-y-0.5">
            <button
              onClick={() => toggleGroup('finance')}
              className="w-full flex items-center justify-between px-3 py-1 text-[10px] font-bold text-[#64748B] uppercase tracking-wider hover:text-[#172033]"
            >
              <span>Finance & Staff</span>
              {openGroups.finance ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {openGroups.finance && (
              <div className="space-y-0.5 pl-1">
                <NavItem path="/fee-management" label="Fee Ledger & Invoices" icon={CreditCard} />
                <NavItem path="/staff-master" label="Staff & Faculty" icon={UserCheck} />
                <NavItem path="/enquiries" label="Enquiries CRM" icon={MessageSquare} />
              </div>
            )}
          </div>

          {/* Section: Reports */}
          <div>
            <NavItem path="/reports" label="Analytics & Reports" icon={BarChart3} />
          </div>

        </div>
      </div>

      {/* Bottom User Actions & App Preview */}
      <div className="p-3 border-t border-[#E8EDF4] bg-[#F8FAFC]/80 space-y-2">
        <Link
          to="/app"
          target="_blank"
          className="w-full flex items-center justify-between p-2 rounded-xl bg-white border border-[#E8EDF4] hover:border-indigo-200 text-[#172033] text-xs font-semibold transition-all shadow-card group"
        >
          <div className="flex items-center gap-2">
            <Smartphone className="w-3.5 h-3.5 text-[#4338CA]" />
            <span>Student App Preview</span>
          </div>
          <ChevronRight className="w-3 h-3 text-[#64748B] group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:block fixed top-0 left-0 bottom-0 w-64 z-40 bg-white">
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
            onClick={onToggleSidebar}
          />
          <div className="relative w-72 max-w-[80vw] h-full z-10 shadow-modal">
            {content}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
