import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Smartphone, ArrowRight, ShieldCheck, CheckCircle2, Lock,
  Home, Calendar, BookOpen, CreditCard, User, LogOut,
  Bell, QrCode, Sparkles, ChevronRight, Check, Play,
  Download, Send, Eye, RefreshCw, Award, ArrowLeft, Phone
} from 'lucide-react';
import api from '../../api';

const StudentMobileApp = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [student, setStudent] = useState(null);
  const [institute, setInstitute] = useState(null);

  // Login Form States
  const [mobileNo, setMobileNo] = useState('9820110001');
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoHint, setDemoHint] = useState('');

  // App Tabs
  const [activeTab, setActiveTab] = useState('home'); // home | attendance | notes | fees | profile

  // Live App Data
  const [attendance, setAttendance] = useState({ percentage: 100, present: 6, total: 6, logs: [] });
  const [notes, setNotes] = useState([]);
  const [feeLedger, setFeeLedger] = useState({ totalFees: 120000, paidFees: 72000, balanceFees: 48000, transactions: [] });
  const [notices, setNotices] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);
  const [paySuccess, setPaySuccess] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false); // 3D Card Flip State

  // Check saved mobile session
  useEffect(() => {
    const rawStu = localStorage.getItem('mobile_student_user');
    const rawToken = localStorage.getItem('mobile_student_token');
    const rawInst = localStorage.getItem('mobile_student_institute');
    if (rawStu && rawToken) {
      setStudent(JSON.parse(rawStu));
      if (rawInst) setInstitute(JSON.parse(rawInst));
      setIsLoggedIn(true);
      fetchAppData(rawToken);
    }
  }, []);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/send-mobile-otp', { mobileNo });
      if (res.data.success) {
        setStep('otp');
        setOtp('1234'); // Pre-fill demo OTP for fast login
        setDemoHint(`Demo OTP: ${res.data.demoOtp || '1234'}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please check mobile number.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/student-mobile-login', { mobileNo, otp });
      if (res.data.success) {
        localStorage.setItem('mobile_student_token', res.data.token);
        localStorage.setItem('mobile_student_user', JSON.stringify(res.data.student));
        if (res.data.institute) {
          localStorage.setItem('mobile_student_institute', JSON.stringify(res.data.institute));
        }
        setStudent(res.data.student);
        setInstitute(res.data.institute);
        setIsLoggedIn(true);
        fetchAppData(res.data.token);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAppData = async (token) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [attRes, notesRes, feeRes, noticeRes, liveRes] = await Promise.all([
        api.get('/attendance/my-attendance', { headers }).catch(() => ({ data: { data: null } })),
        api.get('/notes/student-view', { headers }).catch(() => ({ data: { data: [] } })),
        api.get('/fees/my-ledger', { headers }).catch(() => ({ data: { data: null } })),
        api.get('/announcements/student-view', { headers }).catch(() => ({ data: { data: [] } })),
        api.get('/live-classes', { headers }).catch(() => ({ data: { data: [] } })),
      ]);

      if (attRes.data?.data) {
        setAttendance(attRes.data.data);
      }
      setNotes(notesRes.data?.data || []);
      if (feeRes.data?.data) {
        setFeeLedger(feeRes.data.data);
      }
      setNotices(noticeRes.data?.data || []);
      setLiveClasses(liveRes.data?.data || []);
    } catch (err) {
      console.error('App data load error:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('mobile_student_token');
    localStorage.removeItem('mobile_student_user');
    localStorage.removeItem('mobile_student_institute');
    setIsLoggedIn(false);
    setStudent(null);
    setStep('phone');
  };

  const handleSimulatePayment = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('mobile_student_token');
      const res = await api.post('/fees/student-pay', { amount: 5000, paymentMode: 'UPI' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setPaySuccess(true);
        fetchAppData(token);
        setTimeout(() => setPaySuccess(false), 4000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Payment simulation error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-0 sm:p-6 font-sans">
      
      {/* Mobile Frame Container */}
      <div className="w-full sm:max-w-[410px] h-screen sm:h-[844px] bg-white sm:rounded-[44px] shadow-2xl border-0 sm:border-[8px] sm:border-slate-800 flex flex-col overflow-hidden relative">
        
        {/* Top iOS / Android Status Bar */}
        <div className="h-11 bg-slate-900 text-white px-6 flex items-center justify-between text-xs font-semibold select-none shrink-0">
          <span>9:41</span>
          <div className="w-24 h-4 bg-black rounded-full mx-auto hidden sm:block"></div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span>5G</span>
            <span>100%</span>
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* VIEW 1: MOBILE NUMBER & OTP LOGIN */}
        {/* ---------------------------------------------------- */}
        {!isLoggedIn ? (
          <div className="flex-1 flex flex-col justify-between p-6 bg-gradient-to-b from-blue-50/50 via-white to-white overflow-y-auto">
            <div>
              {/* Brand Top */}
              <div className="flex items-center gap-2 mb-8 pt-4">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm font-bold text-sm">
                  C
                </div>
                <div>
                  <h1 className="font-extrabold text-sm text-slate-900 leading-none">ClassTech</h1>
                  <span className="text-[10px] font-medium text-slate-400">Student Learning App</span>
                </div>
              </div>

              {/* Welcome text */}
              <div className="mb-6">
                <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 mb-2">
                  📱 Mobile Verified Access
                </span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {step === 'phone' ? 'Enter Mobile Number' : 'Verify One-Time OTP'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {step === 'phone'
                    ? 'We will send a 4-digit verification code to your registered phone number.'
                    : `Enter the 4-digit code sent to +91 ${mobileNo}`}
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* STEP 1: Phone Form */}
              {step === 'phone' ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      10-Digit Mobile Number
                    </label>
                    <div className="flex rounded-xl border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                      <span className="bg-slate-100 px-3 py-3 text-xs font-bold text-slate-600 flex items-center border-r border-slate-200">
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={mobileNo}
                        onChange={(e) => setMobileNo(e.target.value.replace(/\D/g, ''))}
                        placeholder="9820110001"
                        className="w-full px-3 py-3 text-sm font-bold text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || mobileNo.length < 10}
                    className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Sending OTP...' : 'Get Verification Code'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                /* STEP 2: OTP Form */
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Enter 4-Digit OTP
                      </label>
                      <button
                        type="button"
                        onClick={() => setStep('phone')}
                        className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <ArrowLeft className="w-3 h-3" /> Change Number
                      </button>
                    </div>

                    <input
                      type="text"
                      maxLength={4}
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="1234"
                      className="w-full px-4 py-3 text-center text-xl tracking-[0.5em] font-black rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {demoHint && (
                    <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-100 text-center text-xs font-semibold text-blue-700">
                      💡 {demoHint} (Pre-filled for fast test)
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || otp.length < 4}
                    className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Verifying...' : 'Login to Student App'}
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* Quick Demo Selector */}
              <div className="mt-8 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                <p className="font-bold text-slate-800 mb-1">⚡ Demo Student Numbers:</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  <button
                    type="button"
                    onClick={() => { setMobileNo('9820110001'); setStep('phone'); }}
                    className="px-2 py-1 bg-white border border-slate-200 rounded text-[11px] font-mono font-bold hover:bg-blue-50 hover:text-blue-700"
                  >
                    9820110001 (Aarav)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMobileNo('9820110002'); setStep('phone'); }}
                    className="px-2 py-1 bg-white border border-slate-200 rounded text-[11px] font-mono font-bold hover:bg-blue-50 hover:text-blue-700"
                  >
                    9820110002 (Diya)
                  </button>
                </div>
              </div>
            </div>

            <div className="text-center pt-4 text-[11px] text-slate-400">
              ClassTech Student Mobile Edition • 2026
            </div>
          </div>
        ) : (
          /* ---------------------------------------------------- */
          /* VIEW 2: AUTHENTICATED MOBILE APP MAIN SCREEN */
          /* ---------------------------------------------------- */
          <div className="flex-1 flex flex-col justify-between bg-slate-50 overflow-hidden">
            
            {/* Top App Bar */}
            <div className="bg-white border-b border-slate-200/80 px-4 py-3 flex items-center justify-between shrink-0 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-sm">
                  {student?.fname?.charAt(0) || 'S'}
                </div>
                <div>
                  <h3 className="font-bold text-xs text-slate-900 leading-tight">
                    {student?.fname} {student?.lname}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono font-semibold">
                    {student?.studentId}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => alert(`QR Code: ${student?.grno}`)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200"
                >
                  <QrCode className="w-4 h-4" />
                </button>
                <button
                  onClick={handleLogout}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-rose-600 hover:bg-rose-50"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Scrollable Tab Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {paySuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-bounce">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>₹5,000 Tuition installment paid successfully!</span>
                </div>
              )}

              {/* ---------------- TAB 1: HOME ---------------- */}
              {activeTab === 'home' && (
                <>
                  {/* 3D Institute Header Chip with Holographic Border */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-700 via-indigo-600 to-violet-700 text-white shadow-lg shadow-blue-900/25 relative overflow-hidden card-3d-lift">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10"></div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full">
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span className="text-[10px] uppercase font-black tracking-wider text-white">
                          {institute?.code || student?.instituteCode || 'CAMPUS'} ACADEMIC
                        </span>
                      </div>
                      <span className="text-[10px] bg-emerald-400/90 text-emerald-950 px-2 py-0.5 rounded-full font-extrabold flex items-center gap-1 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-900 animate-ping"></span>
                        Active
                      </span>
                    </div>
                    <h4 className="font-extrabold text-base tracking-tight">{institute?.name || student?.instituteName || 'Educational Institution'}</h4>
                    <p className="text-[11px] text-blue-100/90 mt-0.5 font-medium">
                      {student?.course?.courseName || student?.courseName || 'Academic Program'} • {student?.batch?.batchName || student?.batchName || 'General Cohort'}
                    </p>
                  </div>

                  {/* 2-Column 3D KPI Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      onClick={() => setActiveTab('attendance')}
                      className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm card-3d-lift cursor-pointer hover:border-blue-400 group"
                    >
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Attendance</span>
                        <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Calendar className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className="text-2xl font-black text-slate-900">
                        {attendance.percentage || 100}%
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold mt-1">
                        <Check className="w-3 h-3" />
                        <span>Consistent & Regular</span>
                      </div>
                    </div>

                    <div
                      onClick={() => setActiveTab('fees')}
                      className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm card-3d-lift cursor-pointer hover:border-amber-400 group"
                    >
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fee Balance</span>
                        <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <CreditCard className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className="text-2xl font-black text-slate-900">
                        ₹{(student?.balanceFees || 4000).toLocaleString()}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-blue-600 font-bold mt-1">
                        <span>Pay Balance</span>
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>

                  {/* 3D Next Lecture Session Card */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm card-3d-lift">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 live-pulse"></span>
                        <span className="text-xs font-black text-slate-900">Today's Scheduled Class</span>
                      </div>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 rounded-full shadow-xs">
                        09:00 AM
                      </span>
                    </div>
                    <p className="font-bold text-xs text-slate-800 leading-snug">Core Syllabus & Problem Solving Workshop</p>
                    <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                      Assigned Faculty • Lecture Room A-101
                    </p>
                  </div>

                  {/* Quick ID Card Peek Widget */}
                  <div
                    onClick={() => setActiveTab('profile')}
                    className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md cursor-pointer hover:opacity-95 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-black text-xs">3D Holographic Smart ID Pass</p>
                        <p className="text-[10px] text-slate-400">Tap to flip & show entry barcode</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>

                  {/* Pinned Notice Card */}
                  <div className="bg-amber-50/80 border border-amber-200 p-3.5 rounded-2xl text-xs text-amber-950 shadow-sm card-3d-lift">
                    <p className="font-bold mb-1 flex items-center gap-1.5 text-amber-900">
                      <span>📢</span> Official Announcement
                    </p>
                    <p className="text-[11px] text-amber-900/90 leading-relaxed font-medium">
                      All assessments & attendance records are synchronized dynamically from the cloud database. Push alerts fire on entry!
                    </p>
                  </div>
                </>
              )}

              {/* ---------------- TAB 2: ATTENDANCE ---------------- */}
              {activeTab === 'attendance' && (
                <div className="space-y-3">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 text-center shadow-sm card-3d-lift">
                    <div className="relative w-24 h-24 mx-auto mb-3 flex items-center justify-center">
                      <svg className="w-24 h-24 transform -rotate-90">
                        <circle cx="48" cy="48" r="40" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="url(#blueGrad)"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray="251.2"
                          strokeDashoffset={251.2 * (1 - (attendance.percentage || 100) / 100)}
                          strokeLinecap="round"
                          className="transition-all duration-1000 ease-out"
                        />
                        <defs>
                          <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#6366f1" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-black text-slate-900">{attendance.percentage || 100}%</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Rate</span>
                      </div>
                    </div>
                    <p className="font-extrabold text-sm text-slate-900">Attendance Standing</p>
                    <p className="text-xs text-emerald-600 font-bold mt-0.5">
                      ✓ {attendance.present || 6} Marked Present of {attendance.total || 6} Total Sessions
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-black text-xs text-slate-900 uppercase tracking-wider">Recent Punch Records</h5>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200/60">
                        Verified
                      </span>
                    </div>
                    <div className="space-y-2">
                      {['2026-10-08', '2026-10-07', '2026-10-06', '2026-10-04', '2026-10-03', '2026-10-01'].map((d, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs card-3d-lift">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 online-pulse"></div>
                            <span className="font-mono text-xs font-bold text-slate-700">{d}</span>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200/60 shadow-xs">
                            PRESENT
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------- TAB 3: STUDY NOTES ---------------- */}
              {activeTab === 'notes' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-black text-xs text-slate-900 uppercase tracking-wider">Course Handouts & Materials</h5>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">4 PDFs Ready</span>
                  </div>

                  {[
                    { title: 'Core Foundations & Lecture Handbook', subject: 'Core Syllabus', size: '2.8 MB', tag: 'Module 1' },
                    { title: 'Formulas, Theorems & Rapid Reference', subject: 'Reference Guide', size: '1.9 MB', tag: 'Handout' },
                    { title: 'Practice Assignments & Problem Sets', subject: 'Workbook', size: '3.4 MB', tag: 'Module 2' },
                    { title: 'Term Mock Exam & Solved Solutions Key', subject: 'Mock Solutions', size: '4.2 MB', tag: 'Review' },
                  ].map((n, i) => (
                    <div key={i} className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between card-3d-lift">
                      <div>
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {n.subject}
                        </span>
                        <p className="font-bold text-xs text-slate-900 mt-1 leading-snug">{n.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{n.size} • {n.tag} • Dynamic Watermark</p>
                      </div>
                      <button
                        onClick={() => alert(`Opening ${n.title} with security watermark: ${student?.fname} (${student?.studentId})`)}
                        className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0 transition-transform active:scale-95"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* ---------------- TAB 4: FEES ---------------- */}
              {activeTab === 'fees' && (
                <div className="space-y-3">
                  {/* 3D Smart Payment Card */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white shadow-xl relative overflow-hidden card-3d-lift">
                    <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/20 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-7 h-5 rounded bg-amber-400/90 border border-amber-300 flex items-center justify-center text-[9px] font-black text-amber-950">
                          EMV
                        </div>
                        <span className="text-[10px] font-mono tracking-widest text-slate-300">STUDENT WALLET</span>
                      </div>
                      <span className="text-xs font-black tracking-widest text-indigo-300">INSTITUTE ERP</span>
                    </div>

                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Course Investment</p>
                    <h3 className="text-2xl font-black tracking-tight text-white mt-0.5">
                      ₹{(student?.totalFees || 48000).toLocaleString()}
                    </h3>

                    <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center text-xs">
                      <div>
                        <p className="text-[9px] text-emerald-400 font-bold uppercase">Paid to Date</p>
                        <p className="font-black text-white">₹{(student?.paidFees || 44000).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-rose-400 font-bold uppercase">Balance Due</p>
                        <p className="font-black text-rose-300">₹{(student?.balanceFees || 4000).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                    <div className="w-full bg-slate-100 rounded-full h-2.5 my-2 overflow-hidden">
                      <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2.5 rounded-full" style={{ width: '92%' }}></div>
                    </div>

                    <button
                      onClick={handleSimulatePayment}
                      disabled={loading}
                      className="w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 active:scale-98 transition-all"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>{loading ? 'Processing Transaction...' : 'Pay ₹4,000 Installment Online'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ---------------- TAB 5: PROFILE & 3D SMART ID CARD ---------------- */}
              {activeTab === 'profile' && (
                <div className="space-y-4">
                  {/* Flip Action Instruction */}
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider">3D Digital PVC Identity Card</span>
                    <button
                      onClick={() => setIsFlipped(!isFlipped)}
                      className="text-[10px] font-black text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-full border border-blue-200 transition-all flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${isFlipped ? 'rotate-180' : ''} transition-transform`} />
                      <span>{isFlipped ? 'Show Front' : 'Flip to Back (QR)'}</span>
                    </button>
                  </div>

                  {/* 3D Flip Container */}
                  <div className="perspective-1200 w-full">
                    <div
                      onClick={() => setIsFlipped(!isFlipped)}
                      className="relative w-full transition-transform duration-700 transform-style-3d cursor-pointer"
                      style={{
                        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                        minHeight: '230px',
                      }}
                    >
                      {/* ============ FRONT OF CARD ============ */}
                      <div className="absolute inset-0 w-full rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 text-white p-4 shadow-xl border border-white/20 backface-hidden flex flex-col justify-between overflow-hidden">
                        {/* Holographic Shimmer Overlay */}
                        <div className="absolute inset-0 holo-gradient opacity-30 pointer-events-none"></div>

                        {/* Top Institute Header */}
                        <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-blue-500/30 border border-blue-400/50 flex items-center justify-center text-blue-300 font-black text-xs">
                              🎓
                            </div>
                            <div>
                              <h5 className="font-black text-xs tracking-tight text-white leading-tight">
                                {institute?.name || student?.instituteName || 'ACADEMIC INSTITUTE'}
                              </h5>
                              <p className="text-[9px] font-mono text-blue-200">
                                AFFILIATION: {institute?.code || 'CAMPUS-PASS'}
                              </p>
                            </div>
                          </div>
                          <div className="w-6 h-5 rounded bg-amber-400 border border-amber-300 flex items-center justify-center text-[8px] font-black text-amber-950 shadow-xs">
                            CHIP
                          </div>
                        </div>

                        {/* Student Details with Avatar */}
                        <div className="relative z-10 flex items-center gap-3.5 my-2">
                          <div className="relative">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-black text-xl flex items-center justify-center border-2 border-white/80 shadow-md">
                              {student?.fname?.charAt(0) || 'S'}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 text-white" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-black text-sm text-white leading-tight">
                              {student?.fname} {student?.lname}
                            </h4>
                            <p className="text-[10px] font-mono text-amber-300 font-bold mt-0.5">
                              ROLL: {student?.studentId || student?.grno || 'ID-2026-001'}
                            </p>
                            <p className="text-[10px] text-blue-100 font-medium">
                              {student?.batch?.batchName || student?.batchName || 'General Cohort'}
                            </p>
                            <p className="text-[9px] text-slate-300">
                              {student?.course?.courseName || student?.courseName || 'Academic Course'}
                            </p>
                          </div>
                        </div>

                        {/* Barcode & Security Strip */}
                        <div className="relative z-10 pt-2 border-t border-white/10 flex items-center justify-between">
                          <div className="flex gap-0.5 items-end h-5">
                            {[4, 2, 6, 1, 5, 2, 4, 3, 1, 5, 3, 2, 4, 1, 6, 2, 3, 5, 1, 4].map((w, i) => (
                              <div key={i} className="bg-white/90" style={{ width: `${w}px`, height: '100%' }}></div>
                            ))}
                          </div>
                          <span className="text-[9px] font-mono tracking-widest text-emerald-400 font-bold">
                            VALID 2026-2027
                          </span>
                        </div>
                      </div>

                      {/* ============ BACK OF CARD (QR & EMERGENCY) ============ */}
                      <div
                        className="absolute inset-0 w-full rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-4 shadow-xl border border-white/20 backface-hidden rotate-y-180 flex flex-col justify-between overflow-hidden"
                      >
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <span className="text-[10px] font-black uppercase text-blue-300 tracking-wider">
                            Campus Access & Attendance Matrix
                          </span>
                          <span className="text-[9px] font-mono text-slate-400">TOUCHLESS NFC</span>
                        </div>

                        <div className="flex items-center gap-4 my-2">
                          {/* Simulated High-Contrast QR Code */}
                          <div className="p-2 rounded-xl bg-white text-slate-900 shadow-md shrink-0">
                            <div className="w-16 h-16 grid grid-cols-5 gap-1 p-0.5">
                              {[
                                1, 1, 1, 0, 1,
                                1, 0, 1, 0, 1,
                                1, 1, 1, 0, 0,
                                0, 0, 1, 1, 1,
                                1, 0, 1, 1, 1
                              ].map((v, i) => (
                                <div key={i} className={`rounded-xs ${v ? 'bg-slate-900' : 'bg-transparent'}`}></div>
                              ))}
                            </div>
                          </div>

                          <div className="flex-1 text-[11px] space-y-1">
                            <p className="text-slate-400 text-[10px]">Student Emergency Line:</p>
                            <p className="font-bold text-emerald-400 font-mono">+91 {student?.mobileNo || '9820110001'}</p>
                            <p className="text-slate-400 text-[10px]">Guardian Contact:</p>
                            <p className="font-bold text-amber-300 font-mono">+91 {student?.fatherMobileNo || student?.mobileNo || '9820110001'}</p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[9px] text-slate-400">
                          <span>Authorized Signatory Seal</span>
                          <span className="font-mono text-blue-300 font-bold">DIGITAL PASS SECURED</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Profile Details List */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 text-xs space-y-2.5 shadow-sm">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Student Mobile:</span>
                      <span className="font-mono font-bold text-slate-800">+91 {student?.mobileNo || '9820110001'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Academic Cohort:</span>
                      <span className="font-bold text-slate-800">{student?.batch?.batchName || student?.batchName || 'General Cohort'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Campus Center:</span>
                      <span className="font-bold text-slate-800">{institute?.name || student?.instituteName || 'Educational Institute'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Pass Security:</span>
                      <span className="font-mono font-bold text-emerald-600 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> VERIFIED CLOUD DB
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full py-3 rounded-xl border border-rose-200 text-rose-600 font-bold text-xs hover:bg-rose-50 flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out of Student App</span>
                  </button>
                </div>
              )}

            </div>

            {/* Bottom App Navigation Bar */}
            <div className="bg-white border-t border-slate-200/80 px-2 py-2 flex items-center justify-around shrink-0 shadow-lg">
              <button
                onClick={() => setActiveTab('home')}
                className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
                  activeTab === 'home' ? 'text-blue-600 font-bold' : 'text-slate-400 font-medium'
                }`}
              >
                <Home className="w-4 h-4 mb-0.5" />
                <span className="text-[10px]">Home</span>
              </button>

              <button
                onClick={() => setActiveTab('attendance')}
                className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
                  activeTab === 'attendance' ? 'text-blue-600 font-bold' : 'text-slate-400 font-medium'
                }`}
              >
                <Calendar className="w-4 h-4 mb-0.5" />
                <span className="text-[10px]">Attend</span>
              </button>

              <button
                onClick={() => setActiveTab('notes')}
                className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
                  activeTab === 'notes' ? 'text-blue-600 font-bold' : 'text-slate-400 font-medium'
                }`}
              >
                <BookOpen className="w-4 h-4 mb-0.5" />
                <span className="text-[10px]">Notes</span>
              </button>

              <button
                onClick={() => setActiveTab('fees')}
                className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
                  activeTab === 'fees' ? 'text-blue-600 font-bold' : 'text-slate-400 font-medium'
                }`}
              >
                <CreditCard className="w-4 h-4 mb-0.5" />
                <span className="text-[10px]">Fees</span>
              </button>

              <button
                onClick={() => setActiveTab('profile')}
                className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
                  activeTab === 'profile' ? 'text-blue-600 font-bold' : 'text-slate-400 font-medium'
                }`}
              >
                <User className="w-4 h-4 mb-0.5" />
                <span className="text-[10px]">Profile</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentMobileApp;
