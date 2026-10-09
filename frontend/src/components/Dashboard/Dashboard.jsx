import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  CircularProgress, Alert, Avatar, Tooltip, IconButton, TextField, Snackbar
} from '@mui/material';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip as ChartTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import {
  GraduationCap, School, BookOpen, Layers, Users, CreditCard, Calendar,
  TrendingUp, Radio, ArrowUpRight, Sparkles, Bell, Clock, RefreshCw, Award, Plus,
  ShieldCheck, CheckCircle2
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import AdminLayout from '../Common/AdminLayout';
import api from '../../api';

const DONUT_COLORS = ['#2563eb', '#10b981', '#8b5cf6', '#f59e0b'];

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

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
  const newLeads = stats?.kpis?.newLeadsCount ?? 0;

  // Dynamic role distribution for Donut Chart
  const roleDistributionData = [
    { name: 'Enrolled Students', value: studentsCount || 1, color: '#2563eb' },
    { name: 'Faculty & Teachers', value: staffCount || 1, color: '#10b981' },
    { name: 'Classroom Batches', value: batchesCount || 1, color: '#8b5cf6' },
    { name: 'New Inquiries', value: newLeads || 1, color: '#f59e0b' }
  ];

  return (
    <AdminLayout>
      {/* Education Hero Welcome Banner (Clean Light Gradient Theme) */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50/70 to-slate-50 border border-blue-100 rounded-3xl p-6 sm:p-8 mb-8 text-slate-900 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            <GraduationCap className="w-9 h-9" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">ClassTech Admin Dashboard</h1>
              <span className="px-3 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                Live Operations
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Real-time overview of student admissions, classroom batch schedules, fee collections, and attendance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 relative z-10">
          <button
            onClick={fetchStats}
            className="p-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-all shadow-sm"
            title="Refresh Stats"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/student-master"
            className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Enroll New Student
          </Link>
        </div>
      </div>

      {/* 4 Prominent KPI Cards with Clean White Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        
        {/* 1. TOTAL STUDENTS */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">Total Enrolled Students</span>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <GraduationCap className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 mt-1">
              {studentsCount}
            </h3>
          </div>
          <Link
            to="/students"
            className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600 hover:text-blue-800"
          >
            <span>Manage Student Roster</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 2. ACTIVE BATCHES & TIMETABLE */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">Running Batches</span>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Layers className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 mt-1">
              {batchesCount}
            </h3>
          </div>
          <Link
            to="/batch-master"
            className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-600 hover:text-purple-800"
          >
            <span>View Batch Timetable</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 3. TOTAL REVENUE COLLECTED */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">Fees Collected</span>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CreditCard className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-3xl sm:text-4xl font-black text-emerald-600 mt-1">
              ₹ {revenueCollected.toLocaleString()}
            </h3>
          </div>
          <Link
            to="/fee-management"
            className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700 hover:text-emerald-900"
          >
            <span>₹ {pendingDues.toLocaleString()} Pending Dues</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 4. TODAY'S ATTENDANCE % */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">Today Attendance</span>
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-3xl sm:text-4xl font-black text-teal-700 mt-1">
              {attendancePct}%
            </h3>
          </div>
          <Link
            to="/attendance-entry"
            className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-700 hover:text-teal-900"
          >
            <span>Daily RFID & QR Matrix</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Middle Row: Donut Chart + Notice Board */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        
        {/* Institute Distribution Chart */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-black text-slate-900">Institute Distribution Breakdown</h3>
              <p className="text-xs text-slate-400">Live composition of students, faculty, and batches</p>
            </div>
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700">Live Metric</span>
          </div>

          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {roleDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pinned Announcements Board */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-black text-slate-900">Institute Notice Board</h3>
            </div>
            <span className="text-xs font-bold text-slate-400">{announcements.length} Notices</span>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {announcements.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No active notices published yet.
              </div>
            ) : (
              announcements.map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="text-xs font-black text-slate-900">{item.title}</h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-100 text-blue-700">
                      {item.category || 'General'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{item.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Payments & Recent Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Fee Transactions */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-black text-slate-900">Recent Fee Receipts</h3>
            <Link to="/fee-management" className="text-xs font-bold text-blue-600 hover:underline">
              View All Ledger →
            </Link>
          </div>

          <div className="space-y-2.5">
            {(stats?.recentPayments || []).length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No fee transactions recorded yet.
              </div>
            ) : (
              (stats?.recentPayments || []).map((tx) => (
                <div key={tx._id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div>
                    <div className="text-xs font-black text-slate-900">{tx.studentName}</div>
                    <div className="text-[11px] font-mono text-slate-400">{tx.receiptNo} • {tx.paymentMode}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-emerald-600">₹ {tx.amountPaid?.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-400">{tx.paymentDate}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Leads / Inquiries */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-black text-slate-900">Recent Admission Inquiries</h3>
            <Link to="/enquiries" className="text-xs font-bold text-blue-600 hover:underline">
              View Pipeline →
            </Link>
          </div>

          <div className="space-y-2.5">
            {(stats?.recentLeads || []).length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No admission inquiries recorded yet.
              </div>
            ) : (
              (stats?.recentLeads || []).map((lead) => (
                <div key={lead._id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div>
                    <div className="text-xs font-black text-slate-900">{lead.candidateName}</div>
                    <div className="text-[11px] text-slate-400">{lead.mobileNo} • {lead.courseName}</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800">
                    {lead.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
