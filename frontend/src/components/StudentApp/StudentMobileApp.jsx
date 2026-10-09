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
                  {/* Institute Header Chip */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-blue-100">
                        {institute?.code || student?.instituteCode || 'INST'} Campus
                      </span>
                      <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                        Enrolled
                      </span>
                    </div>
                    <h4 className="font-extrabold text-sm">{institute?.name || student?.instituteName || 'Educational Institution'}</h4>
                    <p className="text-[11px] text-blue-100/90 mt-0.5">
                      {student?.course?.courseName || student?.courseName || 'Academic Program'} • {student?.batch?.batchName || student?.batchName || 'General Cohort'}
                    </p>
                  </div>

                  {/* 2-Column KPI Cards */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Attendance</span>
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <div className="text-xl font-black text-slate-900">
                        {attendance.percentage || 96}%
                      </div>
                      <p className="text-[10px] text-emerald-600 font-bold mt-0.5">Regular</p>
                    </div>

                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Fee Dues</span>
                        <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                      </div>
                      <div className="text-xl font-black text-slate-900">
                        ₹{(student?.balanceFees || 4000).toLocaleString()}
                      </div>
                      <button
                        onClick={handleSimulatePayment}
                        className="text-[10px] text-blue-600 font-bold mt-0.5 hover:underline"
                      >
                        1-Tap Pay →
                      </button>
                    </div>
                  </div>

                  {/* Next Lecture */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-extrabold text-slate-900">Upcoming Session</span>
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        09:00 AM
                      </span>
                    </div>
                    <p className="font-bold text-xs text-slate-800">Core Lecture & Practical Problem Solving</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Assigned Faculty • Lecture Hall 101</p>
                  </div>

                  {/* Pinned Notice */}
                  <div className="bg-amber-50/70 border border-amber-200/80 p-3.5 rounded-2xl text-xs text-amber-900">
                    <p className="font-bold mb-0.5">📢 Campus Announcement</p>
                    <p className="text-[11px] text-amber-800 leading-snug">
                      Upcoming assessment and revision schedule is published. Keep your digital student pass active for attendance verification.
                    </p>
                  </div>
                </>
              )}

              {/* ---------------- TAB 2: ATTENDANCE ---------------- */}
              {activeTab === 'attendance' && (
                <div className="space-y-3">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 text-center shadow-sm">
                    <div className="w-20 h-20 mx-auto rounded-full bg-blue-50 border-4 border-blue-600 flex items-center justify-center mb-2">
                      <span className="text-lg font-black text-blue-600">{attendance.percentage || 100}%</span>
                    </div>
                    <p className="font-bold text-xs text-slate-900">Overall Attendance</p>
                    <p className="text-[11px] text-slate-500">
                      {attendance.present || 6} Present / {attendance.total || 6} Total Sessions
                    </p>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
                    <h5 className="font-bold text-xs text-slate-900 mb-2">Recent Attendance Logs</h5>
                    <div className="space-y-1.5">
                      {['2026-10-08', '2026-10-07', '2026-10-06', '2026-10-04', '2026-10-03', '2026-10-01'].map((d, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs">
                          <span className="font-mono text-[11px] text-slate-600">{d}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Present
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------- TAB 3: STUDY NOTES ---------------- */}
              {activeTab === 'notes' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h5 className="font-extrabold text-xs text-slate-900">Course Learning Materials</h5>
                    <span className="text-[10px] text-slate-400">PDF Watermarked</span>
                  </div>

                  {[
                    { title: 'Core Foundations & Lecture Handbook', subject: 'Core Syllabus', size: '2.8 MB', tag: 'Module 1' },
                    { title: 'Formulas, Theorems & Rapid Reference', subject: 'Reference', size: '1.9 MB', tag: 'Handout' },
                    { title: 'Practice Assignments & Problem Sets', subject: 'Workbook', size: '3.4 MB', tag: 'Module 2' },
                    { title: 'Term Mock Exam & Solved Solutions Key', subject: 'Assessments', size: '4.2 MB', tag: 'Review' },
                  ].map((n, i) => (
                    <div key={i} className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">{n.subject}</span>
                        <p className="font-bold text-xs text-slate-900 mt-1 leading-snug">{n.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{n.size} • {n.tag}</p>
                      </div>
                      <button
                        onClick={() => alert(`Opening ${n.title}`)}
                        className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* ---------------- TAB 4: FEES ---------------- */}
              {activeTab === 'fees' && (
                <div className="space-y-3">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Fee Statement</span>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-xl font-black text-slate-900">
                        ₹{(student?.paidFees || 44000).toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-500">
                        / ₹{(student?.totalFees || 48000).toLocaleString()}
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2 my-2 overflow-hidden">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                    </div>

                    <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-slate-100">
                      <span className="text-slate-500">Outstanding Balance:</span>
                      <span className="font-black text-rose-600">
                        ₹{(student?.balanceFees || 4000).toLocaleString()}
                      </span>
                    </div>

                    <button
                      onClick={handleSimulatePayment}
                      disabled={loading}
                      className="w-full mt-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>{loading ? 'Processing...' : 'Pay ₹4,000 Installment Online'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ---------------- TAB 5: PROFILE ---------------- */}
              {activeTab === 'profile' && (
                <div className="space-y-3">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 text-center shadow-sm">
                    <div className="w-16 h-16 rounded-full bg-blue-600 text-white font-black text-xl flex items-center justify-center mx-auto mb-2 shadow">
                      {student?.fname?.charAt(0) || 'S'}
                    </div>
                    <h4 className="font-extrabold text-sm text-slate-900">
                      {student?.fname} {student?.lname}
                    </h4>
                    <p className="text-[11px] font-mono text-slate-500">{student?.studentId || student?.grno || 'ID-2026-001'}</p>
                    <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Enrolled Student
                    </span>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 text-xs space-y-2 shadow-sm">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Registered Phone:</span>
                      <span className="font-bold text-slate-800">+91 {student?.mobileNo || '9820110001'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Assigned Cohort:</span>
                      <span className="font-bold text-slate-800">{student?.batch?.batchName || student?.batchName || 'General Cohort'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Campus Pass:</span>
                      <span className="font-mono font-bold text-slate-800">VALID ACADEMIC PASS</span>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full py-2.5 rounded-xl border border-rose-200 text-rose-600 font-bold text-xs hover:bg-rose-50 flex items-center justify-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out of App</span>
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
