import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu as MenuIcon, Search, Bell, ChevronDown, Building2,
  Calendar, Globe, LogOut, User, Sparkles, CheckCircle2,
  ExternalLink, Smartphone, ShieldCheck
} from 'lucide-react';

const Navbar = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [selectedCampus, setSelectedCampus] = useState('Global Admin View');
  const [selectedYear, setSelectedYear] = useState('2026-2027');

  const [currentUser, setCurrentUser] = useState({
    name: 'Class Administrator',
    role: 'ADMIN',
    email: 'admin@school.com'
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedInst = localStorage.getItem('institute');

    if (storedInst) {
      try {
        const inst = JSON.parse(storedInst);
        setSelectedCampus(`${inst.name} [${inst.code}]`);
      } catch (e) {}
    }

    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setCurrentUser({
          name: parsed.name || (parsed.role === 'superadmin' ? 'Super Admin' : parsed.fname ? `${parsed.fname} ${parsed.lname}` : 'Administrator'),
          role: (parsed.role || 'ADMIN').toUpperCase(),
          email: parsed.email || parsed.username || 'admin@school.com'
        });
        if (!storedInst && parsed.role === 'superadmin') {
          setSelectedCampus('Superadmin Control Cloud');
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('institute');
    navigate('/login');
  };

  return (
    <header className="fixed top-0 right-0 left-0 md:left-64 h-16 bg-white/95 backdrop-blur-md border-b border-[#E8EDF4] z-30 flex items-center justify-between px-4 sm:px-6 transition-all">
      
      {/* Left Area: Mobile Toggle, Campus Pill & Academic Session */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-xl text-[#64748B] hover:text-[#172033] hover:bg-slate-100 transition-colors"
          aria-label="Toggle navigation"
        >
          <MenuIcon className="w-5 h-5" />
        </button>

        {/* Campus / Institute Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#E8EDF4] text-xs font-bold text-[#172033]">
          <div className="w-5 h-5 rounded-md bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center">
            <Building2 className="w-3.5 h-3.5" />
          </div>
          <span className="truncate max-w-[140px] sm:max-w-[220px]">{selectedCampus}</span>
        </div>

        {/* Academic Session Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#E8EDF4] text-xs font-semibold text-[#64748B]">
          <Calendar className="w-3.5 h-3.5 text-[#64748B]" />
          <span>Session: {selectedYear}</span>
        </div>
      </div>

      {/* Right Area: Student App Shortcut, Notifications & User Avatar */}
      <div className="flex items-center gap-2 sm:gap-3">
        
        {/* Quick Link to Student Mobile Companion */}
        <Link
          to="/app"
          target="_blank"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#4338CA] bg-[#EEF2FF] hover:bg-[#E0E7FF] border border-[#E0E7FF] transition-all"
          title="Open Student Mobile Companion App"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Student App</span>
        </Link>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setNotificationOpen(!notificationOpen)}
            className="p-2 rounded-xl text-[#64748B] hover:text-[#172033] hover:bg-slate-100 transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-4.5 h-4.5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#4338CA] ring-2 ring-white"></span>
          </button>

          <AnimatePresence>
            {notificationOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.18 }}
                className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-[#E8EDF4] shadow-modal p-4 text-xs z-50"
              >
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 font-bold text-[#172033]">
                  <span>System Notifications</span>
                  <span className="text-[10px] text-[#4338CA] bg-[#EEF2FF] px-2 py-0.5 rounded-full">Real-time</span>
                </div>
                <div className="py-2.5 space-y-2 max-h-60 overflow-y-auto">
                  <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E8EDF4]">
                    <div className="font-semibold text-[#172033]">Live Attendance Sync Active</div>
                    <div className="text-[#64748B] text-[11px] mt-0.5">Push notifications and SMS dispatch queues running normally.</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E8EDF4]">
                    <div className="font-semibold text-[#172033]">Fee Ledger Online</div>
                    <div className="text-[#64748B] text-[11px] mt-0.5">Automated PDF receipts generation configured.</div>
                  </div>
                </div>
                <div className="pt-2 text-center border-t border-slate-100">
                  <button 
                    onClick={() => setNotificationOpen(false)}
                    className="text-[#4338CA] hover:underline font-bold text-[11px]"
                  >
                    Dismiss
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Profile Pill & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-xl border border-[#E8EDF4] hover:bg-slate-50 transition-all text-left"
          >
            <div className="w-7 h-7 rounded-lg bg-[#4338CA] text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {currentUser.name.charAt(0)}
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-bold text-[#172033] leading-tight truncate max-w-[110px]">{currentUser.name}</div>
              <div className="text-[10px] text-[#64748B] font-medium leading-none">{currentUser.role}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.18 }}
                className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-[#E8EDF4] shadow-modal p-2 text-xs z-50"
              >
                <div className="p-2 border-b border-slate-100 mb-1">
                  <div className="font-bold text-[#172033] truncate">{currentUser.name}</div>
                  <div className="text-[#64748B] text-[11px] truncate">{currentUser.email}</div>
                </div>

                {currentUser.role === 'SUPERADMIN' ? (
                  <Link
                    to="/super-admin"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 p-2 rounded-xl text-[#172033] hover:bg-slate-50 hover:text-[#4338CA] font-semibold transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#4338CA]" />
                    <span>Superadmin Hub</span>
                  </Link>
                ) : (
                  <Link
                    to="/dashboard"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 p-2 rounded-xl text-[#172033] hover:bg-slate-50 hover:text-[#4338CA] font-semibold transition-colors"
                  >
                    <Building2 className="w-4 h-4 text-[#4338CA]" />
                    <span>Admin Dashboard</span>
                  </Link>
                )}

                <Link
                  to="/"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 p-2 rounded-xl text-[#172033] hover:bg-slate-50 hover:text-[#4338CA] font-semibold transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-[#64748B]" />
                  <span>ClassTech Home</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold transition-colors mt-1"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

    </header>
  );
};

export default Navbar;
