import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Button, TextField,
  MenuItem, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Tooltip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Snackbar, Alert
} from '@mui/material';
import {
  Video, Play, Square, Users, Calendar, Clock, Plus, ExternalLink, RefreshCw, Radio
} from 'lucide-react';
import AdminLayout from '../Common/AdminLayout';
import api from '../../api';

const LiveClassStudio = () => {
  const [liveClasses, setLiveClasses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [activeSession, setActiveSession] = useState(null); // Embedded Jitsi session
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const [formData, setFormData] = useState({
    title: '',
    subject: 'Physics',
    batchId: '',
    courseId: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    startTime: '19:00',
    durationMinutes: 60,
    provider: 'jitsi',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classRes, batchRes, courseRes] = await Promise.all([
        api.get('/live-classes'),
        api.get('/batches'),
        api.get('/courses'),
      ]);
      setLiveClasses(classRes.data.data || []);
      setBatches(batchRes.data.data || []);
      setCourses(courseRes.data.data || []);
    } catch (err) {
      setToast({ open: true, message: 'Failed to load live classes', severity: 'error' });
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
      const res = await api.post('/live-classes', formData);
      if (res.data.success) {
        setToast({ open: true, message: 'Live class session scheduled successfully!', severity: 'success' });
        setOpenModal(false);
        setFormData({
          title: '',
          subject: 'Physics',
          batchId: '',
          courseId: '',
          scheduledDate: new Date().toISOString().split('T')[0],
          startTime: '19:00',
          durationMinutes: 60,
          provider: 'jitsi',
        });
        fetchData();
      }
    } catch (err) {
      setToast({ open: true, message: 'Failed to schedule live class', severity: 'error' });
    }
  };

  const handleToggleLive = async (id, currentStatus) => {
    try {
      const newLiveState = !currentStatus;
      const res = await api.patch(`/live-classes/${id}/toggle-live`, { isLive: newLiveState });
      if (res.data.success) {
        setToast({
          open: true,
          message: newLiveState ? '🔴 Studio is now BROADCASTING LIVE!' : 'Session ended and archived.',
          severity: newLiveState ? 'error' : 'info'
        });
        fetchData();
      }
    } catch (err) {
      setToast({ open: true, message: 'Error toggling live state', severity: 'error' });
    }
  };

  return (
    <AdminLayout>
      {/* Header Hero Banner */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50/60 to-white border border-blue-100 rounded-3xl p-6 mb-6 text-slate-900 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-slate-900">Live Video Class Studio</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 uppercase tracking-wider animate-pulse flex items-center gap-1 border border-rose-200">
                <Radio className="w-3 h-3 text-rose-600" /> Jitsi HD
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Host interactive online classes, auto-track attendance duration, and broadcast to student mobile devices
            </p>
          </div>
        </div>

          <div className="flex gap-2">
            <button
              onClick={fetchData}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <button
              onClick={() => setOpenModal(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-lg shadow-blue-500/30 flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" /> Schedule New Session
            </button>
          </div>
        </div>

        {/* Embedded Jitsi Player Modal or Panel */}
        {activeSession && (
          <div className="bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 mb-6">
            <div className="p-3 bg-slate-900 flex items-center justify-between text-white border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                <span className="text-xs font-black">{activeSession.title}</span>
                <span className="text-[11px] text-slate-400">({activeSession.subject})</span>
              </div>
              <button
                onClick={() => setActiveSession(null)}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors"
              >
                Close Studio View
              </button>
            </div>
            <div className="w-full h-[540px]">
              <iframe
                src={`https://meet.jit.si/${activeSession.meetingRoomId}#config.startWithAudioMuted=false&config.prejoinPageEnabled=false`}
                title="Live Jitsi Session"
                className="w-full h-full border-none"
                allow="camera; microphone; fullscreen; display-capture; autoplay"
              />
            </div>
          </div>
        )}

        {/* Sessions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {liveClasses.map((item) => {
            const isLiveNow = item.isLive;
            return (
              <div
                key={item._id}
                className={`bg-white rounded-2xl p-5 border transition-all ${
                  isLiveNow ? 'border-rose-300 ring-2 ring-rose-500/20 shadow-lg' : 'border-slate-200 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                      {item.subject}
                    </span>
                    <h3 className="text-sm font-black text-slate-800 mt-1.5 line-clamp-1">{item.title}</h3>
                  </div>
                  {isLiveNow ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-100 text-rose-700 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-rose-600"></span> LIVE
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {item.status}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-slate-500 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.scheduledDate} at {item.startTime} ({item.durationMinutes} mins)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Batch: <b>{item.batchId?.batchName || 'General'}</b></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Teacher: {item.teacherName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleToggleLive(item._id, item.isLive)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                      isLiveNow
                        ? 'bg-slate-800 hover:bg-slate-900 text-white'
                        : 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20'
                    }`}
                  >
                    {isLiveNow ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    {isLiveNow ? 'End Stream' : 'Go Live Now'}
                  </button>

                  <button
                    onClick={() => setActiveSession(item)}
                    className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                    title="Open Jitsi Studio Screen"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Schedule Dialog */}
        <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 800, bgcolor: '#0f172a', color: '#fff' }}>
            Schedule New Live Video Class
          </DialogTitle>
          <form onSubmit={handleCreate}>
            <DialogContent sx={{ p: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Class Session Title"
                    required
                    fullWidth
                    size="small"
                    placeholder="e.g. Kinematics Chapter 03 Problems Discussion"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Subject"
                    required
                    fullWidth
                    size="small"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Target Batch"
                    required
                    fullWidth
                    size="small"
                    value={formData.batchId}
                    onChange={(e) => {
                      const b = batches.find(x => x._id === e.target.value);
                      setFormData({
                        ...formData,
                        batchId: e.target.value,
                        courseId: b?.courseId?._id || b?.courseId || ''
                      });
                    }}
                  >
                    {batches.map((b) => (
                      <MenuItem key={b._id} value={b._id}>{b.batchName}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    type="date"
                    label="Scheduled Date"
                    required
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    type="time"
                    label="Start Time"
                    required
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2.5, bgcolor: '#f8fafc' }}>
              <Button onClick={() => setOpenModal(false)} sx={{ fontWeight: 700 }}>Cancel</Button>
              <Button type="submit" variant="contained" sx={{ fontWeight: 800, bgcolor: '#2563eb' }}>
                Schedule Live Class
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

export default LiveClassStudio;
