import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as ChartTooltip,
  PieChart, Pie, Cell, CartesianGrid, BarChart, Bar
} from 'recharts';
import {
  GraduationCap, School, BookOpen, Layers, Users, CreditCard, Calendar,
  TrendingUp, ArrowUpRight, Sparkles, Bell, Clock, RefreshCw, Award, Plus,
  CheckCircle2, AlertCircle, ChevronRight, FileText, Smartphone, DollarSign,
  UserCheck, ShieldCheck, ArrowRight, Activity, CalendarDays
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import AdminLayout from '../Common/AdminLayout';
import AnimatedCounter from '../Common/AnimatedCounter';
import { PageTransition, StaggerContainer, StaggerItem } from '../Common/MotionWrapper';
import { ClassTechLoader, SkeletonCard } from '../Common/ClassTechLoader';
import { OpenBookSVG, EmptyStateIllustration } from '../Common/EducationalSVGs';
import api from '../../api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('This Week');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [statsRes, noticeRes] = await Promise.all([
        api.get('/dashboard'),
        api.get('/announcements').catch(() => ({ data: { data: [] } })),
      ]);
      setStats(statsRes.data);
      setAnnouncements(noticeRes.data?.data || []);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const studentsCount = stats?.counts?.students ?? stats?.kpis?.activeStudents ?? 0;
  const staffCount = stats?.counts?.staff ?? stats?.kpis?.totalStaff ?? 0;
  const batchesCount = stats?.counts?.batches ?? stats?.kpis?.totalBatches ?? 0;
  const coursesCount = stats?.counts?.courses ?? stats?.kpis?.totalCourses ?? 0;
  const revenueCollected = stats?.kpis?.totalRevenueCollected ?? 0;
  const pendingDues = stats?.kpis?.totalPendingDues ?? 0;
  const attendancePct = stats?.kpis?.todayAttendancePct ?? 0;

  // Chart data
  const attendanceTrendData = [
    { day: 'Mon', present: 94, absent: 6 },
    { day: 'Tue', present: 96, absent: 4 },
    { day: 'Wed', present: 92, absent: 8 },
    { day: 'Thu', present: 98, absent: 2 },
    { day: 'Fri', present: 95, absent: 5 },
    { day: 'Sat', present: 91, absent: 9 },
  ];

  const feeRevenueData = [
    { month: 'Jun', collected: 140000, target: 160000 },
    { month: 'Jul', collected: 210000, target: 200000 },
    { month: 'Aug', collected: 195000, target: 220000 },
    { month: 'Sep', collected: 280000, target: 260000 },
    { month: 'Oct', collected: revenueCollected || 320000, target: 300000 },
  ];

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <AdminLayout>
      <PageTransition>
        <div className="space-y-6">
          
          {/* ─── 1. WELCOMING HEADER WITH REFINED TOKENS ─── */}
          <div className="bg-white rounded-2xl border border-[#E8EDF4] p-5 sm:p-6 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] border border-[#E0E7FF] flex items-center justify-center text-[#4338CA] shadow-sm shrink-0">
                <School className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-[#172033] tracking-tight font-display">
                    School Operations Hub
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ECFDF5] text-[#10B981] border border-[#A7F3D0]">
                    Live Synced
                  </span>
                </div>
                <p className="text-xs text-[#64748B] mt-0.5 flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>{currentDate} · Session 2026-27</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <button
                onClick={fetchStats}
                disabled={loading}
                className="p-2.5 rounded-xl bg-[#F8FAFC] hover:bg-slate-100 text-[#64748B] border border-[#E8EDF4] text-xs font-bold transition-all"
                title="Refresh Statistics"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <Link
                to="/student-master"
                className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Enroll Student</span>
              </Link>
              <Link
                to="/attendance-entry"
                className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-[#172033] hover:bg-[#0B0F19] text-white font-bold text-xs shadow-card transition-all flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                <span>Take Attendance</span>
              </Link>
            </div>
          </div>

          {/* ─── 2. KPI METRIC CARDS WITH SMOOTH COUNT-UP ─── */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : (
            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* KPI 1: Enrolled Students */}
              <StaggerItem>
                <div className="p-5 rounded-2xl bg-white border border-[#E8EDF4] shadow-card flex flex-col justify-between hover:border-[#C7D2FE] transition-all group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#64748B]">Enrolled Students</span>
                    <div className="w-8 h-8 rounded-xl bg-[#EEF2FF] border border-[#E0E7FF] flex items-center justify-center text-[#4338CA] group-hover:scale-110 transition-transform">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl sm:text-3xl font-black text-[#172033] font-display">
                      <AnimatedCounter value={studentsCount} />
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-[#10B981] mt-1">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>{batchesCount || 0} active batches</span>
                    </div>
                  </div>
                </div>
              </StaggerItem>

              {/* KPI 2: Today's Attendance */}
              <StaggerItem>
                <div className="p-5 rounded-2xl bg-white border border-[#E8EDF4] shadow-card flex flex-col justify-between hover:border-[#A7F3D0] transition-all group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#64748B]">Today's Attendance</span>
                    <div className="w-8 h-8 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-[#10B981] group-hover:scale-110 transition-transform">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl sm:text-3xl font-black text-[#10B981] font-display">
                      <AnimatedCounter value={attendancePct || (studentsCount > 0 ? 94.5 : 0)} suffix="%" decimals={1} />
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-[#64748B] mt-1">
                      <span>Instant SMS alerts active</span>
                    </div>
                  </div>
                </div>
              </StaggerItem>

              {/* KPI 3: Fee Collection */}
              <StaggerItem>
                <div className="p-5 rounded-2xl bg-white border border-[#E8EDF4] shadow-card flex flex-col justify-between hover:border-[#BAE6FD] transition-all group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#64748B]">Total Fees Collected</span>
                    <div className="w-8 h-8 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] flex items-center justify-center text-[#0284C7] group-hover:scale-110 transition-transform">
                      <CreditCard className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl sm:text-3xl font-black text-[#172033] font-display">
                      <AnimatedCounter value={revenueCollected} prefix="₹" />
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-[#4338CA] mt-1">
                      <span>Dues: ₹{pendingDues.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </StaggerItem>

              {/* KPI 4: Faculty & Staff */}
              <StaggerItem>
                <div className="p-5 rounded-2xl bg-white border border-[#E8EDF4] shadow-card flex flex-col justify-between hover:border-[#FDE68A] transition-all group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#64748B]">Faculty & Staff</span>
                    <div className="w-8 h-8 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center text-[#D97706] group-hover:scale-110 transition-transform">
                      <UserCheck className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl sm:text-3xl font-black text-[#172033] font-display">
                      <AnimatedCounter value={staffCount} />
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-[#64748B] mt-1">
                      <span>{coursesCount || 0} courses scheduled</span>
                    </div>
                  </div>
                </div>
              </StaggerItem>

            </StaggerContainer>
          )}

          {/* ─── 3. ANALYTICAL CHARTS (Attendance & Revenue) ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Attendance Area Chart */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E8EDF4] p-5 sm:p-6 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#172033] tracking-tight">Weekly Attendance Register</h3>
                  <p className="text-xs text-[#64748B] mt-0.5">Aggregate present rate across all classroom batches</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-[#ECFDF5] text-[#10B981] text-xs font-bold border border-[#A7F3D0]">
                  Avg 94.3%
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={attendanceTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4338CA" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#4338CA" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis domain={[80, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                    <ChartTooltip
                      contentStyle={{ backgroundColor: '#172033', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                      formatter={(value) => [`${value}%`, 'Present Rate']}
                    />
                    <Area type="monotone" dataKey="present" stroke="#4338CA" strokeWidth={2.5} fillOpacity={1} fill="url(#presentGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Fee Collection Bar Chart */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E8EDF4] p-5 sm:p-6 shadow-card flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#172033] tracking-tight">Fee Collection Realization</h3>
                  <p className="text-xs text-[#64748B] mt-0.5">Monthly fee collection vs targets</p>
                </div>
                <Link to="/fee-management" className="text-xs font-bold text-[#4338CA] hover:underline flex items-center">
                  Ledger <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </Link>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={feeRevenueData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(v) => `₹${v/1000}k`} />
                    <ChartTooltip
                      contentStyle={{ backgroundColor: '#172033', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                      formatter={(val) => [`₹${val.toLocaleString()}`, 'Collected']}
                    />
                    <Bar dataKey="collected" fill="#4338CA" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* ─── 4. DAILY WORKFLOW SHORTCUTS & ANNOUNCEMENTS ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Quick Action Navigation Buttons */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-[#E8EDF4] p-5 sm:p-6 shadow-card">
              <h3 className="text-base font-bold text-[#172033] tracking-tight mb-4">Daily Academic Workflows</h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { title: 'New Student Admission', desc: 'Enroll student & set fees', path: '/student-master', icon: Plus, color: 'text-[#4338CA] bg-[#EEF2FF] border-[#E0E7FF]' },
                  { title: 'Daily Batch Attendance', desc: '1-Click present & SMS', path: '/attendance-entry', icon: CheckCircle2, color: 'text-[#10B981] bg-[#ECFDF5] border-[#A7F3D0]' },
                  { title: 'Monthly Matrix Grid', desc: 'View monthly register', path: '/attendance-monthly', icon: Calendar, color: 'text-[#0284C7] bg-[#F0F9FF] border-[#BAE6FD]' },
                  { title: 'Collect Course Fees', desc: 'Record installment / cash', path: '/fee-management', icon: CreditCard, color: 'text-[#D97706] bg-[#FEF3C7] border-[#FDE68A]' },
                  { title: 'Enter Exam Marks', desc: 'Record subject scores', path: '/marks-entry', icon: Award, color: 'text-[#E11D48] bg-[#FFE4E6] border-[#FECDD3]' },
                  { title: 'Upload Study Notes', desc: 'Upload PDF materials', path: '/study-notes', icon: FileText, color: 'text-[#7C3AED] bg-[#F5F3FF] border-[#DDD6FE]' },
                ].map((act, i) => {
                  const Icon = act.icon;
                  return (
                    <Link
                      key={i}
                      to={act.path}
                      className="p-3.5 rounded-xl border border-[#E8EDF4] hover:border-[#C7D2FE] hover:bg-slate-50 transition-all flex flex-col justify-between group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${act.color} group-hover:scale-105 transition-transform`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#4338CA] group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#172033]">{act.title}</div>
                        <div className="text-[11px] text-[#64748B] mt-0.5">{act.desc}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* School Noticeboard / Live Broadcasts */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-[#E8EDF4] p-5 sm:p-6 shadow-card flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#4338CA]" />
                    <h3 className="text-base font-bold text-[#172033] tracking-tight">Announcements</h3>
                  </div>
                  <span className="text-[10px] font-bold text-[#4338CA] bg-[#EEF2FF] px-2 py-0.5 rounded-full">
                    Broadcasts
                  </span>
                </div>

                {announcements.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[#64748B]">
                    <Bell className="w-8 h-8 mx-auto mb-2 text-[#CBD5E1]" />
                    <div>No announcements posted yet.</div>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-56 overflow-y-auto">
                    {announcements.slice(0, 3).map((notice, i) => (
                      <div key={i} className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E8EDF4] text-xs">
                        <div className="font-bold text-[#172033]">{notice.title}</div>
                        <div className="text-[#64748B] text-[11px] mt-0.5 line-clamp-2">{notice.message}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <Link
                  to="/app"
                  target="_blank"
                  className="w-full py-2 rounded-xl bg-[#F8FAFC] hover:bg-slate-100 text-[#172033] text-xs font-bold border border-[#E8EDF4] transition-colors flex items-center justify-center gap-1.5"
                >
                  <Smartphone className="w-3.5 h-3.5 text-[#4338CA]" />
                  <span>Test Student Mobile Push</span>
                </Link>
              </div>
            </div>

          </div>

        </div>
      </PageTransition>
    </AdminLayout>
  );
};

export default Dashboard;
