import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2, CreditCard, Calendar, Award, ArrowRight,
  Play, Smartphone, TrendingUp, Zap, Check,
  QrCode, FileText, Download, Send, ChevronRight
} from 'lucide-react';
import { useNotify } from '../Common/NotificationSystem';

const ERP_TABS = [
  { id: 'attendance', label: 'Attendance', icon: CheckCircle2 },
  { id: 'fees', label: 'Fee Payment', icon: CreditCard },
  { id: 'timetable', label: 'Timetable', icon: Calendar },
  { id: 'grades', label: 'Report Card', icon: Award },
];

const ClassGPT3DHero = ({ onBookDemo, onExplore }) => {
  const notify = useNotify();
  const stageRef = useRef(null);

  const [activeTab, setActiveTab] = useState('attendance');
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  // Attendance simulation state
  const [attendancePunched, setAttendancePunched] = useState(false);
  const [attendanceCount, setAttendanceCount] = useState(1240);

  // Fee payment simulation state
  const [feePaid, setFeePaid] = useState(false);
  const [totalFees, setTotalFees] = useState(485200);

  // Timetable simulation state
  const [timetableResolved, setTimetableResolved] = useState(false);

  // Grades simulation state
  const [gradesGenerated, setGradesGenerated] = useState(false);

  // Subtle 3D mouse parallax
  const handleMouseMove = (e) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 14;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -14;
    setMouseOffset({ x, y });
  };

  const handleMouseLeave = () => {
    setMouseOffset({ x: 0, y: 0 });
  };

  // 1. Trigger Attendance Punch
  const handleTriggerAttendance = () => {
    setAttendancePunched(true);
    setAttendanceCount((prev) => prev + 1);
    notify.success(
      'Attendance Verified',
      'Aarav Sharma marked PRESENT (08:30 AM). Parent notified via SMS.'
    );
    setTimeout(() => setAttendancePunched(false), 3500);
  };

  // 2. Trigger Fee Payment
  const handleTriggerPayment = () => {
    setFeePaid(true);
    setTotalFees((prev) => prev + 5000);
    notify.success(
      'Payment Received: ₹5,000',
      'Transaction settled via UPI. Official receipt issued.'
    );
    setTimeout(() => setFeePaid(false), 3800);
  };

  // 3. Trigger Timetable AI Solver
  const handleTriggerTimetable = () => {
    setTimetableResolved(true);
    notify.info(
      'Timetable Optimized',
      '0 clashes detected across all 42 batches.'
    );
    setTimeout(() => setTimetableResolved(false), 3800);
  };

  // 4. Trigger Grade Curve Calculation
  const handleTriggerGrades = () => {
    setGradesGenerated(true);
    notify.success(
      'Report Cards Ready',
      'Overall Grade: 94.5% (A+). Sent to parent app.'
    );
    setTimeout(() => setGradesGenerated(false), 3800);
  };

  return (
    <div className="relative w-full pt-28 pb-16 lg:pt-32 lg:pb-20 overflow-hidden selection:bg-[#4338CA] selection:text-white">
      {/* Soft Ambient Pale Blue Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[520px] bg-gradient-to-tr from-indigo-100/40 via-sky-50/40 to-blue-100/40 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        
        {/* Minimal Top Pill Badge */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#EEF2FF] border border-[#E0E7FF] text-[#4338CA] text-xs font-bold shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
            <span>Next-Generation School Operating System</span>
          </div>
        </div>

        {/* ─── MAIN HEADLINE (100% OPACITY, CRYSTAL CLEAR) ─── */}
        <div className="text-center max-w-4xl mx-auto mb-6">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#172033] tracking-tight leading-[1.12] font-display">
            One Smart Platform. <br className="hidden sm:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#4338CA] via-[#4F46E5] to-[#0284C7]">
              Every School Connected.
            </span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-[#475569] max-w-2xl mx-auto leading-relaxed font-medium">
            From daily biometric attendance and instant cloud fee collections to zero-conflict scheduling and parent smartphone companion apps — ClassTech unites your entire institution into one effortless, intelligent platform.
          </p>

          {/* Action CTAs */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              onClick={onBookDemo}
              className="w-full sm:w-auto px-7 py-3 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 group"
            >
              <span>Book a Free Live Demo</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={onExplore}
              className="w-full sm:w-auto px-7 py-3 rounded-xl bg-white hover:bg-slate-50 active:scale-[0.98] text-[#172033] font-bold text-xs sm:text-sm border border-[#E8EDF4] shadow-card transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 text-[#4338CA] fill-[#4338CA]" />
              <span>Explore Interactive Modules</span>
            </button>
          </div>
        </div>

        {/* ─── CLEAN, SINGLE-ROW SEGMENTED TABS ─── */}
        <div className="inline-flex items-center p-1 rounded-2xl bg-[#F1F5F9] border border-[#E2E8F0] shadow-inner gap-1 mb-8 max-w-full overflow-x-auto mt-4">
          {ERP_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
                  active
                    ? 'bg-white text-[#172033] shadow-sm'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-[#4338CA]' : 'text-[#94A3B8]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ─── 3D PERSPECTIVE INTERACTIVE VISUALIZATION STAGE ─── */}
        <div
          ref={stageRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative w-full max-w-4xl mx-auto min-h-[440px] sm:min-h-[480px] flex items-center justify-center p-2 sm:p-4"
          style={{ perspective: '1200px' }}
        >
          {/* Main 3D Card Platform with Parallax Tilt */}
          <motion.div
            style={{
              transform: `rotateY(${mouseOffset.x}deg) rotateX(${mouseOffset.y}deg)`,
              transformStyle: 'preserve-3d',
            }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="w-full bg-white/95 backdrop-blur-2xl rounded-3xl border border-[#E8EDF4] shadow-[0_24px_64px_-12px_rgba(23,32,51,0.12)] p-6 sm:p-8 text-left relative overflow-hidden"
          >
            {/* Soft decorative background gradient inside card */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-indigo-50/50 to-transparent rounded-bl-full pointer-events-none" />

            {/* ══════════════════════════════════════════════════════ */}
            {/* VIEW 1: ATTENDANCE */}
            {/* ══════════════════════════════════════════════════════ */}
            {activeTab === 'attendance' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="text-xl sm:text-2xl font-black text-[#172033] font-display">
                    Biometric & RFID Attendance
                  </h3>
                  <div className="text-sm font-black text-emerald-600 font-display">
                    {attendanceCount} / 1,280 Present
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  
                  {/* Left: Interactive Student ID Card & Scanner */}
                  <div className="relative flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-b from-slate-50 to-indigo-50/30 border border-[#E8EDF4] min-h-[250px] overflow-hidden">
                    
                    {/* Scanner Pad */}
                    <div className="w-44 h-8 rounded-xl bg-slate-900 border-2 border-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center mb-6 relative">
                      <div className="w-28 h-1 bg-emerald-400 rounded-full animate-pulse" />
                    </div>

                    {/* Floating Student ID Card */}
                    <motion.div
                      animate={
                        attendancePunched
                          ? { y: [0, -22, 6, 0], rotateZ: [0, -2, 0], scale: [1, 1.04, 0.98, 1] }
                          : { y: [0, -8, 0] }
                      }
                      transition={
                        attendancePunched
                          ? { duration: 0.7, ease: 'easeInOut' }
                          : { repeat: Infinity, duration: 3, ease: 'easeInOut' }
                      }
                      className="w-64 p-4 rounded-2xl bg-white border border-[#C7D2FE] shadow-[0_16px_32px_-8px_rgba(67,56,202,0.18)] relative cursor-pointer"
                      onClick={handleTriggerAttendance}
                    >
                      {attendancePunched && (
                        <motion.div
                          initial={{ top: 0, opacity: 1 }}
                          animate={{ top: '100%', opacity: 0 }}
                          transition={{ duration: 0.6 }}
                          className="absolute left-0 right-0 h-1 bg-emerald-400 shadow-[0_0_12px_#10B981] z-20 pointer-events-none"
                        />
                      )}

                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-md bg-[#4338CA] text-white flex items-center justify-center text-[10px] font-black">
                            C
                          </div>
                          <span className="text-[11px] font-black text-[#172033]">Apex High School</span>
                        </div>
                        <QrCode className="w-4 h-4 text-slate-400" />
                      </div>

                      <div className="mt-3 flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-400 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                          AS
                        </div>
                        <div>
                          <div className="text-xs font-black text-[#172033]">Aarav Sharma</div>
                          <div className="text-[10px] text-[#64748B] font-semibold">Grade 10-A • Roll #24</div>
                          <div className="text-[9px] text-emerald-600 font-mono mt-0.5">RFID: #882-990-21</div>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Right: Verification Status & Trigger Button */}
                  <div className="space-y-4">
                    <div
                      className={`p-4 rounded-2xl border transition-all duration-300 ${
                        attendancePunched
                          ? 'bg-emerald-50 border-emerald-300 shadow-md shadow-emerald-500/10'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2
                          className={`w-5 h-5 ${
                            attendancePunched ? 'text-emerald-600 animate-bounce' : 'text-slate-400'
                          }`}
                        />
                        <span className="font-extrabold text-sm text-[#172033]">
                          {attendancePunched ? 'Present Marked (08:30 AM)' : 'Ready to Punch'}
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white border border-[#E8EDF4] flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#4338CA] flex items-center justify-center shrink-0">
                        <Send className="w-4 h-4" />
                      </div>
                      <div className="text-xs">
                        <span className="font-bold text-[#172033]">Automated Parent SMS</span>
                        <div className="text-[11px] text-[#64748B]">
                          "Aarav Sharma marked present at 08:30 AM."
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleTriggerAttendance}
                      className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      <Zap className="w-4 h-4" />
                      <span>Simulate Student Punch In</span>
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════ */}
            {/* VIEW 2: FEES */}
            {/* ══════════════════════════════════════════════════════ */}
            {activeTab === 'fees' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="text-xl sm:text-2xl font-black text-[#172033] font-display">
                    Fee Collection & Receipt
                  </h3>
                  <div className="text-sm font-black text-[#4338CA] font-display">
                    ₹{totalFees.toLocaleString('en-IN')} Collected
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  
                  {/* Left: Fee Invoice */}
                  <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-50 to-indigo-50/30 border border-[#E8EDF4] space-y-4">
                    <motion.div
                      animate={feePaid ? { scale: [1, 1.02, 1] } : {}}
                      className="p-4 rounded-xl bg-white border border-[#E8EDF4] shadow-sm relative overflow-hidden"
                    >
                      {feePaid && (
                        <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase">
                          PAID
                        </div>
                      )}

                      <div className="text-xs text-[#64748B] font-semibold">Term 1 Tuition</div>
                      <div className="text-2xl font-black text-[#172033] font-display mt-0.5">₹5,000</div>
                      <div className="text-[11px] text-[#64748B] mt-1 flex items-center justify-between border-t border-slate-100 pt-2">
                        <span>Aarav Sharma</span>
                        <span>Due: 15 Oct</span>
                      </div>
                    </motion.div>

                    <button
                      onClick={handleTriggerPayment}
                      className="w-full py-3 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>{feePaid ? 'Payment Processed!' : 'Simulate ₹5,000 UPI Payment'}</span>
                    </button>
                  </div>

                  {/* Right: Receipt Output */}
                  <div className="space-y-4">
                    <div
                      className={`p-4 rounded-2xl border transition-all duration-300 ${
                        feePaid
                          ? 'bg-emerald-50 border-emerald-300 shadow-md shadow-emerald-500/10'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2
                          className={`w-5 h-5 ${feePaid ? 'text-emerald-600 animate-bounce' : 'text-slate-400'}`}
                        />
                        <span className="font-extrabold text-sm text-[#172033]">
                          {feePaid ? 'Official Receipt Issued' : 'Awaiting Payment'}
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white border border-[#E8EDF4] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="text-xs">
                          <span className="font-bold text-[#172033]">Receipt_TXN9402.pdf</span>
                          <div className="text-[10px] text-[#64748B]">Digital verified copy</div>
                        </div>
                      </div>
                      <button
                        onClick={handleTriggerPayment}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-[#172033] flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>PDF</span>
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════ */}
            {/* VIEW 3: TIMETABLE */}
            {/* ══════════════════════════════════════════════════════ */}
            {activeTab === 'timetable' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="text-xl sm:text-2xl font-black text-[#172033] font-display">
                    Smart Timetable
                  </h3>
                  <div className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
                    42 Batches Synced
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  
                  {/* Left: Schedule Slots */}
                  <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-50 to-purple-50/20 border border-[#E8EDF4] space-y-2.5">
                    {[
                      { period: 'Period 1 (08:30)', subject: 'Mathematics', room: 'Room 301', color: 'border-l-indigo-600 bg-white' },
                      { period: 'Period 2 (09:20)', subject: 'Physics Lab', room: 'Physics Lab 2', color: 'border-l-sky-500 bg-white' },
                      { period: 'Period 3 (10:15)', subject: 'Computer AI', room: 'Tech Hub', color: 'border-l-purple-600 bg-white' },
                    ].map((slot, i) => (
                      <motion.div
                        key={i}
                        animate={timetableResolved ? { x: [0, 4, 0] } : {}}
                        transition={{ delay: i * 0.1 }}
                        className={`p-3 rounded-xl border border-[#E8EDF4] border-l-4 shadow-sm flex items-center justify-between ${slot.color}`}
                      >
                        <div>
                          <div className="text-[10px] font-bold text-[#64748B]">{slot.period}</div>
                          <div className="text-xs font-bold text-[#172033]">{slot.subject}</div>
                        </div>
                        <div className="text-[10px] font-semibold text-[#4338CA]">{slot.room}</div>
                      </motion.div>
                    ))}

                    <button
                      onClick={handleTriggerTimetable}
                      className="w-full mt-2 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-600/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      <Zap className="w-4 h-4" />
                      <span>{timetableResolved ? 'Conflicts Resolved!' : 'Run Conflict Check'}</span>
                    </button>
                  </div>

                  {/* Right: Status */}
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="w-5 h-5 text-purple-600" />
                        <span className="font-extrabold text-sm text-[#172033]">
                          Zero Schedule Clashes
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B]">
                        Automated constraint validation for teachers, classrooms, and student batches.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white border border-[#E8EDF4] flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Check className="w-4 h-4" />
                      </div>
                      <div className="text-xs font-bold text-[#172033]">
                        Instant Mobile App Sync
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════ */}
            {/* VIEW 4: REPORT CARD */}
            {/* ══════════════════════════════════════════════════════ */}
            {activeTab === 'grades' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="text-xl sm:text-2xl font-black text-[#172033] font-display">
                    Student Report Card
                  </h3>
                  <div className="text-sm font-black text-amber-600 font-display">
                    GPA: 9.6 / 10
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  
                  {/* Left: Progress Bars */}
                  <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-50 to-amber-50/20 border border-[#E8EDF4] space-y-3">
                    {[
                      { subject: 'Mathematics', score: 98, color: 'bg-emerald-500' },
                      { subject: 'Physics', score: 94, color: 'bg-indigo-600' },
                      { subject: 'Computer Science', score: 96, color: 'bg-purple-600' },
                      { subject: 'Chemistry', score: 90, color: 'bg-amber-500' },
                    ].map((s, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-[#172033]">
                          <span>{s.subject}</span>
                          <span>{s.score}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${s.score}%` }}
                            transition={{ duration: 0.7, delay: i * 0.1 }}
                            className={`h-2 rounded-full ${s.color}`}
                          />
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={handleTriggerGrades}
                      className="w-full mt-3 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-600/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      <Award className="w-4 h-4" />
                      <span>{gradesGenerated ? 'Report Card Assembled!' : 'Calculate Grade Curve'}</span>
                    </button>
                  </div>

                  {/* Right: Grade Badge */}
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-xl shadow-md shadow-amber-500/30 shrink-0">
                        A+
                      </div>
                      <div>
                        <div className="font-extrabold text-sm text-[#172033]">Rank #1 in Class</div>
                        <div className="text-xs text-[#64748B] mt-0.5">
                          Aarav Sharma • Class 10-A
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white border border-[#E8EDF4] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#4338CA] flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div className="text-xs font-bold text-[#172033]">
                          Digital Parent Signature Ready
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                </div>
              </div>
            )}

          </motion.div>
        </div>

      </div>
    </div>
  );
};

export default ClassGPT3DHero;
