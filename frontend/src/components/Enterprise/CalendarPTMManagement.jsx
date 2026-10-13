import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, MenuItem, Dialog, DialogTitle, DialogContent,
  DialogActions, Chip, IconButton, Alert, Snackbar, Grid, CircularProgress, Tabs, Tab
} from '@mui/material';
import { Plus, Calendar, Users, Clock, CheckCircle, Trash2 } from 'lucide-react';
import AdminLayout from '../Common/AdminLayout';
import { PageTransition } from '../Common/MotionWrapper';
import api from '../../api';

const AUDIENCES = ['All', 'Staff', 'Students', 'Parents'];

const CalendarPTMManagement = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [events, setEvents] = useState([]);
  const [ptmSlots, setPtmSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  // Dialogs
  const [openEventDialog, setOpenEventDialog] = useState(false);
  const [openPTMDialog, setOpenPTMDialog] = useState(false);

  // Forms
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    audience: 'All',
    category: 'Academic'
  });

  const [ptmForm, setPtmForm] = useState({
    teacherName: 'Dr. Ramesh Sharma',
    slotDate: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '10:20',
    maxBookings: 1
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eRes, pRes] = await Promise.all([
        api.get('/calendar/events'),
        api.get('/calendar/ptm-slots')
      ]);
      setEvents(Array.isArray(eRes.data) ? eRes.data : (eRes.data?.data || []));
      setPtmSlots(Array.isArray(pRes.data) ? pRes.data : (pRes.data?.data || []));
    } catch (err) {
      setToast({ open: true, message: 'Failed to load calendar events', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await api.post('/calendar/events', eventForm);
      setToast({ open: true, message: 'Event added to institutional calendar!', severity: 'success' });
      setOpenEventDialog(false);
      fetchData();
    } catch (err) {
      setToast({ open: true, message: err.response?.data?.message || 'Error creating event', severity: 'error' });
    }
  };

  const handleCreatePTM = async (e) => {
    e.preventDefault();
    try {
      await api.post('/calendar/ptm-slots', ptmForm);
      setToast({ open: true, message: 'PTM consultation slot configured!', severity: 'success' });
      setOpenPTMDialog(false);
      fetchData();
    } catch (err) {
      setToast({ open: true, message: err.response?.data?.message || 'Error configuring slot', severity: 'error' });
    }
  };

  const handleDeleteEvent = async (id) => {
    try {
      await api.delete(`/calendar/events/${id}`);
      setToast({ open: true, message: 'Event deleted from calendar', severity: 'success' });
      fetchData();
    } catch (err) {
      setToast({ open: true, message: 'Failed to delete event', severity: 'error' });
    }
  };

  return (
    <AdminLayout>
      <PageTransition>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h5" fontWeight="900" color="#0f172a">
              Academic Calendar & Parent-Teacher Meeting (PTM)
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Schedule academic milestones, exam dates, holiday calendars, and parent-faculty 1-on-1 consultation slots
            </Typography>
          </Box>
          <Box display="flex" gap={1.5}>
            <Button
              variant="outlined"
              startIcon={<Calendar className="w-4 h-4" />}
              onClick={() => setOpenEventDialog(true)}
              sx={{ borderColor: '#4338CA', color: '#4338CA', fontWeight: 700, textTransform: 'none' }}
            >
              Add Event
            </Button>
            <Button
              variant="contained"
              startIcon={<Clock className="w-4 h-4" />}
              onClick={() => setOpenPTMDialog(true)}
              sx={{ bgcolor: '#4338CA', '&:hover': { bgcolor: '#3730A3' }, fontWeight: 700, textTransform: 'none' }}
            >
              New PTM Slot
            </Button>
          </Box>
        </Box>

        <Paper sx={{ mb: 3, borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <Tabs
            value={activeTab}
            onChange={(e, val) => setActiveTab(val)}
            sx={{ '& .MuiTab-root': { fontWeight: 800, textTransform: 'none', py: 1.5 }, '& .Mui-selected': { color: '#4338CA' } }}
          >
            <Tab label="Academic Calendar Schedule" />
            <Tab label="Parent-Teacher (PTM) Booking Desk" />
          </Tabs>
        </Paper>

        {loading ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress sx={{ color: '#4338CA' }} />
          </Box>
        ) : (
          <>
            {activeTab === 0 && (
              <Paper sx={{ borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                <TableContainer>
                  <Table>
                    <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800 }}>Date Range</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Event Title</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Category</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Target Audience</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Description</TableCell>
                        <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {events.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} sx={{ textAlign: 'center', py: 5, color: '#64748B' }}>
                            Zero academic calendar events scheduled. Click "Add Event" to create entries.
                          </TableCell>
                        </TableRow>
                      ) : (
                        events.map(ev => (
                          <TableRow key={ev._id} hover>
                            <TableCell sx={{ fontWeight: 800, color: '#4338CA' }}>
                              {ev.startDate} {ev.endDate && ev.endDate !== ev.startDate ? `to ${ev.endDate}` : ''}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 800, color: '#0F172A' }}>{ev.title}</TableCell>
                            <TableCell><Chip label={ev.category || 'Academic'} size="small" sx={{ fontWeight: 700 }} /></TableCell>
                            <TableCell><Chip label={ev.audience} size="small" sx={{ bgcolor: '#EEF2FF', color: '#4338CA', fontWeight: 800 }} /></TableCell>
                            <TableCell>{ev.description || 'Institutional Event'}</TableCell>
                            <TableCell sx={{ textAlign: 'right' }}>
                              <IconButton size="small" onClick={() => handleDeleteEvent(ev._id)} sx={{ color: '#EF4444' }}>
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

            {activeTab === 1 && (
              <Paper sx={{ borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                <TableContainer>
                  <Table>
                    <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800 }}>Slot Date</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Time Window</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Faculty / Counselor</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Booking Status</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Reserved By Parent</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {ptmSlots.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} sx={{ textAlign: 'center', py: 5, color: '#64748B' }}>
                            No PTM consultation slots created yet. Click "New PTM Slot" to open appointment windows.
                          </TableCell>
                        </TableRow>
                      ) : (
                        ptmSlots.map(s => (
                          <TableRow key={s._id} hover>
                            <TableCell sx={{ fontWeight: 800 }}>{s.slotDate}</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#4338CA' }}>{s.startTime} - {s.endTime}</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>{s.teacherName}</TableCell>
                            <TableCell>
                              <Chip
                                label={s.isBooked ? 'Reserved' : 'Available for Booking'}
                                size="small"
                                sx={{
                                  bgcolor: s.isBooked ? '#FEE2E2' : '#DCFCE7',
                                  color: s.isBooked ? '#991B1B' : '#166534',
                                  fontWeight: 800
                                }}
                              />
                            </TableCell>
                            <TableCell>{s.bookedByParentName || (s.isBooked ? 'Parent' : 'Open Slot')}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}
          </>
        )}

        {/* Add Event Dialog */}
        <Dialog open={openEventDialog} onClose={() => setOpenEventDialog(false)} maxWidth="sm" fullWidth>
          <form onSubmit={handleCreateEvent}>
            <DialogTitle sx={{ fontWeight: 800 }}>Create Academic Calendar Event</DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth label="Event Title" required value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} placeholder="e.g. Mid-Term Examination Week" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Start Date" type="date" required value={eventForm.startDate} onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="End Date" type="date" value={eventForm.endDate} onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField select fullWidth label="Target Audience" value={eventForm.audience} onChange={(e) => setEventForm({ ...eventForm, audience: e.target.value })}>
                    {AUDIENCES.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Category" value={eventForm.category} onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth multiline rows={3} label="Event Description" value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setOpenEventDialog(false)}>Cancel</Button>
              <Button type="submit" variant="contained" sx={{ bgcolor: '#4338CA' }}>Publish Event</Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Add PTM Slot Dialog */}
        <Dialog open={openPTMDialog} onClose={() => setOpenPTMDialog(false)} maxWidth="xs" fullWidth>
          <form onSubmit={handleCreatePTM}>
            <DialogTitle sx={{ fontWeight: 800 }}>Create PTM Teacher Slot</DialogTitle>
            <DialogContent dividers>
              <TextField fullWidth label="Teacher Name" required value={ptmForm.teacherName} onChange={(e) => setPtmForm({ ...ptmForm, teacherName: e.target.value })} sx={{ mb: 2 }} />
              <TextField fullWidth label="Date" type="date" required value={ptmForm.slotDate} onChange={(e) => setPtmForm({ ...ptmForm, slotDate: e.target.value })} sx={{ mb: 2 }} />
              <TextField fullWidth label="Start Time" type="time" required value={ptmForm.startTime} onChange={(e) => setPtmForm({ ...ptmForm, startTime: e.target.value })} sx={{ mb: 2 }} />
              <TextField fullWidth label="End Time" type="time" required value={ptmForm.endTime} onChange={(e) => setPtmForm({ ...ptmForm, endTime: e.target.value })} />
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setOpenPTMDialog(false)}>Cancel</Button>
              <Button type="submit" variant="contained" sx={{ bgcolor: '#4338CA' }}>Add Slot</Button>
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

export default CalendarPTMManagement;
