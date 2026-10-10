import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, BookOpen, Users, CheckCircle2, Calendar, CreditCard,
  Smartphone, BarChart3, ShieldCheck, ArrowRight, Sparkles, Bell,
  Clock, Check, Play, ChevronRight, Layers, MessageSquare, FileText,
  Building2, School, X, Send, Award, Compass, Laptop, Zap,
  CheckCircle, RefreshCw, UserCheck, Menu
} from 'lucide-react';
import { OpenBookSVG, GraduationCapSVG, PaperPlaneSVG } from '../Common/EducationalSVGs';
import AnimatedCounter from '../Common/AnimatedCounter';
import { ClasstechAnimatedBackground, ClasstechWaveDivider } from './ClasstechAnimatedBackground';
import ConnectedEcosystemShowcase from './ConnectedEcosystemShowcase';
import LandingFAQ from './LandingFAQ';

const LandingPage = () => {
  const navigate = useNavigate();
  const [activeHeroTab, setActiveHeroTab] = useState('attendance');
  const [scrolledNav, setScrolledNav] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [demoForm, setDemoForm] = useState({ name: '', email: '', schoolName: '', phone: '', studentCount: '100-500' });
  const [demoSuccess, setDemoSuccess] = useState(false);

  // Scroll listener for sticky navigation condensation
  useEffect(() => {
    const handleScroll = () => {
      setScrolledNav(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDemoSubmit = (e) => {
    e.preventDefault();
    triggerAcademicConfetti();
    setDemoSuccess(true);
    setTimeout(() => {
      setDemoSuccess(false);
      setIsDemoModalOpen(false);
    }, 2400);
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#172033] font-sans antialiased selection:bg-[#4338CA] selection:text-white relative overflow-x-hidden">
      
      {/* ─── CLASSTECH.IN DYNAMIC AMBIENT BACKGROUND SYSTEM ─── */}
      <ClasstechAnimatedBackground />

      {/* ─── 1. CONDENSED STICKY NAVIGATION BAR ─── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolledNav
          ? 'bg-white/95 backdrop-blur-md border-b border-[#E8EDF4] shadow-sm py-2.5'
          : 'bg-transparent py-4'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          {/* Brand Logo & Wordmark */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-[#4338CA] text-white flex items-center justify-center shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-[#172033] font-display">ClassTech</span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-md bg-[#EEF2FF] text-[#4338CA] border border-[#E0E7FF]">
                  EdTech SaaS
                </span>
              </div>
            </div>
          </Link>

          {/* Navigation Links Desktop */}
          <div className="hidden lg:flex items-center gap-6 text-xs font-bold text-[#64748B]">
            <a href="#ecosystem" className="hover:text-[#4338CA] transition-colors flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#4338CA]" /> Ecosystem
            </a>
            <a href="#features" className="hover:text-[#4338CA] transition-colors">Features</a>
            <a href="#mobile-app" className="hover:text-[#4338CA] transition-colors">Mobile App</a>
            <a href="#how-it-works" className="hover:text-[#4338CA] transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-[#4338CA] transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-[#4338CA] transition-colors">FAQ</a>
            <Link to="/app" className="hover:text-[#4338CA] transition-colors flex items-center gap-1 text-[#4338CA]">
              <Smartphone className="w-3.5 h-3.5" /> Student App
            </Link>
          </div>

          {/* Right Action CTAs */}
          <div className="flex items-center gap-2.5">
            <Link
              to="/login"
              className="hidden sm:inline-block px-3.5 py-2 rounded-xl text-xs font-bold text-[#172033] hover:text-[#4338CA] hover:bg-slate-100 transition-all"
            >
              Sign In
            </Link>
            <button
              onClick={() => setIsDemoModalOpen(true)}
              className="px-4.5 py-2 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold shadow-md shadow-indigo-600/25 hover:shadow-indigo-600/35 active:scale-[0.98] transition-all flex items-center gap-1.5 group"
            >
              <span>Book a Demo</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-[#64748B] hover:text-[#172033] hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="lg:hidden bg-white/95 backdrop-blur-xl border-b border-[#E8EDF4] px-4 py-4 space-y-3"
            >
              <div className="flex flex-col space-y-2 text-xs font-bold text-[#64748B]">
                <a 
                  href="#ecosystem" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 hover:text-[#4338CA]"
                >
                  ✨ Connected Ecosystem
                </a>
                <a 
                  href="#features" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 hover:text-[#4338CA]"
                >
                  Features & Modules
                </a>
                <a 
                  href="#mobile-app" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 hover:text-[#4338CA]"
                >
                  Mobile Companion App
                </a>
                <a 
                  href="#how-it-works" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 hover:text-[#4338CA]"
                >
                  How It Works
                </a>
                <a 
                  href="#pricing" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 hover:text-[#4338CA]"
                >
                  Pricing
                </a>
                <a 
                  href="#faq" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 hover:text-[#4338CA]"
                >
                  FAQ
                </a>
                <Link 
                  to="/app" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-lg bg-[#EEF2FF] text-[#4338CA] font-bold flex items-center gap-1.5"
                >
                  <Smartphone className="w-3.5 h-3.5" /> Launch Student Web App
                </Link>
                <Link 
                  to="/login" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-lg bg-slate-100 text-[#172033] font-bold"
                >
                  Sign In to School Portal
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ─── 2. HERO SECTION WITH INTERACTIVE ERP DASHBOARD PREVIEW ─── */}
      <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          
          {/* Pill Badge */}
          <motion.div 
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EEF2FF] border border-[#E0E7FF] text-[#4338CA] text-xs font-bold mb-4 shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping"></span>
            <span>Next-Generation School Operating System</span>
            <span className="text-slate-300">|</span>
            <span className="text-[#64748B] font-medium">Web & Mobile Companion</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#172033] tracking-tight leading-[1.12] font-display max-w-4xl mx-auto"
          >
            One Smart Platform. <br className="hidden sm:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#4338CA] via-[#4F46E5] to-[#0284C7]">
              Every School Connected.
            </span>
          </motion.h1>

          {/* Supporting Headline */}
          <motion.p 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-4 text-sm sm:text-base text-[#64748B] max-w-2xl mx-auto leading-relaxed"
          >
            From admissions to daily attendance, smart timetables, fee collections, report cards, and parent mobile communication — ClassTech brings your entire school operations together into one effortless, intelligent platform.
          </motion.p>

          {/* Primary Action Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3.5"
          >
            <button
              onClick={() => setIsDemoModalOpen(true)}
              className="w-full sm:w-auto px-7 py-3 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-2"
            >
              <span>Book a Free Demo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              to="/login"
              className="w-full sm:w-auto px-7 py-3 rounded-xl bg-white hover:bg-slate-50 active:scale-[0.98] text-[#172033] font-bold text-xs sm:text-sm border border-[#E8EDF4] shadow-card transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 text-[#4338CA] fill-[#4338CA]" />
              <span>Explore the Platform</span>
            </Link>
          </motion.div>

          {/* Key Metrics Counter Strip */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-[#E8EDF4] shadow-card"
          >
            <div className="p-2 text-center">
              <div className="text-2xl font-black text-[#172033] font-display">
                <AnimatedCounter value={100} suffix="%" />
              </div>
              <div className="text-xs text-[#64748B] font-medium mt-0.5">Real-time Sync</div>
            </div>
            <div className="p-2 text-center">
              <div className="text-2xl font-black text-[#4338CA] font-display">
                <AnimatedCounter value={99.9} suffix="%" decimals={1} />
              </div>
              <div className="text-xs text-[#64748B] font-medium mt-0.5">Uptime Reliability</div>
            </div>
            <div className="p-2 text-center">
              <div className="text-2xl font-black text-[#10B981] font-display">
                <AnimatedCounter value={10} prefix="<" suffix="s" />
              </div>
              <div className="text-xs text-[#64748B] font-medium mt-0.5">Batch Attendance</div>
            </div>
            <div className="p-2 text-center">
              <div className="text-2xl font-black text-[#D97706] font-display">
                <AnimatedCounter value={0} prefix="₹" />
              </div>
              <div className="text-xs text-[#64748B] font-medium mt-0.5">Zero Fee Leakage</div>
            </div>
          </motion.div>

          {/* ─── INTERACTIVE DASHBOARD PREVIEW CARD ─── */}
          <div className="relative mt-12 max-w-5xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="rounded-2xl bg-white border border-[#E8EDF4] shadow-[0_20px_60px_-15px_rgba(23,32,51,0.09)] overflow-hidden text-left hover-sheen"
            >
            {/* Top Mockup Titlebar */}
            <div className="px-5 py-3.5 bg-[#172033] text-slate-300 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="ml-3 text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                  ClassTech Admin Control Center — Apex Academy (Session 2026-27)
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                <span>Tenant: APEX01</span>
                <span>•</span>
                <span>Cloud Connected</span>
              </div>
            </div>

            {/* Mockup Interactive Navigation Tabs */}
            <div className="bg-[#F8FAFC] border-b border-[#E8EDF4] px-5 py-2 flex items-center gap-2 overflow-x-auto">
              {[
                { id: 'attendance', label: 'Attendance Register', icon: CheckCircle2 },
                { id: 'fees', label: 'Fee Collection Ledger', icon: CreditCard },
                { id: 'timetable', label: 'Smart Timetable', icon: Calendar },
                { id: 'students', label: 'Student 360° Roster', icon: Users },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeHeroTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveHeroTab(tab.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      active 
                        ? 'bg-white text-[#4338CA] shadow-sm border border-[#E8EDF4]' 
                        : 'text-[#64748B] hover:bg-slate-200/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Mockup Dynamic Screen Content */}
            <div className="p-6 bg-[#F8FAFC]/50 min-h-[320px]">
              
              {/* TAB 1: ATTENDANCE */}
              {activeHeroTab === 'attendance' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl bg-white border border-[#E8EDF4] shadow-card">
                      <div className="text-xs text-[#64748B] font-medium">Class 10-A Present Rate</div>
                      <div className="text-2xl font-black text-[#10B981] mt-1">96.4%</div>
                      <div className="text-[11px] text-[#64748B] mt-0.5">42 Present · 2 Absent · 1 Late</div>
                    </div>
                    <div className="p-4 rounded-xl bg-white border border-[#E8EDF4] shadow-card">
                      <div className="text-xs text-[#64748B] font-medium">Instant SMS Broadcast</div>
                      <div className="text-xs font-bold text-[#10B981] mt-2 flex items-center gap-1">
                        <Check className="w-4 h-4 text-[#10B981]" /> Auto-dispatched to 2 Parents
                      </div>
                      <div className="text-[11px] text-[#64748B] mt-0.5">Zero manual calls needed</div>
                    </div>
                    <div className="p-4 rounded-xl bg-white border border-[#E8EDF4] shadow-card">
                      <div className="text-xs text-[#64748B] font-medium">Classroom Batch</div>
                      <div className="text-xs font-bold text-[#4338CA] mt-1">Morning Science Batch A</div>
                      <div className="text-[11px] text-[#64748B] mt-0.5">07:00 AM - 09:00 AM · Hall 3</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-[#E8EDF4] shadow-card">
                    <div className="flex items-center justify-between mb-3 text-xs font-bold text-[#172033]">
                      <span>Live Roll Call Stream</span>
                      <span className="text-[11px] text-[#4338CA] bg-[#EEF2FF] px-2 py-0.5 rounded-full">1-Click "Mark All Present" Enabled</span>
                    </div>
                    <div className="space-y-2">
                      {[
                        { roll: '101', name: 'Aarav Sharma', status: 'Present', color: 'bg-[#ECFDF5] text-[#10B981] border-[#A7F3D0]' },
                        { roll: '102', name: 'Niranjan Shukla', status: 'Present', color: 'bg-[#ECFDF5] text-[#10B981] border-[#A7F3D0]' },
                        { roll: '103', name: 'Riya Patel', status: 'Absent (SMS Sent)', color: 'bg-[#FFF1F2] text-[#E11D48] border-[#FECDD3]' },
                      ].map((st) => (
                        <div key={st.roll} className="flex items-center justify-between p-2 rounded-lg bg-[#F8FAFC] border border-[#E8EDF4] text-xs">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-[#64748B] font-bold">#{st.roll}</span>
                            <span className="font-semibold text-[#172033]">{st.name}</span>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${st.color}`}>
                            {st.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: FEES */}
              {activeHeroTab === 'fees' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl bg-white border border-[#E8EDF4] shadow-card">
                      <div className="text-xs text-[#64748B] font-medium">Monthly Fee Collected</div>
                      <div className="text-2xl font-black text-[#4338CA] mt-1">₹4,85,000</div>
                      <div className="text-[11px] text-[#10B981] font-semibold mt-0.5">↑ 14% vs last month</div>
                    </div>
                    <div className="p-4 rounded-xl bg-white border border-[#E8EDF4] shadow-card">
                      <div className="text-xs text-[#64748B] font-medium">Outstanding Dues</div>
                      <div className="text-2xl font-black text-[#D97706] mt-1">₹42,000</div>
                      <div className="text-[11px] text-[#64748B] mt-0.5">8 Students overdue</div>
                    </div>
                    <div className="p-4 rounded-xl bg-white border border-[#E8EDF4] shadow-card">
                      <div className="text-xs text-[#64748B] font-medium">Auto Receipt Engine</div>
                      <div className="text-xs font-bold text-[#10B981] mt-2 flex items-center gap-1">
                        <Check className="w-4 h-4 text-[#10B981]" /> Digital PDF Invoices
                      </div>
                      <div className="text-[11px] text-[#64748B] mt-0.5">Instant mobile push receipt</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-[#E8EDF4] shadow-card text-xs">
                    <div className="font-bold text-[#172033] mb-2">Recent Transactions</div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-[#F8FAFC]">
                        <div>
                          <span className="font-semibold text-[#172033]">Aarav Sharma</span>
                          <span className="text-[#64748B] ml-2">Term 1 Installment</span>
                        </div>
                        <span className="font-mono font-bold text-[#10B981]">+₹15,000 (UPI)</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-[#F8FAFC]">
                        <div>
                          <span className="font-semibold text-[#172033]">Niranjan Shukla</span>
                          <span className="text-[#64748B] ml-2">Full Course Fee</span>
                        </div>
                        <span className="font-mono font-bold text-[#10B981]">+₹32,000 (Card)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: TIMETABLE */}
              {activeHeroTab === 'timetable' && (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-white border border-[#E8EDF4] shadow-card flex items-center justify-between">
                    <div>
                      <div className="text-xs text-[#64748B] font-medium">Today's Academic Schedule</div>
                      <div className="text-base font-bold text-[#172033] mt-0.5">Class 10th CBSE · Term II</div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#EEF2FF] text-[#4338CA] border border-[#E0E7FF]">
                      4 Lectures Today
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-white border border-[#E8EDF4] text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-[#4338CA]">07:30 - 08:45 AM</span>
                        <span className="px-2 py-0.5 rounded-md bg-[#ECFDF5] text-[#10B981] font-bold text-[10px]">In Progress</span>
                      </div>
                      <div className="font-bold text-[#172033] text-sm">Advanced Mathematics</div>
                      <div className="text-[#64748B] mt-0.5">Faculty: Prof. R. K. Verma · Room 102</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white border border-[#E8EDF4] text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-[#64748B]">09:00 - 10:15 AM</span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[#64748B] font-bold text-[10px]">Upcoming</span>
                      </div>
                      <div className="font-bold text-[#172033] text-sm">Physics & Mechanics</div>
                      <div className="text-[#64748B] mt-0.5">Faculty: Dr. S. Iyer · Lab 2</div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: STUDENTS */}
              {activeHeroTab === 'students' && (
                <div className="p-4 rounded-xl bg-white border border-[#E8EDF4] shadow-card space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-[#172033]">
                    <span>Active Student Directory</span>
                    <span className="text-[#64748B]">Showing 3 of 240 Enrolled</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-[#64748B] border-b border-slate-100 pb-2">
                          <th className="font-semibold py-1.5">Student Name</th>
                          <th className="font-semibold py-1.5">Course / Batch</th>
                          <th className="font-semibold py-1.5">Parent Contact</th>
                          <th className="font-semibold py-1.5">Fee Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[#172033]">
                        <tr>
                          <td className="py-2.5 font-bold">Niranjan Shukla</td>
                          <td className="py-2.5 text-[#64748B]">Class 10th Morning</td>
                          <td className="py-2.5 font-mono text-[#64748B]">+91 98765 43210</td>
                          <td className="py-2.5"><span className="px-2 py-0.5 rounded bg-[#ECFDF5] text-[#10B981] font-bold">Paid</span></td>
                        </tr>
                        <tr>
                          <td className="py-2.5 font-bold">Aarav Sharma</td>
                          <td className="py-2.5 text-[#64748B]">Class 10th Morning</td>
                          <td className="py-2.5 font-mono text-[#64748B]">+91 98234 56789</td>
                          <td className="py-2.5"><span className="px-2 py-0.5 rounded bg-[#FEF3C7] text-[#D97706] font-bold">Partial</span></td>
                        </tr>
                        <tr>
                          <td className="py-2.5 font-bold">Riya Patel</td>
                          <td className="py-2.5 text-[#64748B]">Class 12th Science</td>
                          <td className="py-2.5 font-mono text-[#64748B]">+91 97654 32109</td>
                          <td className="py-2.5"><span className="px-2 py-0.5 rounded bg-[#ECFDF5] text-[#10B981] font-bold">Paid</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          </motion.div>
          </div>

        </div>

        {/* Classtech Flowing Wave Divider */}
        <div className="mt-16">
          <ClasstechWaveDivider color="#FFFFFF" />
        </div>
      </section>

      {/* ─── 3. TRUST & VALUE SECTION (4 Core Pillars) ─── */}
      <section className="py-16 bg-white border-y border-[#E8EDF4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-[#172033] tracking-tight font-display">
              Built specifically for modern educational institutions.
            </h2>
            <p className="text-sm text-[#64748B] mt-2">
              ClassTech eliminates spreadsheets, fragmented tools, and manual registers with one unified operating system.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Smartphone,
                title: 'Live Mobile Sync',
                desc: 'Real-time synchronization between Web Admin portal and Student/Parent mobile app.',
                color: 'text-[#4338CA] bg-[#EEF2FF] border-[#E0E7FF]'
              },
              {
                icon: Zap,
                title: '1-Click Attendance',
                desc: 'Mark entire batches in under 10 seconds with automated instant SMS alerts to absent parents.',
                color: 'text-[#10B981] bg-[#ECFDF5] border-[#A7F3D0]'
              },
              {
                icon: CreditCard,
                title: 'Zero Fee Leakage',
                desc: 'Structured installment tracking, automated PDF receipt generation, and real-time defaulter lists.',
                color: 'text-[#0284C7] bg-[#F0F9FF] border-[#BAE6FD]'
              },
              {
                icon: ShieldCheck,
                title: 'Multi-Tenant Isolation',
                desc: 'Dedicated school databases with 256-bit encryption and isolated tenant codes.',
                color: 'text-[#D97706] bg-[#FEF3C7] border-[#FDE68A]'
              },
            ].map((pillar, i) => {
              const Icon = pillar.icon;
              return (
                <div 
                  key={i} 
                  className="p-6 rounded-2xl bg-white/90 backdrop-blur-md border border-[#E8EDF4] hover:border-[#C7D2FE] transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover-sheen group"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border mb-4 ${pillar.color} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-[#172033] tracking-tight mb-2">{pillar.title}</h3>
                  <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">{pillar.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── 3.5 SIGNATURE CONNECTED ECOSYSTEM SHOWCASE ─── */}
      <div id="ecosystem">
        <ConnectedEcosystemShowcase onBookDemo={() => setIsDemoModalOpen(true)} />
      </div>

      {/* ─── 4. COMPREHENSIVE FEATURE SHOWCASE ─── */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="px-3 py-1 rounded-full bg-[#EEF2FF] text-[#4338CA] text-xs font-bold border border-[#E0E7FF]">
            Complete Feature Suite
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#172033] tracking-tight mt-3 font-display">
            Everything your school needs to excel.
          </h2>
          <p className="text-sm sm:text-base text-[#64748B] mt-3 leading-relaxed">
            Engineered with deep attention to classroom workflows, administrative compliance, and parent delight.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Users,
              title: 'Student 360° Management',
              desc: 'Complete digital dossiers including bio details, parent contacts, batch history, and academic scores.',
              badge: 'Admissions & Roster'
            },
            {
              icon: CheckCircle2,
              title: 'Batch Attendance Engine',
              desc: 'Rapid attendance register with 1-click "Mark All Present", late tracking, monthly matrix, and absent SMS.',
              badge: 'Real-time SMS'
            },
            {
              icon: CreditCard,
              title: 'Fees & Finance Ledger',
              desc: 'Customizable fee structures, installment schedules, instant PDF receipts, and automated payment reminders.',
              badge: 'Ledger & Receipts'
            },
            {
              icon: Calendar,
              title: 'Timetable & Batch Schedules',
              desc: 'Dynamic classroom allocation, lecture timings, faculty subject assignments, and conflict-free schedules.',
              badge: 'Classroom Ops'
            },
            {
              icon: Award,
              title: 'Exams & Automated Report Cards',
              desc: 'Subjectwise marks entry, grade auto-calculation, term report cards, and student performance trend charts.',
              badge: 'Academics'
            },
            {
              icon: MessageSquare,
              title: 'Parent-Teacher Communication',
              desc: 'Targeted broadcast notices, homework assignments, event alerts, and formal grievance resolution system.',
              badge: 'Collaboration'
            },
            {
              icon: School,
              title: 'Faculty & Staff HR',
              desc: 'Staff profiles, designated subjects, teaching schedules, biometric / digital attendance, and leave management.',
              badge: 'HR & Payroll'
            },
            {
              icon: BarChart3,
              title: 'Reports & Deep Analytics',
              desc: 'Attendance defaulter lists, daily registers, fee collection trends, and one-click CSV/PDF exports.',
              badge: 'Executive BI'
            },
            {
              icon: BookOpen,
              title: 'Digital Notes & Homework',
              desc: 'Upload subjectwise PDF study materials and assignments directly accessible in student mobile app.',
              badge: 'Learning Content'
            },
          ].map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div 
                key={i}
                className="p-6 rounded-2xl bg-white/95 backdrop-blur-md border border-[#E8EDF4] hover:border-[#C7D2FE] transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover-sheen group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] border border-[#E0E7FF] flex items-center justify-center text-[#4338CA] group-hover:scale-110 transition-transform shadow-sm">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-[#4338CA] bg-[#EEF2FF] px-2.5 py-0.5 rounded-full border border-[#E0E7FF]">
                      {feature.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#172033] tracking-tight mb-2">{feature.title}</h3>
                  <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">{feature.desc}</p>
                </div>
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center text-xs font-bold text-[#4338CA] group-hover:text-[#3730A3]">
                  <span>Explore module</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Wave Transition into Dark Mobile Showcase */}
      <ClasstechWaveDivider color="#172033" />

      {/* ─── 5. MOBILE COMPANION APP SHOWCASE ─── */}
      <section id="mobile-app" className="py-20 bg-gradient-to-b from-[#172033] via-[#1E1B4B] to-[#312E81] text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-6 text-left">
              <span className="px-3.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-400/30 inline-flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                Native Student & Parent Companion
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                Empower students & parents on the go.
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                The ClassTech mobile companion delivers instant attendance updates, digital fee receipts, homework assignments, and study materials straight to parents' and students' smartphones.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  { id: 'home', label: '1. Live Student Dashboard & Daily Schedule', desc: 'Real-time lecture timetable, batch details, and school notices' },
                  { id: 'attendance', label: '2. Attendance Streak & Monthly Register', desc: 'Present / absent calendar breakdown and active attendance percentage' },
                  { id: 'fees', label: '3. Digital Fee Receipts & Invoices', desc: 'Transparent payment ledger and downloadable tax invoices' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveMobileTab(s.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                      activeMobileTab === s.id
                        ? 'bg-white/15 border-indigo-400 text-white shadow-lg'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="font-bold text-xs sm:text-sm">{s.label}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{s.desc}</div>
                  </button>
                ))}
              </div>

              <div className="pt-2 flex items-center gap-4">
                <Link
                  to="/app"
                  className="px-6 py-3 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
                >
                  <Smartphone className="w-4 h-4" /> Launch Student Web Portal
                </Link>
                <span className="text-xs text-slate-400">iOS, Android & Web Compatible</span>
              </div>
            </div>

            {/* Smartphone Mockup */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="w-72 sm:w-80 h-[520px] bg-slate-950 rounded-[40px] p-3.5 border-4 border-slate-700 shadow-2xl relative shadow-indigo-500/20 text-left">
                <div className="w-full h-full bg-slate-900 rounded-[30px] p-4 text-xs text-slate-100 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div>
                        <div className="text-[10px] text-slate-400">Welcome Back,</div>
                        <div className="text-sm font-bold text-white">Niranjan Shukla</div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-[#4338CA] text-white flex items-center justify-center font-bold">
                        NS
                      </div>
                    </div>

                    <div className="mt-3 p-3 rounded-xl bg-[#4338CA] text-white">
                      <div className="text-[10px] opacity-80">Enrolled Batch</div>
                      <div className="text-xs font-bold">Morning Science Batch A</div>
                      <div className="text-[10px] opacity-80 mt-0.5">Roll #102 · Session 2026-27</div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700">
                        <div className="text-[10px] text-slate-400">Attendance</div>
                        <div className="text-base font-black text-emerald-400">96.4%</div>
                        <div className="text-[9px] text-emerald-400">18/19 Days Present</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700">
                        <div className="text-[10px] text-slate-400">Fees</div>
                        <div className="text-base font-black text-indigo-400">Cleared</div>
                        <div className="text-[9px] text-slate-400">Zero Pending Dues</div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-800/90 border border-slate-700 mt-3 text-[11px]">
                      <div className="font-bold text-slate-200">Today's Class Schedule</div>
                      <div className="text-slate-400 text-[10px] mt-0.5">07:30 AM · Mathematics (Hall 3)</div>
                    </div>
                  </div>

                  <div className="text-center text-[10px] text-slate-500 pt-2 border-t border-slate-800">
                    Live Synced with ClassTech Cloud ERP
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Wave Transition out of Dark Mobile Showcase */}
      <ClasstechWaveDivider flip color="#312E81" />

      {/* ─── 6. HOW IT WORKS (4 Step Setup) ─── */}
      <section id="how-it-works" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="px-3 py-1 rounded-full bg-[#EEF2FF] text-[#4338CA] text-xs font-bold border border-[#E0E7FF]">
            Effortless Onboarding
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#172033] tracking-tight mt-3 font-display">
            Go live in under 15 minutes.
          </h2>
          <p className="text-sm text-[#64748B] mt-2">
            No expensive hardware or complex IT consultants needed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { step: '01', title: 'Setup School Campus', desc: 'Register your institute name, campus code, and customize academic sessions.' },
            { step: '02', title: 'Create Courses & Batches', desc: 'Define classroom batches, timings, subject fees, and assign faculty.' },
            { step: '03', title: 'Enroll Students', desc: 'Add students with parent mobile numbers for instant automatic app login.' },
            { step: '04', title: 'Automate & Sync', desc: 'Take 1-click batch attendance, track fees, and enjoy real-time reports.' },
          ].map((s, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white border border-[#E8EDF4] shadow-card">
              <div className="text-3xl font-black text-[#4338CA] font-display mb-3">{s.step}</div>
              <h3 className="text-base font-bold text-[#172033] mb-1.5">{s.title}</h3>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 7. PRICING SECTION ─── */}
      <section id="pricing" className="py-20 bg-[#F8FAFC] border-t border-[#E8EDF4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-2xl mx-auto mb-12">
            <span className="px-3 py-1 rounded-full bg-[#EEF2FF] text-[#4338CA] text-xs font-bold border border-[#E0E7FF]">
              Simple & Scalable
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#172033] tracking-tight mt-3 font-display">
              Transparent plans for every school size.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto text-left">
            {/* Starter */}
            <div className="p-6 rounded-2xl bg-white border border-[#E8EDF4] shadow-card flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold uppercase text-[#64748B]">Starter School</div>
                <div className="text-3xl font-black text-[#172033] mt-2 font-display">₹1,499<span className="text-xs font-normal text-[#64748B]">/mo</span></div>
                <div className="text-xs text-[#64748B] mt-1">Up to 150 Students</div>
                <div className="mt-5 space-y-2 text-xs text-[#172033]">
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> Student & Batch Master</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> 1-Click Batch Attendance</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> Fee Receipts & Ledger</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> Student Mobile App Access</div>
                </div>
              </div>
              <button 
                onClick={() => setIsDemoModalOpen(true)}
                className="mt-6 w-full py-2.5 rounded-xl border border-[#E8EDF4] hover:bg-slate-50 text-[#172033] text-xs font-bold transition-all"
              >
                Choose Starter
              </button>
            </div>

            {/* Growth */}
            <div className="p-6 rounded-2xl bg-white border-2 border-[#4338CA] shadow-xl relative flex flex-col justify-between">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#4338CA] text-white text-[10px] font-bold uppercase">
                Most Popular
              </div>
              <div>
                <div className="text-xs font-bold uppercase text-[#4338CA]">Growth Academy</div>
                <div className="text-3xl font-black text-[#172033] mt-2 font-display">₹2,999<span className="text-xs font-normal text-[#64748B]">/mo</span></div>
                <div className="text-xs text-[#64748B] mt-1">Up to 600 Students</div>
                <div className="mt-5 space-y-2 text-xs text-[#172033]">
                  <div className="flex items-center gap-2 font-bold"><Check className="w-4 h-4 text-[#4338CA]" /> Everything in Starter</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#4338CA]" /> Automated Parent SMS Gateway</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#4338CA]" /> Exams, Marks & Report Cards</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#4338CA]" /> Digital Study Notes & PDFs</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#4338CA]" /> Faculty HR & Timetables</div>
                </div>
              </div>
              <button 
                onClick={() => setIsDemoModalOpen(true)}
                className="mt-6 w-full py-2.5 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold shadow-md shadow-indigo-600/25 transition-all"
              >
                Get Started with Growth
              </button>
            </div>

            {/* Enterprise */}
            <div className="p-6 rounded-2xl bg-white border border-[#E8EDF4] shadow-card flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold uppercase text-[#64748B]">Enterprise Campus</div>
                <div className="text-3xl font-black text-[#172033] mt-2 font-display">Custom</div>
                <div className="text-xs text-[#64748B] mt-1">Unlimited Students & Campuses</div>
                <div className="mt-5 space-y-2 text-xs text-[#172033]">
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> Multi-Branch Isolation</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> Custom Domain & Branding</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> Dedicated Cloud Infrastructure</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> 24/7 Priority Support SLA</div>
                </div>
              </div>
              <button 
                onClick={() => setIsDemoModalOpen(true)}
                className="mt-6 w-full py-2.5 rounded-xl border border-[#E8EDF4] hover:bg-slate-50 text-[#172033] text-xs font-bold transition-all"
              >
                Contact Sales
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ─── 7.5 FREQUENTLY ASKED QUESTIONS (FAQ) ACCORDION ─── */}
      <LandingFAQ />

      {/* ─── 8. CALL TO ACTION SECTION ─── */}
      <section className="py-20 bg-[#4338CA] text-white text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 space-y-4">
          <GraduationCap className="w-12 h-12 mx-auto mb-2 opacity-90" />
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight font-display">
            Give your school a smarter foundation.
          </h2>
          <p className="text-indigo-100 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            From admissions to attendance, marks, fees, and parent engagement — ClassTech gives your institution a modern digital backbone.
          </p>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              onClick={() => setIsDemoModalOpen(true)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-[#4338CA] font-bold text-sm shadow-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              <span>Schedule Live Demo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#3730A3] hover:bg-[#312E81] text-white font-bold text-sm border border-indigo-300/30 transition-all"
            >
              Sign In to Portal
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 9. FOOTER ─── */}
      <footer className="bg-[#172033] text-slate-400 py-10 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#4338CA] text-white flex items-center justify-center font-bold">
                <GraduationCap className="w-4 h-4" />
              </div>
              <span className="text-white font-bold text-sm font-display">ClassTech</span>
              <span className="text-slate-500">| Smart School Operating System</span>
            </div>
            <div className="flex items-center gap-6">
              <Link to="/login" className="hover:text-white transition-colors">Admin Login</Link>
              <Link to="/super-admin" className="hover:text-white transition-colors">Superadmin</Link>
              <Link to="/app" className="hover:text-white transition-colors">Student Mobile App</Link>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                All Systems Operational
              </span>
            </div>
          </div>
          <div className="pt-5 flex flex-col sm:flex-row items-center justify-between text-slate-500 gap-3">
            <div>© {new Date().getFullYear()} ClassTech EdTech Systems. All rights reserved.</div>
            <div>Built for modern schools and educational institutes.</div>
          </div>
        </div>
      </footer>

      {/* ─── DEMO BOOKING MODAL ─── */}
      <AnimatePresence>
        {isDemoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-modal border border-[#E8EDF4] max-w-md w-full p-6 relative text-left"
            >
              <button
                onClick={() => setIsDemoModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center mb-3 font-bold">
                <GraduationCap className="w-5 h-5" />
              </div>

              <h3 className="text-lg font-bold text-[#172033] tracking-tight">Schedule a Live ClassTech Demo</h3>
              <p className="text-xs text-[#64748B] mt-1 mb-4">
                See how ClassTech automates attendance, fee collection, and parent communication for your school.
              </p>

              {demoSuccess ? (
                <div className="p-5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-center space-y-1.5">
                  <CheckCircle className="w-8 h-8 text-[#10B981] mx-auto" />
                  <div className="text-xs font-bold text-[#065F46]">Demo Request Received!</div>
                  <p className="text-[11px] text-[#047857]">Our school consultant will reach out within 2 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleDemoSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-[#172033] mb-1">Your Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Rajesh Sharma"
                      value={demoForm.name}
                      onChange={(e) => setDemoForm({ ...demoForm, name: e.target.value })}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E8EDF4] rounded-xl text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-[#4338CA]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#172033] mb-1">School / Institute Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex International Academy"
                      value={demoForm.schoolName}
                      onChange={(e) => setDemoForm({ ...demoForm, schoolName: e.target.value })}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E8EDF4] rounded-xl text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-[#4338CA]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-[#172033] mb-1">Official Email</label>
                      <input
                        type="email"
                        required
                        placeholder="admin@school.com"
                        value={demoForm.email}
                        onChange={(e) => setDemoForm({ ...demoForm, email: e.target.value })}
                        className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E8EDF4] rounded-xl text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-[#4338CA]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#172033] mb-1">Phone Number</label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 98765 43210"
                        value={demoForm.phone}
                        onChange={(e) => setDemoForm({ ...demoForm, phone: e.target.value })}
                        className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E8EDF4] rounded-xl text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-[#4338CA]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="mt-3 w-full py-2.5 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] active:scale-[0.98] text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" /> Submit Demo Request
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default LandingPage;
