import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, CheckCircle2, CreditCard, BookOpen, School, MessageSquare,
  BarChart3, Smartphone, Zap, ArrowRight, Check, Sparkles, Bell,
  Calendar, Award, ChevronRight, RefreshCw, Layers
} from 'lucide-react';
import { triggerAcademicConfetti } from '../Common/MotionWrapper';

/**
 * ConnectedEcosystemShowcase:
 * Signature 2.5D Layered Interactive Section
 * "Everything Your School Needs. One Connected Platform."
 */
const ConnectedEcosystemShowcase = ({ onBookDemo }) => {
  const [activeModuleId, setActiveModuleId] = useState('attendance');
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const modules = [
    {
      id: 'students',
      num: '01',
      title: 'Student 360° Management',
      tagline: 'Admissions, Roster & KYC',
      desc: 'Complete digital dossiers with biographical data, parent contacts, batch history, and academic scores.',
      icon: Users,
      color: 'from-blue-600 to-indigo-600',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
      stats: [
        { label: 'Active Roster', val: '240 Students' },
        { label: 'Enrollment Speed', val: '< 2 Mins' },
        { label: 'KYC Verification', val: '100% Digital' }
      ],
      preview: {
        header: 'New Student Admission Dossier',
        name: 'Aarav Sharma · Roll #104',
        batch: 'Grade 10th - Science Batch A',
        tag: 'Admission Approved',
        tagColor: 'bg-emerald-100 text-emerald-700',
        detail: 'Parent: Dr. R. K. Sharma · +91 98234 56789',
        actionText: 'Dossier Auto-Synced to Cloud'
      }
    },
    {
      id: 'attendance',
      num: '02',
      title: 'Smart Batch Attendance',
      tagline: '1-Click Register & SMS',
      desc: 'Mark entire classroom batches in under 10 seconds. Automated absent SMS broadcasts dispatch instantly.',
      icon: CheckCircle2,
      color: 'from-emerald-500 to-teal-600',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      stats: [
        { label: 'Average Rate', val: '96.8% Present' },
        { label: 'Marking Time', val: '8.4 Seconds' },
        { label: 'SMS Delivery', val: 'Instant Auto-Send' }
      ],
      preview: {
        header: 'Morning Roll Call Matrix',
        name: 'Morning Science Batch A',
        batch: '42 Present · 2 Absent · 1 Late',
        tag: 'SMS Broadcast Dispatched',
        tagColor: 'bg-emerald-100 text-emerald-700',
        detail: 'Absent SMS sent to 2 parent contacts with timestamp',
        actionText: '1-Click "Mark All Present" Active'
      }
    },
    {
      id: 'fees',
      num: '03',
      title: 'Fees & Finance Ledger',
      tagline: 'Zero Fee Leakage',
      desc: 'Configurable installment schedules, automated PDF tax receipts, and live collection defaulter tracking.',
      icon: CreditCard,
      color: 'from-amber-500 to-orange-600',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
      stats: [
        { label: 'Monthly Collected', val: '₹4,85,000' },
        { label: 'Fee Leakage', val: '₹0 (Zero)' },
        { label: 'Receipt Format', val: 'Instant PDF' }
      ],
      preview: {
        header: 'Payment Receipt Ledger',
        name: 'Niranjan Shukla · Term II Installment',
        batch: '₹15,000 via UPI (Ref #TXN-9021)',
        tag: 'Payment Verified',
        tagColor: 'bg-indigo-100 text-indigo-700',
        detail: 'PDF Tax Receipt #CT-982 generated & pushed to parent app',
        actionText: 'Instant Ledger Reconciliation'
      }
    },
    {
      id: 'academics',
      num: '04',
      title: 'Academics & Examination',
      tagline: 'Timetables & Report Cards',
      desc: 'Dynamic classroom allocation, conflict-free faculty schedules, subject master, and automated report cards.',
      icon: BookOpen,
      color: 'from-indigo-600 to-purple-600',
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      stats: [
        { label: 'Weekly Lectures', val: '128 Scheduled' },
        { label: 'Conflict Checks', val: '100% Automated' },
        { label: 'Report Cards', val: '1-Click Batch Print' }
      ],
      preview: {
        header: 'Active Classroom Timetable',
        name: 'Class 10th CBSE · Term II',
        batch: '07:30 AM - 08:45 AM · Advanced Mathematics',
        tag: 'Lecture In Progress',
        tagColor: 'bg-blue-100 text-blue-700',
        detail: 'Faculty: Prof. R. K. Verma · Hall 3 (Room 102)',
        actionText: 'Syllabus Tracker 78% Completed'
      }
    },
    {
      id: 'staff',
      num: '05',
      title: 'Faculty & Staff HR',
      tagline: 'Workload & Attendance',
      desc: 'Staff profiles, designated subjects, teaching schedules, biometric / digital attendance, and workload logs.',
      icon: School,
      color: 'from-sky-500 to-blue-600',
      badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
      stats: [
        { label: 'Active Faculty', val: '18 Teachers' },
        { label: 'Staff Attendance', val: '100% On Duty' },
        { label: 'Workload Balance', val: 'Optimized' }
      ],
      preview: {
        header: 'Faculty Assignment Roster',
        name: 'Prof. S. Iyer · Physics Dept.',
        batch: 'Assigned: Morning Science Batch A & B',
        tag: 'Schedule Confirmed',
        tagColor: 'bg-emerald-100 text-emerald-700',
        detail: 'Daily Workload: 4 Lectures (3h 30m total)',
        actionText: 'Biometric Check-in: 07:15 AM'
      }
    },
    {
      id: 'parent',
      num: '06',
      title: 'Parent Communication',
      tagline: 'Circulars & Direct Alerts',
      desc: 'Targeted broadcast notices, homework assignments, school event alerts, and formal parent queries.',
      icon: MessageSquare,
      color: 'from-pink-500 to-rose-600',
      badgeBg: 'bg-pink-50 text-pink-700 border-pink-200',
      stats: [
        { label: 'Notice Read Rate', val: '98.4%' },
        { label: 'Broadcast Time', val: '< 1 Second' },
        { label: 'Parent Reach', val: '100% Families' }
      ],
      preview: {
        header: 'Official School Broadcast',
        name: 'Annual Academic Exhibition Notice',
        batch: 'Broadcast dispatched to 240 Parents',
        tag: 'Delivered (Push & SMS)',
        tagColor: 'bg-pink-100 text-pink-700',
        detail: 'Event Date: 24th Oct · Venue: Main Auditorium',
        actionText: '184 Parents Confirmed RSVP'
      }
    },
    {
      id: 'reports',
      num: '07',
      title: 'Reports & Deep Analytics',
      tagline: 'Executive BI & Insights',
      desc: 'Attendance trends, defaulter registers, fee collection trends, and one-click regulatory PDF/CSV exports.',
      icon: BarChart3,
      color: 'from-indigo-700 to-blue-700',
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      stats: [
        { label: 'BI Reports', val: '24+ Metrics' },
        { label: 'Export Format', val: 'Excel / PDF / CSV' },
        { label: 'Sync Frequency', val: 'Real-time Live' }
      ],
      preview: {
        header: 'Executive Analytics Summary',
        name: 'Session 2026-27 Academic Health KPI',
        batch: 'Attendance: 96.8% · Fee Collection: 94.2%',
        tag: 'Institution Optimal',
        tagColor: 'bg-emerald-100 text-emerald-700',
        detail: 'Defaulters reduced by 64% vs previous semester',
        actionText: 'Download Complete CSV Report'
      }
    },
    {
      id: 'mobile',
      num: '08',
      title: 'Student & Parent Mobile App',
      tagline: 'Native iOS & Android App',
      desc: 'Live attendance streak, digital fee receipts, lecture schedule, and downloadable study notes on mobile.',
      icon: Smartphone,
      color: 'from-violet-600 to-indigo-700',
      badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
      stats: [
        { label: 'Platform Support', val: 'iOS & Android' },
        { label: 'Offline Mode', val: 'Cached Roster' },
        { label: 'Push Notifications', val: 'Instant Sync' }
      ],
      preview: {
        header: 'Mobile Companion Screen',
        name: 'Student App: Niranjan Shukla',
        batch: 'Session 2026-27 · Roll #102',
        tag: 'Live Cloud Synced',
        tagColor: 'bg-purple-100 text-purple-700',
        detail: 'Attendance: 96.4% · Fees Cleared · 1 Homework Due',
        actionText: 'Tap to View Term Exam Result'
      }
    }
  ];

  // Auto-rotation of modules if user is not hovering/interacting
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setActiveModuleId((curr) => {
        const idx = modules.findIndex((m) => m.id === curr);
        return modules[(idx + 1) % modules.length].id;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, modules.length]);

  const activeModule = modules.find((m) => m.id === activeModuleId) || modules[0];
  const ActiveIcon = activeModule.icon;

  return (
    <section className="py-24 bg-[#F8FAFC] relative overflow-hidden border-t border-[#E8EDF4]">
      
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] max-w-[800px] max-h-[800px] bg-gradient-to-tr from-indigo-100/40 via-blue-50/40 to-transparent rounded-full blur-3xl pointer-events-none -z-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        
        {/* Section Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EEF2FF] border border-[#E0E7FF] text-[#4338CA] text-xs font-bold mb-4 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-[#4338CA]" />
          <span>Unified School Ecosystem</span>
        </div>

        {/* Section Headline */}
        <h2 className="text-3xl sm:text-5xl font-black text-[#172033] tracking-tight leading-tight font-display max-w-3xl mx-auto">
          Everything your school needs. <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#4338CA] via-[#4F46E5] to-[#0284C7]">
            One connected platform.
          </span>
        </h2>

        {/* Supporting Copy */}
        <p className="mt-4 text-sm sm:text-base text-[#64748B] max-w-2xl mx-auto leading-relaxed">
          From admissions to attendance, timetables, fee collections, report cards, and parent communication — ClassTech seamlessly unites all 8 school pillars into one real-time database.
        </p>

        {/* ─── INTERACTIVE 2.5D ECOSYSTEM ORCHESTRATION ─── */}
        <div 
          className="mt-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center text-left"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          
          {/* Left Column: 8 Interactive Module Selector Pills */}
          <div className="lg:col-span-5 space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-3 px-1 flex items-center justify-between">
              <span>Select Core ERP Pillar</span>
              <span className="text-[10px] text-[#4338CA] font-semibold bg-[#EEF2FF] px-2 py-0.5 rounded-full">
                Auto-Sync Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
              {modules.map((m) => {
                const Icon = m.icon;
                const isActive = activeModuleId === m.id;

                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setActiveModuleId(m.id);
                      setIsAutoPlaying(false);
                    }}
                    className={`w-full p-3.5 rounded-2xl border transition-all duration-300 flex items-center justify-between text-left group ${
                      isActive
                        ? 'bg-white border-[#4338CA] shadow-lg shadow-indigo-600/10 ring-2 ring-[#4338CA]/15 translate-x-1.5'
                        : 'bg-white/80 hover:bg-white border-[#E8EDF4] hover:border-slate-300 text-[#64748B]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                        isActive
                          ? `bg-gradient-to-tr ${m.color} text-white shadow-md`
                          : 'bg-[#F1F5F9] text-[#64748B] group-hover:bg-[#EEF2FF] group-hover:text-[#4338CA]'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className={`text-xs font-bold transition-colors ${isActive ? 'text-[#172033]' : 'text-[#334155]'}`}>
                          {m.title}
                        </div>
                        <div className="text-[11px] text-[#64748B] truncate max-w-[180px]">
                          {m.tagline}
                        </div>
                      </div>
                    </div>

                    <ChevronRight className={`w-4 h-4 transition-transform ${
                      isActive ? 'text-[#4338CA] translate-x-0.5' : 'text-slate-300 group-hover:text-slate-500'
                    }`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Dynamic Live Feature Showcase Panel */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeModule.id}
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.98 }}
                transition={{ duration: 0.35 }}
                className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E8EDF4] shadow-[0_20px_60px_-15px_rgba(23,32,51,0.08)] relative overflow-hidden"
              >
                {/* Top Glowing Decorative Accent */}
                <div className={`absolute -top-24 -right-24 w-60 h-60 bg-gradient-to-br ${activeModule.color} opacity-10 rounded-full blur-2xl pointer-events-none`}></div>

                {/* Header Badge & Pillar Number */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${activeModule.badgeBg}`}>
                    <ActiveIcon className="w-3.5 h-3.5" />
                    <span>Module {activeModule.num} · {activeModule.tagline}</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-[#64748B] bg-[#F8FAFC] px-2.5 py-1 rounded-lg border border-[#E8EDF4]">
                    Cloud Synced
                  </span>
                </div>

                {/* Title & Detailed Explanation */}
                <h3 className="text-xl sm:text-2xl font-black text-[#172033] tracking-tight font-display">
                  {activeModule.title}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-[#64748B] leading-relaxed">
                  {activeModule.desc}
                </p>

                {/* Realistic Simulated Product UI Preview Card */}
                <div className="mt-6 p-4.5 rounded-2xl bg-[#F8FAFC] border border-[#E8EDF4] shadow-inner space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-[#172033] pb-2 border-b border-slate-200">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping"></span>
                      {activeModule.preview.header}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${activeModule.preview.tagColor}`}>
                      {activeModule.preview.tag}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-[#172033] text-sm">
                      {activeModule.preview.name}
                    </div>
                    <div className="text-[#4338CA] font-semibold text-xs">
                      {activeModule.preview.batch}
                    </div>
                    <div className="text-[#64748B] text-[11px] pt-1">
                      {activeModule.preview.detail}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-[#64748B]">
                    <span className="flex items-center gap-1 text-[#10B981] font-semibold">
                      <Check className="w-3.5 h-3.5 text-[#10B981]" />
                      {activeModule.preview.actionText}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">ClassTech Engine v2.4</span>
                  </div>
                </div>

                {/* Metric Summary Strip */}
                <div className="mt-6 grid grid-cols-3 gap-3 pt-4 border-t border-slate-100">
                  {activeModule.stats.map((st, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E8EDF4] text-center">
                      <div className="text-[10px] text-[#64748B] font-medium">{st.label}</div>
                      <div className="text-xs sm:text-sm font-bold text-[#172033] mt-0.5 font-display">{st.val}</div>
                    </div>
                  ))}
                </div>

                {/* Action CTA inside Showcase */}
                <div className="mt-6 flex items-center justify-between pt-2">
                  <button
                    onClick={() => {
                      triggerAcademicConfetti();
                      if (onBookDemo) onBookDemo();
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold shadow-md shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center gap-2 group"
                  >
                    <span>Request Demo for {activeModule.title}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                  <span className="text-xs text-[#64748B] font-medium hidden sm:inline">
                    Zero hardware setup required
                  </span>
                </div>

              </motion.div>
            </AnimatePresence>
          </div>

        </div>

      </div>
    </section>
  );
};

export default ConnectedEcosystemShowcase;
