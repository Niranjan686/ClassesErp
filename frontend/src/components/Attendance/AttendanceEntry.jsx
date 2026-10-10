import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarCheck, Check, X as CloseIcon, Clock, Save,
  RefreshCw, Send, CheckCircle2, UserCheck, AlertCircle,
  Users, Smartphone, Calendar, Layers, ShieldCheck
} from 'lucide-react';
import AdminLayout from '../Common/AdminLayout';
import { PageTransition, StaggerContainer, StaggerItem, SuccessModal, triggerAcademicConfetti } from '../Common/MotionWrapper';
import { ClassTechLoader } from '../Common/ClassTechLoader';
import { EmptyStateIllustration } from '../Common/EducationalSVGs';
import api from '../../api';

const AttendanceEntry = () => {
  const location = useLocation();

  // State
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [roster, setRoster] = useState([]);
  const [batchDetails, setBatchDetails] = useState(null);
  const [isAlreadyMarked, setIsAlreadyMarked] = useState(false);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [saving, setSaving] = useState(false);

  // Success Modal State
  const [successModal, setSuccessModal] = useState({ open: false, title: '', message: '' });
  const [toast, setToast] = useState({ open: false, message: '', type: 'success' });

  // 1. Fetch Batches on mount
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const res = await api.get('/batches/active');
        const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setBatches(list);

        const searchParams = new URLSearchParams(location.search);
        const queryBatchId = searchParams.get('batchId');

        if (queryBatchId && list.some((b) => b._id === queryBatchId)) {
          setSelectedBatchId(queryBatchId);
        } else if (list.length > 0) {
          setSelectedBatchId(list[0]._id);
        }
      } catch (err) {
        setToast({ open: true, message: 'Failed to load active classroom batches', type: 'error' });
      }
    };
    fetchBatches();
  }, [location.search]);

  // 2. Fetch Batch Roster
  const fetchRoster = async () => {
    if (!selectedBatchId) return;
    try {
      setLoadingRoster(true);
      const res = await api.get(`/attendance/batch-roster?batchId=${selectedBatchId}&date=${attendanceDate}`);
      setBatchDetails(res.data.batch);
      setIsAlreadyMarked(res.data.isAlreadyMarked);
      setRoster(res.data.roster || []);
    } catch (err) {
      setToast({ open: true, message: 'Failed to load batch student roster', type: 'error' });
    } finally {
      setLoadingRoster(false);
    }
  };

  useEffect(() => {
    if (selectedBatchId) {
      fetchRoster();
    }
  }, [selectedBatchId, attendanceDate]);

  // Handle Individual Status Toggle
  const handleStatusChange = (studentId, newStatus) => {
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setRoster((prev) =>
      prev.map((item) => {
        if (item.studentId === studentId) {
          return {
            ...item,
            status: newStatus,
            inTime: (newStatus === 'Present' || newStatus === 'Late') && !item.inTime ? nowTime : item.inTime,
          };
        }
        return item;
      })
    );
  };

  // Mark All Present (1-Click)
  const handleMarkAll = (statusToSet) => {
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setRoster((prev) =>
      prev.map((item) => ({
        ...item,
        status: statusToSet,
        inTime: (statusToSet === 'Present' || statusToSet === 'Late') ? nowTime : item.inTime,
      }))
    );
  };

  // Save Attendance & Dispatch Live Push / SMS
  const handleSaveAttendance = async () => {
    if (!selectedBatchId || roster.length === 0) return;
    setSaving(true);

    try {
      const records = roster.map((r) => ({
        studentId: r.studentId,
        status: r.status,
        inTime: r.inTime || '',
        remark: r.remark || '',
      }));

      const payload = {
        batchId: selectedBatchId,
        date: attendanceDate,
        records,
      };

      const res = await api.post('/attendance/mark-batch', payload);

      if (res.data.success) {
        setIsAlreadyMarked(true);
        triggerAcademicConfetti();
        setSuccessModal({
          open: true,
          title: 'Batch Attendance Recorded!',
          message: `Attendance for ${roster.length} students synchronized successfully. Instant push alerts sent to student app.`
        });
      }
    } catch (err) {
      setToast({ open: true, message: err.response?.data?.message || 'Failed to save attendance', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Metrics
  const presentCount = roster.filter((r) => r.status === 'Present').length;
  const absentCount = roster.filter((r) => r.status === 'Absent').length;
  const lateCount = roster.filter((r) => r.status === 'Late').length;
  const totalCount = roster.length;
  const presentPct = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  return (
    <AdminLayout>
      <PageTransition>
        <div className="space-y-6">
          
          {/* Header Card */}
          <div className="bg-white rounded-2xl border border-[#E8EDF4] p-5 sm:p-6 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] border border-[#E0E7FF] flex items-center justify-center text-[#4338CA] shadow-sm">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-[#172033] tracking-tight font-display">
                    Daily Batch Attendance Register
                  </h1>
                  {isAlreadyMarked && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ECFDF5] text-[#10B981] border border-[#A7F3D0]">
                      Marked
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Record classroom attendance, track time-in, and auto-dispatch instant notifications.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <button
                onClick={fetchRoster}
                disabled={loadingRoster}
                className="p-2.5 rounded-xl bg-[#F8FAFC] hover:bg-slate-100 text-[#64748B] border border-[#E8EDF4] text-xs font-bold transition-all"
                title="Reload Roster"
              >
                <RefreshCw className={`w-4 h-4 ${loadingRoster ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleSaveAttendance}
                disabled={saving || roster.length === 0}
                className="flex-1 md:flex-none px-5 py-2.5 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] active:scale-[0.99] text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save & Sync Register'}</span>
              </button>
            </div>
          </div>

          {/* Batch Selector & Attendance Summary Bar */}
          <div className="bg-white rounded-2xl border border-[#E8EDF4] p-5 shadow-card space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              
              {/* Select Batch */}
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1.5">Classroom Batch</label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E8EDF4] rounded-xl text-xs font-semibold text-[#172033] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-[#4338CA]"
                >
                  {batches.length === 0 ? (
                    <option value="">No active batches found</option>
                  ) : (
                    batches.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.batchName} ({b.courseId?.courseName || 'Course'})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Attendance Date */}
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1.5">Attendance Date</label>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E8EDF4] rounded-xl text-xs font-semibold text-[#172033] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-[#4338CA]"
                />
              </div>

              {/* Quick 1-Click "Mark All" Controls */}
              <div className="lg:col-span-2 flex items-end gap-2">
                <button
                  onClick={() => handleMarkAll('Present')}
                  disabled={roster.length === 0}
                  className="flex-1 py-2.5 rounded-xl bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#10B981] border border-[#A7F3D0] text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" /> Mark All Present
                </button>
                <button
                  onClick={() => handleMarkAll('Absent')}
                  disabled={roster.length === 0}
                  className="flex-1 py-2.5 rounded-xl bg-[#FFF1F2] hover:bg-[#FFE4E6] text-[#E11D48] border border-[#FECDD3] text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <CloseIcon className="w-3.5 h-3.5" /> Mark All Absent
                </button>
              </div>

            </div>

            {/* Live Counter Badges */}
            {roster.length > 0 && (
              <div className="pt-3 border-t border-[#E8EDF4] grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E8EDF4]">
                  <div className="text-[11px] font-bold text-[#64748B]">Total Enrolled</div>
                  <div className="text-xl font-black text-[#172033] mt-0.5">{totalCount}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0]">
                  <div className="text-[11px] font-bold text-[#10B981]">Present ({presentPct}%)</div>
                  <div className="text-xl font-black text-[#10B981] mt-0.5">{presentCount}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FFF1F2] border border-[#FECDD3]">
                  <div className="text-[11px] font-bold text-[#E11D48]">Absent</div>
                  <div className="text-xl font-black text-[#E11D48] mt-0.5">{absentCount}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FFFBEB] border border-[#FDE68A]">
                  <div className="text-[11px] font-bold text-[#D97706]">Late</div>
                  <div className="text-xl font-black text-[#D97706] mt-0.5">{lateCount}</div>
                </div>
              </div>
            )}
          </div>

          {/* Student Roster Table */}
          {loadingRoster ? (
            <ClassTechLoader message="Loading Batch Roster..." />
          ) : roster.length === 0 ? (
            <EmptyStateIllustration
              title="No students found in this batch"
              description="Enroll students into this batch via Student Master or select another batch."
            />
          ) : (
            <div className="bg-white rounded-2xl border border-[#E8EDF4] shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] border-b border-[#E8EDF4] text-[#64748B] font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Roll / GR</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">Parent Mobile</th>
                      <th className="py-3 px-4 text-center">Attendance Status</th>
                      <th className="py-3 px-4 text-center">In-Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8EDF4]">
                    {roster.map((st) => {
                      const isPresent = st.status === 'Present';
                      const isAbsent = st.status === 'Absent';
                      const isLate = st.status === 'Late';

                      return (
                        <tr key={st.studentId} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-[#64748B]">
                            #{st.rollno || st.grno || '—'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-[#172033]">{st.name}</div>
                            <div className="text-[10px] text-[#64748B]">{st.email || 'Student Account'}</div>
                          </td>
                          <td className="py-3 px-4 font-mono text-[#64748B]">
                            {st.parentMobile || st.mobileNo || '—'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-1.5">
                              
                              {/* Present Pill */}
                              <button
                                onClick={() => handleStatusChange(st.studentId, 'Present')}
                                className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 ${
                                  isPresent
                                    ? 'bg-[#10B981] text-white shadow-sm'
                                    : 'bg-[#F8FAFC] text-[#64748B] hover:bg-[#ECFDF5] hover:text-[#10B981] border border-[#E8EDF4]'
                                }`}
                              >
                                <Check className="w-3.5 h-3.5" /> Present
                              </button>

                              {/* Absent Pill */}
                              <button
                                onClick={() => handleStatusChange(st.studentId, 'Absent')}
                                className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 ${
                                  isAbsent
                                    ? 'bg-[#E11D48] text-white shadow-sm'
                                    : 'bg-[#F8FAFC] text-[#64748B] hover:bg-[#FFF1F2] hover:text-[#E11D48] border border-[#E8EDF4]'
                                }`}
                              >
                                <CloseIcon className="w-3.5 h-3.5" /> Absent
                              </button>

                              {/* Late Pill */}
                              <button
                                onClick={() => handleStatusChange(st.studentId, 'Late')}
                                className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 ${
                                  isLate
                                    ? 'bg-[#F59E0B] text-white shadow-sm'
                                    : 'bg-[#F8FAFC] text-[#64748B] hover:bg-[#FFFBEB] hover:text-[#F59E0B] border border-[#E8EDF4]'
                                }`}
                              >
                                <Clock className="w-3.5 h-3.5" /> Late
                              </button>

                            </div>
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-xs font-semibold text-[#64748B]">
                            {st.inTime || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </PageTransition>

      {/* Success Celebration Modal */}
      <SuccessModal
        isOpen={successModal.open}
        title={successModal.title}
        message={successModal.message}
        onClose={() => setSuccessModal({ open: false, title: '', message: '' })}
      />

    </AdminLayout>
  );
};

export default AttendanceEntry;
