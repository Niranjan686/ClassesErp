import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, MenuItem, Dialog, DialogTitle, DialogContent,
  DialogActions, Chip, IconButton, Alert, Snackbar, Grid, CircularProgress, Tabs, Tab
} from '@mui/material';
import { Plus, Trash2, Calendar, Clock, MapPin, UserCheck, AlertTriangle, ShieldCheck } from 'lucide-react';
import AdminLayout from '../Common/AdminLayout';
import { PageTransition } from '../Common/MotionWrapper';
import api from '../../api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TimetableManagement = () => {
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeDayTab, setActiveDayTab] = useState(0);

  // Dialogs
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openSubDialog, setOpenSubDialog] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [conflictWarning, setConflictWarning] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    day: 'Monday',
    periodNumber: 1,
    periodName: 'Period 1',
    startTime: '09:00',
    endTime: '10:00',
    subject: '',
    teacherName: '',
    roomNo: 'Room 101',
    isBreak: false,
    forceBypassConflicts: false
  });

  const [subFormData, setSubFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    substituteTeacherName: '',
    reason: 'Medical Leave'
  });

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const res = await api.get('/batches/active');
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setBatches(list);
      if (list.length > 0) {
        setSelectedBatchId(list[0]._id);
      }
    } catch (err) {
      setToast({ open: true, message: 'Failed to load batches', severity: 'error' });
    }
  };

  useEffect(() => {
    if (selectedBatchId) {
      fetchTimetable(selectedBatchId);
    }
  }, [selectedBatchId]);

  const fetchTimetable = async (batchId) => {
    try {
      setLoading(true);
      const res = await api.get(`/timetable/batch/${batchId}`);
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setPeriods(list);
    } catch (err) {
      setToast({ open: true, message: 'Failed to load batch timetable', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePeriod = async (e) => {
    e.preventDefault();
    setConflictWarning('');
    try {
      const payload = {
        ...formData,
        batchId: selectedBatchId,
        periodNumber: Number(formData.periodNumber)
      };
      const res = await api.post('/timetable', payload);
      setToast({ open: true, message: res.data?.message || 'Period scheduled successfully!', severity: 'success' });
      setOpenAddDialog(false);
      fetchTimetable(selectedBatchId);
    } catch (err) {
      if (err.response?.data?.conflicts) {
        setConflictWarning(err.response.data.conflicts.join('\n'));
      } else {
        setToast({ open: true, message: err.response?.data?.message || 'Error saving period', severity: 'error' });
      }
    }
  };

  const handleDeletePeriod = async (id) => {
    if (!window.confirm('Are you sure you want to delete this scheduled period?')) return;
    try {
      await api.delete(`/timetable/${id}`);
      setToast({ open: true, message: 'Period removed from schedule', severity: 'success' });
      fetchTimetable(selectedBatchId);
    } catch (err) {
      setToast({ open: true, message: 'Failed to delete period', severity: 'error' });
    }
  };

  const handleAssignSubstitute = async (e) => {
    e.preventDefault();
    if (!selectedPeriod) return;
    try {
      await api.post(`/timetable/${selectedPeriod._id}/substitute`, subFormData);
      setToast({ open: true, message: 'Substitute faculty assigned!', severity: 'success' });
      setOpenSubDialog(false);
      fetchTimetable(selectedBatchId);
    } catch (err) {
      setToast({ open: true, message: err.response?.data?.message || 'Failed to assign substitute', severity: 'error' });
    }
  };

  const currentDay = DAYS[activeDayTab];
  const dayPeriods = periods.filter(p => p.day === currentDay).sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

  return (
    <AdminLayout>
      <PageTransition>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h5" fontWeight="900" color="#0f172a" className="font-display">
              Timetable & Substitute Management
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Schedule batch periods with automated teacher, room & batch collision prevention
            </Typography>
          </Box>
          <Box display="flex" gap={1.5} alignItems="center">
            <TextField
              select
              size="small"
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              sx={{ minWidth: 200, bgcolor: '#ffffff' }}
              label="Select Batch"
            >
              {batches.map(b => (
                <MenuItem key={b._id} value={b._id}>{b.batchName} ({b.courseId?.courseName || 'Course'})</MenuItem>
              ))}
            </TextField>
            <Button
              variant="contained"
              startIcon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setConflictWarning('');
                setFormData(prev => ({ ...prev, day: currentDay }));
                setOpenAddDialog(true);
              }}
              sx={{ bgcolor: '#4338CA', '&:hover': { bgcolor: '#3730A3' }, fontWeight: 700, textTransform: 'none', borderRadius: '10px' }}
            >
              Add Period
            </Button>
          </Box>
        </Box>

        <Paper sx={{ mb: 3, borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <Tabs
            value={activeDayTab}
            onChange={(e, val) => setActiveDayTab(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ '& .MuiTab-root': { fontWeight: 800, textTransform: 'none', py: 1.5 }, '& .Mui-selected': { color: '#4338CA' } }}
          >
            {DAYS.map((d, i) => (
              <Tab key={d} label={d} />
            ))}
          </Tabs>
        </Paper>

        {loading ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress sx={{ color: '#4338CA' }} />
          </Box>
        ) : (
          <Paper sx={{ borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, color: '#334155' }}>Timing</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#334155' }}>Subject</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#334155' }}>Assigned Faculty</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#334155' }}>Room / Venue</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#334155' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#334155', textAlign: 'right' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dayPeriods.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: 'center', py: 5, color: '#64748B' }}>
                        No periods scheduled for {currentDay}. Click "Add Period" to create slots.
                      </TableCell>
                    </TableRow>
                  ) : (
                    dayPeriods.map((p) => (
                      <TableRow key={p._id} hover>
                        <TableCell sx={{ fontWeight: 700 }}>
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <Clock className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{p.startTime} - {p.endTime}</span>
                          </div>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, color: '#0F172A' }}>{p.subject}</TableCell>
                        <TableCell>
                          <div>
                            <span className="font-semibold text-slate-800">{p.effectiveTeacherName || p.teacherName || 'Unassigned'}</span>
                            {p.isSubstituted && (
                              <Chip label="Substitute" size="small" sx={{ ml: 1, bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 800, height: 20 }} />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-slate-600 text-xs">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{p.roomNo || 'Room 101'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={p.isBreak ? 'Recess / Break' : 'Active Lecture'}
                            size="small"
                            sx={{
                              bgcolor: p.isBreak ? '#F1F5F9' : '#DCFCE7',
                              color: p.isBreak ? '#475569' : '#166534',
                              fontWeight: 800
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ textAlign: 'right' }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              setSelectedPeriod(p);
                              setOpenSubDialog(true);
                            }}
                            sx={{ mr: 1, textTransform: 'none', fontSize: 11, borderColor: '#CBD5E1', color: '#475569' }}
                          >
                            Substitute
                          </Button>
                          <IconButton size="small" onClick={() => handleDeletePeriod(p._id)} sx={{ color: '#EF4444' }}>
                            <Trash2 className="w-4 h-4" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* Add Period Dialog with Collision Matrix */}
        <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
          <form onSubmit={handleSavePeriod}>
            <DialogTitle sx={{ fontWeight: 800 }}>Schedule Period ({formData.day})</DialogTitle>
            <DialogContent dividers>
              {conflictWarning && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold">Schedule Collision Detected:</Typography>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 12 }}>{conflictWarning}</pre>
                </Alert>
              )}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="Day"
                    value={formData.day}
                    onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                  >
                    {DAYS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Subject Name"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g. Advanced Python"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Start Time"
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="End Time"
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Teacher / Faculty Name"
                    value={formData.teacherName}
                    onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
                    placeholder="e.g. Dr. Rajesh Sharma"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Room / Lab No"
                    value={formData.roomNo}
                    onChange={(e) => setFormData({ ...formData, roomNo: e.target.value })}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setOpenAddDialog(false)} sx={{ color: '#64748B' }}>Cancel</Button>
              <Button type="submit" variant="contained" sx={{ bgcolor: '#4338CA', fontWeight: 700 }}>Save Period</Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Assign Substitute Faculty Dialog */}
        <Dialog open={openSubDialog} onClose={() => setOpenSubDialog(false)} maxWidth="xs" fullWidth>
          <form onSubmit={handleAssignSubstitute}>
            <DialogTitle sx={{ fontWeight: 800 }}>Assign Substitute Teacher</DialogTitle>
            <DialogContent dividers>
              <Box mb={2}>
                <Typography variant="caption" color="textSecondary">Selected Period</Typography>
                <Typography variant="subtitle2" fontWeight="bold">
                  {selectedPeriod?.subject} ({selectedPeriod?.startTime} - {selectedPeriod?.endTime})
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Regular Teacher: {selectedPeriod?.teacherName}
                </Typography>
              </Box>
              <TextField
                fullWidth
                label="Date of Substitution"
                type="date"
                required
                value={subFormData.date}
                onChange={(e) => setSubFormData({ ...subFormData, date: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Substitute Faculty Name"
                required
                value={subFormData.substituteTeacherName}
                onChange={(e) => setSubFormData({ ...subFormData, substituteTeacherName: e.target.value })}
                placeholder="e.g. Prof. Priya Nair"
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Reason / Notes"
                value={subFormData.reason}
                onChange={(e) => setSubFormData({ ...subFormData, reason: e.target.value })}
              />
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setOpenSubDialog(false)} sx={{ color: '#64748B' }}>Cancel</Button>
              <Button type="submit" variant="contained" sx={{ bgcolor: '#4338CA', fontWeight: 700 }}>Confirm Assignment</Button>
            </DialogActions>
          </form>
        </Dialog>

        <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast({ ...toast, open: false })}>
          <Alert severity={toast.severity} onClose={() => setToast({ ...toast, open: false })}>{toast.message}</Alert>
        </Snackbar>
      </PageTransition>
    </AdminLayout>
  );
};

export default TimetableManagement;
