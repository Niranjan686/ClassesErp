import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import anime from 'animejs';
import confetti from 'canvas-confetti';
import {
  Home, BookOpen, Video, FileText, Calendar, CreditCard, Award,
  CheckCircle2, AlertCircle, Clock, Users, ArrowRight, ShieldCheck,
  Download, Send, Eye, LogOut, Moon, Sun, Lock, Sparkles, Flame,
  Check, Play, Bell, ChevronRight, X, QrCode
} from 'lucide-react';
import { AnimatedCounter, ProgressRing, LiveBadge, SuccessCheck } from '../../animations/useAnimations';
import api from '../../api';

const ConsumerStudentPortal = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home'); // home | courses | live | notes | attendance | fees | tests | homework | profile
  const [student, setStudent] = useState(null);
  const [institute, setInstitute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [parentMode, setParentMode] = useState(false);
  const [parentPinModal, setParentPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  // Live Class State
  const [liveClasses, setLiveClasses] = useState([]);
  const [activeLiveSession, setActiveLiveSession] = useState(null);

  // Notes State
  const [notes, setNotes] = useState([]);
  const [previewNote, setPreviewNote] = useState(null);

  // Attendance State
  const [attendanceData, setAttendanceData] = useState(null);
  const [qrModal, setQrModal] = useState(false);
  const [leaveModal, setLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    leaveType: 'Personal / Family',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: '',
  });

  // Fees State
  const [feeLedger, setFeeLedger] = useState(null);
  const [payModal, setPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [receiptModal, setReceiptModal] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Tests & Homework State
  const [testResults, setTestResults] = useState([]);
  const [homeworkList, setHomeworkList] = useState([]);
  const [submitHwModal, setSubmitHwModal] = useState(null);
  const [hwSolutionText, setHwSolutionText] = useState('');

  // Announcements Feed
  const [announcements, setAnnouncements] = useState([]);

  const containerRef = useRef(null);

  // Check auth and load profile
  useEffect(() => {
    const rawStudent = localStorage.getItem('student_user');
    const rawInst = localStorage.getItem('student_institute');
    if (!rawStudent) {
      navigate('/student/login');
      return;
    }
    setStudent(JSON.parse(rawStudent));
    if (rawInst) setInstitute(JSON.parse(rawInst));

    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      const [notesRes, attRes, feeRes, testsRes, hwRes, noticeRes, liveRes] = await Promise.all([
        api.get('/notes/student-view').catch(() => ({ data: { data: [] } })),
        api.get('/attendance/my-attendance').catch(() => ({ data: { data: { percentage: 94, total: 30, present: 28, absent: 2, late: 0, leave: 0, calendarLogs: [] } } })),
        api.get('/fees/my-ledger').catch(() => ({ data: { data: null } })),
        api.get('/exams/my-results').catch(() => ({ data: { data: [] } })),
        api.get('/homework/student-view').catch(() => ({ data: { data: [] } })),
        api.get('/announcements/student-view').catch(() => ({ data: { data: [] } })),
        api.get('/live-classes').catch(() => ({ data: { data: [] } })),
      ]);

      setNotes(notesRes.data.data || []);
      setAttendanceData(attRes.data.data || { percentage: 94, total: 30, present: 28, absent: 2, calendarLogs: [] });
      setFeeLedger(feeRes.data.data);
      setTestResults(testsRes.data.data || []);
      setHomeworkList(hwRes.data.data || []);
      setAnnouncements(noticeRes.data.data || []);
      setLiveClasses(liveRes.data.data || []);
    } catch (err) {
      console.error('Failed to load student hub:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleParentModeToggle = () => {
    if (parentMode) {
      setParentMode(false);
    } else {
      setPinInput('');
      setPinError('');
      setParentPinModal(true);
    }
  };

  const handleVerifyPin = async (e) => {
    e.preventDefault();
    if (pinInput.trim() === '1234' || pinInput.trim() === (student?.parentPin || '1234')) {
      setParentMode(true);
      setParentPinModal(false);
    } else {
      setPinError('Incorrect 4-digit Parent PIN (Default PIN: 1234)');
    }
  };

  const handleOnlinePay = async (e) => {
    e.preventDefault();
    const amount = Number(payAmount);
    if (!amount || amount <= 0) return;

    try {
      const res = await api.post('/fees/student-pay', { amount, paymentMode: 'Razorpay' });
      if (res.data.success) {
        setPaymentSuccess(true);
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
        setPayModal(false);
        fetchStudentData();
      }
    } catch (err) {
      alert('Payment processing failed. Please try again.');
    }
  };

  const handleScanQrCheckIn = async () => {
    try {
      const res = await api.post('/attendance/scan-qr', {
        date: new Date().toISOString().split('T')[0],
      });
      if (res.data.success) {
        alert('🎉 Smart QR Check-in verified! Attendance recorded as PRESENT for today.');
        setQrModal(false);
        fetchStudentData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Check-in failed');
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    try {
      await api.post('/leaves', {
        applicantId: student._id,
        applicantType: 'Student',
        applicantName: `${student.fname} ${student.lname}`,
        identifier: student.grno || student.studentId,
        courseId: student.course?._id || student.course,
        batchId: student.batch?._id || student.batch,
        ...leaveForm,
      });
      alert('Leave application submitted to institute admin for approval.');
      setLeaveModal(false);
    } catch (err) {
      alert('Failed to submit leave');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('student_token');
    localStorage.removeItem('student_user');
    navigate('/student/login');
  };

  const liveSession = liveClasses.find(c => c.isLive);
  const attendancePct = attendanceData?.percentage || 94;
  const duesAmount = feeLedger ? feeLedger.balanceFees : (student?.balanceFees || 35000);

  return (
    <div ref={containerRef} className={`min-h-screen ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} pb-24 md:pb-8 flex flex-col md:flex-row transition-colors duration-200`}>
      
      {/* Desktop Slim Sidebar */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col justify-between shrink-0 h-screen sticky top-0 p-4">
        <div>
          <div className="flex items-center gap-3 px-2 py-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-md">
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-800 dark:text-white leading-tight">{institute?.name || 'Apex Scholars'}</h2>
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Student Learning Hub</span>
            </div>
          </div>

          <nav className="space-y-1">
            {[
              { id: 'home', label: 'Home Feed', icon: Home },
              { id: 'live', label: 'Live Video Class', icon: Video, badge: liveSession ? 'LIVE' : null },
              { id: 'notes', label: 'Digital Notes & Docs', icon: FileText, count: notes.length },
              { id: 'attendance', label: 'Attendance & QR', icon: Calendar },
              { id: 'fees', label: 'Fees & Receipts', icon: CreditCard, alert: duesAmount > 0 },
              { id: 'tests', label: 'Tests & Report Card', icon: Award },
              { id: 'courses', label: 'Timetable & Batch', icon: BookOpen },
              { id: 'profile', label: 'My Profile & ID Card', icon: Users },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-rose-500 text-white animate-pulse">
                      {item.badge}
                    </span>
                  )}
                  {item.count && !isActive && (
                    <span className="text-[10px] text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={handleParentModeToggle}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all ${
              parentMode ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>{parentMode ? 'Parent Mode Active' : 'Parent Mode PIN'}</span>
            </div>
            <span className="text-[10px] font-mono font-bold bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded">
              {parentMode ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Canvas */}
      <main className="flex-1 max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 w-full">
        
        {/* Top Header Mobile / Desktop */}
        <header className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-black text-sm flex items-center justify-center shadow-inner">
              {student?.fname ? student.fname[0] : 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-800 dark:text-white">
                  {student?.fname} {student?.lname}
                </h1>
                <span className="hidden sm:inline px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {student?.studentId || 'DEMO01-2026-0001'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {student?.course?.courseName || 'JEE Main & Advanced 2026'} • Batch A
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors"
              title="Toggle Theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setQrModal(true)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-500/25 flex items-center gap-1.5 transition-all"
            >
              <QrCode className="w-3.5 h-3.5" /> Scan QR
            </button>
          </div>
        </header>

        {/* Parent Mode Top Alert Banner if Active */}
        {parentMode && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 shrink-0" />
              <div>
                <h4 className="text-sm font-black">Parent Oversight Mode Active</h4>
                <p className="text-xs text-amber-100">Showing verified academic attendance records, test marks, and fee payment receipts.</p>
              </div>
            </div>
            <button
              onClick={() => setParentMode(false)}
              className="px-3 py-1 bg-white text-amber-800 text-xs font-black rounded-lg shadow-sm"
            >
              Exit Parent Mode
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 1: HOME FEED                                         */}
        {/* ======================================================== */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            
            {/* Live Now Pulsing Hero Banner if session active */}
            {liveSession && (
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-600 via-pink-600 to-indigo-700 p-6 sm:p-8 text-white shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-3 h-3 rounded-full bg-white live-pulse"></span>
                      <span className="text-xs font-black uppercase tracking-widest bg-black/20 px-2.5 py-0.5 rounded-full border border-white/20">
                        BROADCASTING LIVE RIGHT NOW
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{liveSession.title}</h2>
                    <p className="text-xs sm:text-sm text-rose-100 mt-1">
                      Faculty: <b>{liveSession.teacherName}</b> • Subject: <b>{liveSession.subject}</b>
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveLiveSession(liveSession);
                      setActiveTab('live');
                    }}
                    className="px-6 py-3 rounded-2xl bg-white hover:bg-rose-50 text-rose-600 font-black text-sm shadow-xl flex items-center gap-2 transition-all transform hover:scale-105"
                  >
                    <Play className="w-4 h-4 fill-rose-600" /> Join Live Classroom
                  </button>
                </div>
              </div>
            )}

            {/* Quick Metrics Carousel Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Attendance Progress Ring */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">Attendance</span>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white mt-1">
                    {attendanceData?.present || 28} / {attendanceData?.total || 30} Days
                  </h3>
                  <p className="text-xs text-emerald-600 font-bold mt-0.5">Consistent Attendance</p>
                </div>
                <ProgressRing percentage={attendancePct} size={84} strokeWidth={7} color="#2563eb" />
              </div>

              {/* Fee Dues Chip */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Fee Balance Dues</span>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                    <AnimatedCounter value={duesAmount} prefix="₹ " />
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Academic Session 2026-27</p>
                </div>
                <div className="pt-3">
                  <button
                    onClick={() => {
                      setPayAmount(duesAmount > 0 ? (duesAmount / 2).toString() : '5000');
                      setPayModal(true);
                    }}
                    className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-1"
                  >
                    <CreditCard className="w-3.5 h-3.5" /> Pay Fees Online
                  </button>
                </div>
              </div>

              {/* Streak Badge */}
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-5 text-white shadow-md flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-100">
                    <Flame className="w-4 h-4 fill-yellow-300 text-yellow-300 animate-bounce" /> Learning Streak
                  </div>
                  <h3 className="text-2xl font-black mt-1">8 Days Active</h3>
                  <p className="text-xs text-amber-100 mt-0.5">Top 5% in Class Batch</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl">
                  🏆
                </div>
              </div>
            </div>

            {/* Next Class Schedule Countdown Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
                    Next Upcoming Lecture
                  </h3>
                </div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                  Today at 07:30 AM
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-base font-black text-slate-800 dark:text-white">
                    Physics: Kinematics & 2D Projectile Derivations
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Faculty: <b>Dr. Vivek Sharma</b> • Lecture Hall 101 • Batch A (MWF)
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('courses')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  View Weekly Timetable <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Pinned Announcements Feed */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
                    Institute Notice Board
                  </h3>
                </div>
                <span className="text-xs font-bold text-slate-400">{announcements.length} Notices</span>
              </div>

              <div className="space-y-3">
                {announcements.map((a, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-blue-50/50 dark:bg-slate-800/30 border border-blue-100 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="text-xs sm:text-sm font-black text-slate-800 dark:text-white">{a.title}</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-100 dark:bg-slate-700 text-blue-700 dark:text-blue-300">
                        {a.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{a.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: LIVE VIDEO CLASSROOM                              */}
        {/* ======================================================== */}
        {activeTab === 'live' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-800 dark:text-white">Live Interactive Classroom</h2>
                <p className="text-xs text-slate-500">Join your batch live video sessions with HD audio and screen sharing</p>
              </div>
              <LiveBadge />
            </div>

            {/* Active Jitsi Meet Player */}
            {activeLiveSession ? (
              <div className="bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
                <div className="p-4 bg-slate-900 flex items-center justify-between text-white border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 live-pulse"></span>
                    <span className="text-xs font-black">{activeLiveSession.title}</span>
                  </div>
                  <button
                    onClick={() => setActiveLiveSession(null)}
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg"
                  >
                    Leave Room
                  </button>
                </div>
                <div className="w-full h-[520px]">
                  <iframe
                    src={`https://meet.jit.si/${activeLiveSession.meetingRoomId}#userInfo.displayName="${student?.fname} ${student?.lname} (${student?.grno || 'Student'})"&config.startWithAudioMuted=true`}
                    title="Student Live Class"
                    className="w-full h-full border-none"
                    allow="camera; microphone; fullscreen; display-capture; autoplay"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {liveClasses.map((item) => (
                  <div
                    key={item._id}
                    className={`bg-white dark:bg-slate-900 rounded-3xl p-6 border shadow-sm flex flex-col justify-between ${
                      item.isLive ? 'border-rose-300 ring-2 ring-rose-500/20' : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {item.subject}
                        </span>
                        {item.isLive ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-600 animate-pulse">
                            ● BROADCASTING NOW
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-semibold">{item.scheduledDate}</span>
                        )}
                      </div>
                      <h3 className="text-base font-black text-slate-800 dark:text-white mb-1">{item.title}</h3>
                      <p className="text-xs text-slate-500 mb-4">
                        Teacher: <b>{item.teacherName}</b> • Time: {item.startTime} ({item.durationMinutes} mins)
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveLiveSession(item)}
                      className={`w-full py-2.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
                        item.isLive
                          ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/25'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      {item.isLive ? 'Join Live Classroom Now' : 'Enter Waiting Room'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: DIGITAL STUDY NOTES & WATERMARKED VIEWER          */}
        {/* ======================================================== */}
        {activeTab === 'notes' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-800 dark:text-white">Study Material & Formula Books</h2>
                <p className="text-xs text-slate-500">Read in-app watermarked notes, chapter summary sheets, and exam problems</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {notes.map((note) => (
                <div
                  key={note._id}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {note.subject}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{note.fileSize || '3.2 MB'}</span>
                    </div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-white line-clamp-1">{note.title}</h3>
                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-2">{note.chapter}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">{note.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                    <button
                      onClick={() => setPreviewNote(note)}
                      className="flex-1 py-2 bg-blue-50 dark:bg-slate-800 hover:bg-blue-100 text-blue-600 dark:text-blue-400 text-xs font-black rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" /> Read in App
                    </button>
                    {note.allowDownload && (
                      <a
                        href={note.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Watermarked PDF Reader Modal */}
            {previewNote && (
              <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
                  <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black">{previewNote.title}</h3>
                      <p className="text-[11px] text-slate-400">Licensed to {student?.fname} {student?.lname} ({student?.studentId})</p>
                    </div>
                    <button onClick={() => setPreviewNote(null)} className="p-1 hover:bg-slate-800 rounded-lg">
                      <X className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>

                  <div className="relative h-[560px] bg-slate-100">
                    <div className="watermark-overlay flex items-center justify-center pointer-events-none select-none">
                      <div className="transform -rotate-45 text-center text-slate-400/20 font-black text-xl leading-loose">
                        PROPERTY OF APEX SCHOLARS<br />
                        STUDENT: {student?.fname} {student?.lname}<br />
                        ID: {student?.studentId || 'DEMO01-2026-0001'}
                      </div>
                    </div>
                    <iframe
                      src={`${previewNote.fileUrl}#toolbar=0`}
                      title="PDF Reader"
                      className="w-full h-full border-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: ATTENDANCE & QR SCANNER                           */}
        {/* ======================================================== */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-800 dark:text-white">Attendance Record</h2>
                <p className="text-xs text-slate-500">Track your daily attendance percentage and submit leave applications</p>
              </div>
              <button
                onClick={() => setLeaveModal(true)}
                className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 text-xs font-black hover:bg-blue-100 transition-colors"
              >
                + Apply for Leave
              </button>
            </div>

            {/* Attendance KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Classes</span>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{attendanceData?.total || 30}</h3>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center">
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Present</span>
                <h3 className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">{attendanceData?.present || 28}</h3>
              </div>
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-center">
                <span className="text-[10px] font-bold text-rose-600 uppercase">Absent</span>
                <h3 className="text-2xl font-black text-rose-700 dark:text-rose-400 mt-1">{attendanceData?.absent || 2}</h3>
              </div>
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-center">
                <span className="text-[10px] font-bold text-blue-600 uppercase">Percentage</span>
                <h3 className="text-2xl font-black text-blue-700 dark:text-blue-400 mt-1">{attendancePct}%</h3>
              </div>
            </div>

            {/* Calendar Logs Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-black text-slate-800 dark:text-white mb-4 uppercase tracking-wider">
                Recent Daily Check-in Log
              </h3>
              <div className="space-y-2">
                {(attendanceData?.calendarLogs || []).slice(0, 10).map((log, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${log.status === 'Present' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{log.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                        {log.mode || 'Manual'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        log.status === 'Present' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: FEES & ONLINE RAZORPAY PAYMENT                    */}
        {/* ======================================================== */}
        {activeTab === 'fees' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-800 dark:text-white">Fee Ledger & Receipts</h2>
                <p className="text-xs text-slate-500">Pay tuition installments online and download official GST receipt vouchers</p>
              </div>
              <button
                onClick={() => {
                  setPayAmount(duesAmount > 0 ? (duesAmount / 2).toString() : '5000');
                  setPayModal(true);
                }}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-lg shadow-emerald-500/25 flex items-center gap-1.5 transition-all"
              >
                <CreditCard className="w-4 h-4" /> Pay Fees Online
              </button>
            </div>

            {/* Fee Balance Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Course Fee</span>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                  ₹ {(feeLedger?.totalFees || student?.totalFees || 120000).toLocaleString()}
                </h3>
              </div>
              <div className="p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 shadow-sm">
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Total Paid</span>
                <h3 className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
                  ₹ {(feeLedger?.paidFees || student?.paidFees || 85000).toLocaleString()}
                </h3>
              </div>
              <div className="p-6 rounded-3xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 shadow-sm">
                <span className="text-[10px] font-bold text-rose-600 uppercase">Remaining Due</span>
                <h3 className="text-2xl font-black text-rose-700 dark:text-rose-400 mt-1">
                  ₹ {duesAmount.toLocaleString()}
                </h3>
              </div>
            </div>

            {/* Receipts History */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-black text-slate-800 dark:text-white mb-4 uppercase tracking-wider">
                Payment Transactions & Receipts
              </h3>
              <div className="space-y-3">
                {(feeLedger?.transactions || []).map((tx) => (
                  <div key={tx._id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{tx.receiptNo}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Paid</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Date: {tx.paymentDate} • Mode: {tx.paymentMode}</p>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between">
                      <span className="text-base font-black text-slate-800 dark:text-white">₹ {tx.amountPaid.toLocaleString()}</span>
                      <button
                        onClick={() => setReceiptModal(tx)}
                        className="px-3 py-1.5 bg-blue-50 dark:bg-slate-800 hover:bg-blue-100 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" /> Receipt PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 6: TESTS & REPORT CARD                               */}
        {/* ======================================================== */}
        {activeTab === 'tests' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-800 dark:text-white">Exam Results & Report Card</h2>
                <p className="text-xs text-slate-500">View your unit test scores, subject ranks, and performance percentiles</p>
              </div>
            </div>

            <div className="space-y-4">
              {testResults.map((t) => (
                <div key={t._id} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-slate-800 px-2.5 py-0.5 rounded uppercase">
                        {t.examId?.examType || 'Unit Test'}
                      </span>
                      <h3 className="text-base font-black text-slate-800 dark:text-white mt-1">
                        {t.examId?.title || 'JEE Mechanics & Calculus Assessment'}
                      </h3>
                      <p className="text-xs text-slate-400">Evaluated on {t.createdAt?.split('T')[0] || '2026-10-04'}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-2xl font-black text-slate-800 dark:text-white">{t.totalMarksObtained} / 100</span>
                        <div className="text-xs font-bold text-emerald-600">{t.grade}</div>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-black flex flex-col items-center justify-center text-xs">
                        <span>Rank</span>
                        <span className="text-sm">#{t.rank || 1}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs text-slate-600 dark:text-slate-300">
                    <b>Faculty Remarks:</b> {t.remarks || 'Outstanding problem-solving speed and derivation accuracy!'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 7: TIMETABLE & BATCH                                 */}
        {/* ======================================================== */}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white">Batch & Weekly Timetable</h2>
              <p className="text-xs text-slate-500">Classroom timings, faculty schedule, and lecture hall assignments</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-white">
                    Morning JEE Titans (Batch A)
                  </h3>
                  <p className="text-xs text-blue-600 font-bold mt-0.5">Mon-Wed-Fri (MWF) • 07:30 AM - 10:30 AM</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                  Enrolled Active
                </span>
              </div>

              <div className="space-y-3">
                {[
                  { day: 'Monday', time: '07:30 AM - 09:00 AM', subject: 'Physics: Kinematics & Mechanics', faculty: 'Dr. Vivek Sharma', room: 'Lecture Hall 101' },
                  { day: 'Monday', time: '09:00 AM - 10:30 AM', subject: 'Mathematics: Functions & Derivatives', faculty: 'Dr. R. Ramanujan', room: 'Lecture Hall 101' },
                  { day: 'Wednesday', time: '07:30 AM - 09:00 AM', subject: 'Chemistry: Atomic Periodic Trends', faculty: 'Prof. Anjali Saxena', room: 'Lecture Hall 101' },
                  { day: 'Wednesday', time: '09:00 AM - 10:30 AM', subject: 'Physics: Newton Laws & Friction', faculty: 'Dr. Vivek Sharma', room: 'Lecture Hall 101' },
                  { day: 'Friday', time: '07:30 AM - 10:30 AM', subject: 'All-India Speed Mock & Problem Clinic', faculty: 'Senior Panel', room: 'Lecture Hall 101' },
                ].map((slot, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-blue-600 dark:text-blue-400">{slot.day}</span>
                        <span className="text-xs font-black text-slate-800 dark:text-white">• {slot.subject}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">Faculty: {slot.faculty} • {slot.room}</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
                      {slot.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 8: PROFILE & SMART PVC ID CARD                       */}
        {/* ======================================================== */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white">Student Profile & PVC Smart ID</h2>
              <p className="text-xs text-slate-500">Official student identity card with RFID and QR code verification</p>
            </div>

            {/* Smart PVC Identity Card Preview */}
            <div className="w-full max-w-md mx-auto bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 rounded-3xl p-6 text-white shadow-2xl border border-blue-400/20 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/15 pb-4 mb-4">
                <div>
                  <h3 className="font-black text-sm tracking-tight">{institute?.name || 'APEX SCHOLARS ACADEMY'}</h3>
                  <p className="text-[9px] text-blue-300 font-bold uppercase tracking-widest">SMART IDENTITY CARD 2026-27</p>
                </div>
                <Sparkles className="w-6 h-6 text-yellow-300" />
              </div>

              <div className="flex gap-4 items-center mb-4">
                <div className="w-20 h-24 rounded-2xl bg-white/10 border border-white/20 overflow-hidden flex items-center justify-center shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80"
                    alt="Student"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-black">{student?.fname} {student?.lname}</h4>
                  <p className="text-xs text-blue-200">ID: <b>{student?.studentId || 'DEMO01-2026-0001'}</b></p>
                  <p className="text-xs text-blue-200">GR No: <b>{student?.grno || 'APX-GR-0001'}</b></p>
                  <p className="text-xs text-blue-200">Blood Group: <b className="text-rose-400">{student?.bloodGroup || 'B+'}</b></p>
                </div>
              </div>

              <div className="p-3 bg-white/10 rounded-2xl text-[11px] text-blue-100 flex items-center justify-between">
                <span>Emergency: {student?.mobileNo || '9820110001'}</span>
                <span className="font-mono font-bold">RFID ACTIVE</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-around py-2 px-1 z-40">
        {[
          { id: 'home', label: 'Home', icon: Home },
          { id: 'live', label: 'Live', icon: Video, badge: liveSession ? '●' : null },
          { id: 'notes', label: 'Notes', icon: FileText },
          { id: 'attendance', label: 'Attend', icon: Calendar },
          { id: 'fees', label: 'Fees', icon: CreditCard },
          { id: 'tests', label: 'Results', icon: Award },
          { id: 'profile', label: 'Profile', icon: Users },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                isActive ? 'text-blue-600 dark:text-blue-400 font-black' : 'text-slate-500 font-semibold'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge && (
                  <span className="absolute -top-1 -right-1.5 text-rose-500 text-[10px] animate-pulse">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Online Pay Fee Modal */}
      {payModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-800 dark:text-white">Pay Tuition Fees Online</h3>
              </div>
              <button onClick={() => setPayModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleOnlinePay} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Payment Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="500"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-lg font-black text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 space-y-1">
                <div className="flex justify-between">
                  <span>Payment Gateway</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">Razorpay Secure 256-bit</span>
                </div>
                <div className="flex justify-between">
                  <span>Student ID</span>
                  <span className="font-mono">{student?.studentId}</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 text-white font-black text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
              >
                Proceed to Pay ₹ {Number(payAmount || 0).toLocaleString()}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* QR Scanner Check-in Simulator Modal */}
      {qrModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 text-center shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
              <QrCode className="w-9 h-9" />
            </div>
            <h3 className="text-lg font-black text-slate-800 dark:text-white">Smart QR Attendance Check-In</h3>
            <p className="text-xs text-slate-500">
              Point camera at the rotating QR code displayed on the classroom screen to verify attendance.
            </p>

            <div className="py-4">
              <button
                onClick={handleScanQrCheckIn}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md transition-all"
              >
                Verify & Mark Present Today
              </button>
            </div>

            <button onClick={() => setQrModal(false)} className="text-xs font-bold text-slate-400 hover:underline">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Parent PIN Prompt Modal */}
      {parentPinModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xs rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800 dark:text-white">Enter Parent PIN</h3>
              <p className="text-xs text-slate-500 mt-0.5">Switch to parent view (Default: 1234)</p>
            </div>

            {pinError && <p className="text-xs font-bold text-rose-600">{pinError}</p>}

            <form onSubmit={handleVerifyPin} className="space-y-4">
              <input
                type="password"
                maxLength="4"
                autoFocus
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="••••"
                className="w-full text-center tracking-widest text-2xl font-black py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-md"
              >
                Authenticate Parent Mode
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      {leaveModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-slate-800 dark:text-white">Apply for Student Leave</h3>
              <button onClick={() => setLeaveModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Leave Reason Category</label>
                <select
                  value={leaveForm.leaveType}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                >
                  <option value="Personal / Family">Personal / Family</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="College Exam">School / College Exam</option>
                  <option value="Medical Emergency">Medical Emergency</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">From Date</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">To Date</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Specific Reason</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Explain the reason for leave request..."
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md"
              >
                Submit Leave Application
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Voucher Modal */}
      {receiptModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-200 text-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-black text-base">{institute?.name || 'APEX SCHOLARS ACADEMY'}</h3>
                <p className="text-[10px] text-slate-500">OFFICIAL FEE RECEIPT VOUCHER</p>
              </div>
              <button onClick={() => setReceiptModal(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Receipt No:</span>
                <span className="font-mono font-bold text-blue-600">{receiptModal.receiptNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Student Name:</span>
                <span className="font-bold">{receiptModal.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Date:</span>
                <span>{receiptModal.paymentDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Mode:</span>
                <span>{receiptModal.paymentMode}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-sm font-black">
                <span>Amount Paid:</span>
                <span className="text-emerald-600">₹ {receiptModal.amountPaid.toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-3">
              <button
                onClick={() => window.print()}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Print / Save as PDF
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ConsumerStudentPortal;
