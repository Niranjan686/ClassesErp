import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, UserPlus, BookOpen, Layers, CheckCircle2,
  Calendar, CreditCard, Award, FileText, School, UserCheck, MessageSquare,
  BarChart3, LogOut, ChevronDown, ChevronRight, X, Smartphone, Sparkles,
  ShieldCheck, HelpCircle, FileCheck, HardDrive, Bus, Book, Package,
  CalendarDays, Megaphone, ShieldAlert, Fingerprint, DollarSign, Activity,
  LifeBuoy, GraduationCap, DollarSign as CashIcon, Briefcase
} from 'lucide-react';

export const DRAWER_WIDTH = 256;

const Sidebar = ({ mobileOpen, onToggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isSuperAdmin = user?.role === 'superadmin';

  // Accordion state
  const [openGroups, setOpenGroups] = useState({
    students: true,
    academics: true,
    attendance: true,
    finance: true,
    campus: false,
    admin: false,
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
          <div id="nav-dashboard">
            <NavItem path="/dashboard" label="Overview Dashboard" icon={LayoutDashboard} />
          </div>

          {/* Section: SuperAdmin Console */}
          {isSuperAdmin && (
            <div className="space-y-0.5 p-1.5 rounded-2xl bg-indigo-50/60 border border-indigo-100">
              <div className="px-2.5 py-1 text-[10px] font-black text-indigo-700 uppercase tracking-wider flex items-center justify-between">
                <span>SuperAdmin HQ</span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
              </div>
              <NavItem path="/super-admin?tab=institutes" label="Coaching Directory" icon={School} />
              <NavItem path="/super-admin?tab=vault" label="Large File Vault" icon={HardDrive} badge="Chunked" />
            </div>
          )}

          {/* Section: Student Operations */}
          <div className="space-y-0.5" id="nav-students">
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
                <NavItem path="/documents" label="Document Compliance" icon={ShieldCheck} />
                <NavItem path="/alumni" label="Alumni Network" icon={GraduationCap} />
              </div>
            )}
          </div>

          {/* Section: Attendance & Access Control */}
          <div className="space-y-0.5" id="nav-attendance">
            <button
              onClick={() => toggleGroup('attendance')}
              className="w-full flex items-center justify-between px-3 py-1 text-[10px] font-bold text-[#64748B] uppercase tracking-wider hover:text-[#172033]"
            >
              <span>Attendance & Biometrics</span>
              {openGroups.attendance ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {openGroups.attendance && (
              <div className="space-y-0.5 pl-1">
                <NavItem path="/attendance-entry" label="Daily Batch Register" icon={CheckCircle2} />
                <NavItem path="/attendance-monthly" label="Monthly Matrix" icon={Calendar} />
                <NavItem path="/biometrics" label="Hardware Terminals" icon={Fingerprint} badge="IoT" />
                <NavItem path="/gatepass" label="Visitor & Gate Pass" icon={ShieldAlert} />
              </div>
            )}
          </div>

          {/* Section: Academic Masters & LMS */}
          <div className="space-y-0.5">
            <button
              onClick={() => toggleGroup('academics')}
              className="w-full flex items-center justify-between px-3 py-1 text-[10px] font-bold text-[#64748B] uppercase tracking-wider hover:text-[#172033]"
            >
              <span>Academics & LMS</span>
              {openGroups.academics ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {openGroups.academics && (
              <div className="space-y-0.5 pl-1">
                <NavItem path="/course-master" label="Course Management" icon={BookOpen} />
                <NavItem path="/batch-master" label="Batch Schedules" icon={Layers} />
                <NavItem path="/timetable" label="Class Timetable" icon={CalendarDays} />
                <NavItem path="/quizzes" label="LMS Quizzes & Tests" icon={Award} badge="New" />
                <NavItem path="/marks-entry" label="Marks & Report Cards" icon={Award} />
                <NavItem path="/certificates" label="Certificates & TC" icon={FileCheck} />
                <NavItem path="/study-notes" label="Study Notes & PDFs" icon={FileText} />
                <NavItem path="/live-classes" label="Live Classroom Studio" icon={Sparkles} badge="Live" />
              </div>
            )}
          </div>

          {/* Section: Finance & Billing */}
          <div className="space-y-0.5" id="nav-fees">
            <button
              onClick={() => toggleGroup('finance')}
              className="w-full flex items-center justify-between px-3 py-1 text-[10px] font-bold text-[#64748B] uppercase tracking-wider hover:text-[#172033]"
            >
              <span>Finance & Accounts</span>
              {openGroups.finance ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {openGroups.finance && (
              <div className="space-y-0.5 pl-1">
                <NavItem path="/fee-management" label="Fee Ledger & Invoices" icon={CreditCard} />
                <NavItem path="/expenses" label="Expenses & Cashbook" icon={CashIcon} />
                <NavItem path="/payroll" label="Staff Payroll & Slips" icon={Briefcase} />
                <NavItem path="/saas-billing" label="SaaS Subscription" icon={DollarSign} badge="Pro" />
              </div>
            )}
          </div>

          {/* Section: Campus Logistics */}
          <div className="space-y-0.5">
            <button
              onClick={() => toggleGroup('campus')}
              className="w-full flex items-center justify-between px-3 py-1 text-[10px] font-bold text-[#64748B] uppercase tracking-wider hover:text-[#172033]"
            >
              <span>Campus & Logistics</span>
              {openGroups.campus ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {openGroups.campus && (
              <div className="space-y-0.5 pl-1">
                <NavItem path="/transport" label="Transport & Fleet" icon={Bus} />
                <NavItem path="/library" label="Library Management" icon={Book} />
                <NavItem path="/inventory" label="Inventory & Assets" icon={Package} />
                <NavItem path="/calendar" label="Calendar & PTMs" icon={CalendarDays} />
                <NavItem path="/announcements" label="Circulars & Notice" icon={Megaphone} />
              </div>
            )}
          </div>

          {/* Section: Administration & CRM */}
          <div className="space-y-0.5">
            <button
              onClick={() => toggleGroup('admin')}
              className="w-full flex items-center justify-between px-3 py-1 text-[10px] font-bold text-[#64748B] uppercase tracking-wider hover:text-[#172033]"
            >
              <span>Administration & CRM</span>
              {openGroups.admin ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {openGroups.admin && (
              <div className="space-y-0.5 pl-1">
                <NavItem path="/staff-master" label="Staff & Faculty" icon={UserCheck} />
                <NavItem path="/leave-management" label="Staff & Student Leaves" icon={FileCheck} />
                <NavItem path="/enquiries" label="Enquiries CRM" icon={MessageSquare} />
                <NavItem path="/demo-schedule" label="Demo Scheduler" icon={Calendar} />
                <NavItem path="/complaints" label="Grievance Helpdesk" icon={HelpCircle} />
                <NavItem path="/support" label="Support & Telemetry" icon={LifeBuoy} />
              </div>
            )}
          </div>

          {/* Section: Reports */}
          <div id="nav-reports">
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
