import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Button, TextField,
  MenuItem, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Tooltip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Snackbar, Alert, Rating
} from '@mui/material';
import {
  Calendar, Clock, User, Phone, CheckCircle2, XCircle, Plus, Star, Video, MessageSquare
} from 'lucide-react';
import AdminLayout from '../Common/AdminLayout';
import api from '../../api';

const DemoScheduler = () => {
  const [demos, setDemos] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [outcomeModal, setOutcomeModal] = useState(null);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const [formData, setFormData] = useState({
    studentName: '',
    phone: '',
    email: '',
    courseId: '',
    courseName: '',
    batchId: '',
    teacherName: 'Dr. Vivek Sharma',
    demoDate: new Date().toISOString().split('T')[0],
    demoTime: '09:00 AM',
    mode: 'offline',
    counsellorNotes: '',
  });

  const [outcomeData, setOutcomeData] = useState({
    status: 'Attended',
    rating: 5,
    feedback: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [demoRes, courseRes, batchRes] = await Promise.all([
        api.get('/demos'),
        api.get('/courses'),
        api.get('/batches'),
      ]);
      setDemos(demoRes.data.data || []);
      setCourses(courseRes.data.data || []);
      setBatches(batchRes.data.data || []);
    } catch (err) {
      setToast({ open: true, message: 'Failed to load demo schedule', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/demos', formData);
      if (res.data.success) {
        setToast({ open: true, message: 'Demo class slot booked successfully!', severity: 'success' });
        setOpenModal(false);
        fetchData();
      }
    } catch (err) {
      setToast({ open: true, message: err.response?.data?.message || 'Failed to book demo', severity: 'error' });
    }
  };

  const handleSaveOutcome = async (e) => {
    e.preventDefault();
    if (!outcomeModal) return;
    try {
      const res = await api.patch(`/demos/${outcomeModal._id}/outcome`, outcomeData);
      if (res.data.success) {
        setToast({ open: true, message: 'Demo outcome and feedback recorded!', severity: 'success' });
        setOutcomeModal(null);
        fetchData();
      }
    } catch (err) {
      setToast({ open: true, message: 'Failed to save outcome', severity: 'error' });
    }
  };

  return (
    <AdminLayout>
      {/* Header Hero Banner */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50/60 to-white border border-blue-100 rounded-3xl p-6 mb-6 text-slate-900 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900">Demo Lecture Scheduler & Outcome Tracker</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Book demo class sessions for prospective leads, prevent teacher double-booking, and log ratings
            </p>
          </div>
        </div>

        <button
          onClick={() => setOpenModal(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" /> Book New Demo Slot
        </button>
      </div>

        {/* Demo Classes Table */}
        <Paper sx={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, fontSize: '11px', color: '#64748b' }}>PROSPECT / CANDIDATE</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '11px', color: '#64748b' }}>TARGET COURSE</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '11px', color: '#64748b' }}>SLOT & TIMING</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '11px', color: '#64748b' }}>ASSIGNED FACULTY</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '11px', color: '#64748b' }}>MODE</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '11px', color: '#64748b' }}>STATUS</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '11px', color: '#64748b' }} align="right">ACTION</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {demos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                      No demo lectures scheduled yet. Click "Book New Demo Slot" to schedule one.
                    </TableCell>
                  </TableRow>
                ) : (
                  demos.map((d) => (
                    <TableRow key={d._id} hover>
                      <TableCell>
                        <div className="font-bold text-slate-800 text-xs">{d.studentName}</div>
                        <div className="text-[11px] text-slate-400">{d.phone}</div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-semibold text-indigo-600">{d.courseName || d.courseId?.courseName || 'General'}</span>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-bold text-slate-700">{d.demoDate}</div>
                        <div className="text-[11px] text-slate-400">{d.demoTime}</div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-medium text-slate-700">{d.teacherName}</span>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={d.mode === 'online' ? '🌐 Online (Jitsi)' : '🏫 Offline Campus'}
                          size="small"
                          sx={{ fontSize: '10px', fontWeight: 800 }}
                        />
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          d.status === 'Attended' ? 'bg-emerald-100 text-emerald-800' :
                          d.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                          d.status === 'No-Show' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {d.status}
                        </span>
                      </TableCell>
                      <TableCell align="right">
                        <button
                          onClick={() => {
                            setOutcomeModal(d);
                            setOutcomeData({
                              status: d.status || 'Attended',
                              rating: d.rating || 5,
                              feedback: d.feedback || '',
                            });
                          }}
                          className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-bold transition-colors"
                        >
                          Mark Outcome →
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Book Demo Modal */}
        <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 800, bgcolor: '#0f172a', color: '#fff' }}>
            Book Prospect Demo Lecture Slot
          </DialogTitle>
          <form onSubmit={handleCreate}>
            <DialogContent sx={{ p: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Candidate Name"
                    required
                    fullWidth
                    size="small"
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Mobile Phone"
                    required
                    fullWidth
                    size="small"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    select
                    label="Target Course"
                    required
                    fullWidth
                    size="small"
                    value={formData.courseId}
                    onChange={(e) => {
                      const c = courses.find(x => x._id === e.target.value);
                      setFormData({
                        ...formData,
                        courseId: e.target.value,
                        courseName: c?.courseName || '',
                      });
                    }}
                  >
                    {courses.map((c) => (
                      <MenuItem key={c._id} value={c._id}>{c.courseName}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    type="date"
                    label="Demo Date"
                    required
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    value={formData.demoDate}
                    onChange={(e) => setFormData({ ...formData, demoDate: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Demo Time Slot"
                    required
                    fullWidth
                    size="small"
                    value={formData.demoTime}
                    onChange={(e) => setFormData({ ...formData, demoTime: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Assigned Faculty"
                    required
                    fullWidth
                    size="small"
                    value={formData.teacherName}
                    onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Mode"
                    fullWidth
                    size="small"
                    value={formData.mode}
                    onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                  >
                    <option value="offline">Offline Campus</option>
                    <option value="online">Online Live (Jitsi)</option>
                  </TextField>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2.5, bgcolor: '#f8fafc' }}>
              <Button onClick={() => setOpenModal(false)} sx={{ fontWeight: 700 }}>Cancel</Button>
              <Button type="submit" variant="contained" sx={{ fontWeight: 800, bgcolor: '#2563eb' }}>
                Confirm Demo Booking
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Outcome Modal */}
        <Dialog open={!!outcomeModal} onClose={() => setOutcomeModal(null)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 800, bgcolor: '#0f172a', color: '#fff' }}>
            Record Demo Outcome & Feedback
          </DialogTitle>
          <form onSubmit={handleSaveOutcome}>
            <DialogContent sx={{ p: 3 }}>
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-700 mb-1">Attendance Outcome</label>
                <select
                  value={outcomeData.status}
                  onChange={(e) => setOutcomeData({ ...outcomeData, status: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800"
                >
                  <option value="Attended">Attended (Positive)</option>
                  <option value="No-Show">No-Show (Missed)</option>
                  <option value="Rescheduled">Rescheduled</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-700 mb-1">Candidate Interest Rating</label>
                <Rating
                  value={outcomeData.rating}
                  onChange={(_, val) => setOutcomeData({ ...outcomeData, rating: val })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Feedback & Next Steps</label>
                <textarea
                  rows="3"
                  value={outcomeData.feedback}
                  onChange={(e) => setOutcomeData({ ...outcomeData, feedback: e.target.value })}
                  placeholder="Candidate response during demo lecture..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800"
                ></textarea>
              </div>
            </DialogContent>
            <DialogActions sx={{ p: 2, bgcolor: '#f8fafc' }}>
              <Button onClick={() => setOutcomeModal(null)} sx={{ fontWeight: 700 }}>Cancel</Button>
              <Button type="submit" variant="contained" sx={{ fontWeight: 800, bgcolor: '#16a34a' }}>
                Save Outcome
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Toast */}
        <Snackbar
          open={toast.open}
          autoHideDuration={4000}
          onClose={() => setToast({ ...toast, open: false })}
        >
          <Alert severity={toast.severity} onClose={() => setToast({ ...toast, open: false })}>
            {toast.message}
          </Alert>
        </Snackbar>
    </AdminLayout>
  );
};

export default DemoScheduler;
