import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, MenuItem, Dialog, DialogTitle, DialogContent,
  DialogActions, Chip, IconButton, Alert, Snackbar, Grid, CircularProgress, Tabs, Tab
} from '@mui/material';
import { Plus, Shield, UserCheck, LogOut, CheckCircle, Clock, Printer } from 'lucide-react';
import AdminLayout from '../Common/AdminLayout';
import { PageTransition } from '../Common/MotionWrapper';
import api from '../../api';

const GatePassManagement = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [visitors, setVisitors] = useState([]);
  const [studentPasses, setStudentPasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  // Dialogs
  const [openVisitorDialog, setOpenVisitorDialog] = useState(false);
  const [openStudentPassDialog, setOpenStudentPassDialog] = useState(false);

  // Forms
  const [visitorForm, setVisitorForm] = useState({
    visitorName: '',
    phone: '',
    purpose: 'Parent Inquiry / Fee Query',
    hostEmployee: 'Principal / Admin Office',
    idProofType: 'Aadhaar / Driving License'
  });

  const [studentPassForm, setStudentPassForm] = useState({
    studentId: '',
    reason: 'Medical Emergency / Unwell',
    accompanyingPerson: 'Father',
    approvedBy: 'Campus Head'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vRes, sRes, stuRes] = await Promise.all([
        api.get('/gatepass/visitors'),
        api.get('/gatepass/student-passes'),
        api.get('/students')
      ]);
      setVisitors(Array.isArray(vRes.data) ? vRes.data : (vRes.data?.data || []));
      setStudentPasses(Array.isArray(sRes.data) ? sRes.data : (sRes.data?.data || []));
      setStudents(Array.isArray(stuRes.data) ? stuRes.data : (stuRes.data?.data || []));
    } catch (err) {
      setToast({ open: true, message: 'Failed to load gate security data', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleVisitorCheckIn = async (e) => {
    e.preventDefault();
    try {
      await api.post('/gatepass/visitors/check-in', visitorForm);
      setToast({ open: true, message: 'Visitor checked in and pass generated!', severity: 'success' });
      setOpenVisitorDialog(false);
      fetchData();
    } catch (err) {
      setToast({ open: true, message: err.response?.data?.message || 'Error checking in visitor', severity: 'error' });
    }
  };

  const handleVisitorCheckOut = async (id) => {
    try {
      await api.patch(`/gatepass/visitors/${id}/check-out`, {});
      setToast({ open: true, message: 'Visitor checked out successfully', severity: 'success' });
      fetchData();
    } catch (err) {
      setToast({ open: true, message: 'Failed to check out visitor', severity: 'error' });
    }
  };

  const handleIssueStudentPass = async (e) => {
    e.preventDefault();
    try {
      await api.post('/gatepass/student-passes', studentPassForm);
      setToast({ open: true, message: 'Student exit gate pass authorised!', severity: 'success' });
      setOpenStudentPassDialog(false);
      fetchData();
    } catch (err) {
      setToast({ open: true, message: err.response?.data?.message || 'Error issuing pass', severity: 'error' });
    }
  };

  return (
    <AdminLayout>
      <PageTransition>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h5" fontWeight="900" color="#0f172a">
              Security Gate Passes & Visitor Management
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Track campus visitor check-ins, guest badge logs, and student early exit emergency gate passes
            </Typography>
          </Box>
          <Box display="flex" gap={1.5}>
            <Button
              variant="outlined"
              startIcon={<UserCheck className="w-4 h-4" />}
              onClick={() => setOpenVisitorDialog(true)}
              sx={{ borderColor: '#4338CA', color: '#4338CA', fontWeight: 700, textTransform: 'none' }}
            >
              Guest Check-In
            </Button>
            <Button
              variant="contained"
              startIcon={<Plus className="w-4 h-4" />}
              onClick={() => setOpenStudentPassDialog(true)}
              sx={{ bgcolor: '#4338CA', '&:hover': { bgcolor: '#3730A3' }, fontWeight: 700, textTransform: 'none' }}
            >
              Issue Student Gate Pass
            </Button>
          </Box>
        </Box>

        <Paper sx={{ mb: 3, borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <Tabs
            value={activeTab}
            onChange={(e, val) => setActiveTab(val)}
            sx={{ '& .MuiTab-root': { fontWeight: 800, textTransform: 'none', py: 1.5 }, '& .Mui-selected': { color: '#4338CA' } }}
          >
            <Tab label="Campus Visitor Log" />
            <Tab label="Student Emergency Exit Passes" />
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
                        <TableCell sx={{ fontWeight: 800 }}>Pass ID</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Visitor Name</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Contact Phone</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Purpose</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Check-In Time</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {visitors.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} sx={{ textAlign: 'center', py: 5, color: '#64748B' }}>
                            Zero active visitor records. Click "Guest Check-In" to log campus visitors.
                          </TableCell>
                        </TableRow>
                      ) : (
                        visitors.map(v => (
                          <TableRow key={v._id} hover>
                            <TableCell sx={{ fontWeight: 800, color: '#4338CA' }}>{v.passNo || `VIS-${v._id.slice(-4).toUpperCase()}`}</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: '#0F172A' }}>{v.visitorName}</TableCell>
                            <TableCell>{v.phone}</TableCell>
                            <TableCell>{v.purpose}</TableCell>
                            <TableCell>{new Date(v.checkInTime || v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
                            <TableCell>
                              <Chip
                                label={v.status === 'Checked-In' ? 'On Campus' : 'Departed'}
                                size="small"
                                sx={{
                                  bgcolor: v.status === 'Checked-In' ? '#DCFCE7' : '#F1F5F9',
                                  color: v.status === 'Checked-In' ? '#166534' : '#475569',
                                  fontWeight: 800
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ textAlign: 'right' }}>
                              {v.status === 'Checked-In' && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<LogOut className="w-3.5 h-3.5" />}
                                  onClick={() => handleVisitorCheckOut(v._id)}
                                  sx={{ textTransform: 'none', fontSize: 11, borderColor: '#CBD5E1', color: '#334155' }}
                                >
                                  Check Out
                                </Button>
                              )}
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
                        <TableCell sx={{ fontWeight: 800 }}>Gate Pass No</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Student Name</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Stated Reason</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Accompanying Person</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Authorised By</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Pass Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {studentPasses.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} sx={{ textAlign: 'center', py: 5, color: '#64748B' }}>
                            Zero student exit passes logged today.
                          </TableCell>
                        </TableRow>
                      ) : (
                        studentPasses.map(sp => (
                          <TableRow key={sp._id} hover>
                            <TableCell sx={{ fontWeight: 800, color: '#4338CA' }}>{sp.passNo || `GP-2026-${sp._id.slice(-4).toUpperCase()}`}</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: '#0F172A' }}>{sp.studentName || 'Student'}</TableCell>
                            <TableCell>{sp.reason}</TableCell>
                            <TableCell>{sp.accompanyingPerson || 'Guardian'}</TableCell>
                            <TableCell>{sp.approvedBy || 'Campus Administrator'}</TableCell>
                            <TableCell>
                              <Chip label="Authorised Exit" size="small" sx={{ bgcolor: '#DCFCE7', color: '#166534', fontWeight: 800 }} />
                            </TableCell>
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

        {/* Visitor Check-In Dialog */}
        <Dialog open={openVisitorDialog} onClose={() => setOpenVisitorDialog(false)} maxWidth="sm" fullWidth>
          <form onSubmit={handleVisitorCheckIn}>
            <DialogTitle sx={{ fontWeight: 800 }}>Guest Visitor Check-In</DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Visitor Name" required value={visitorForm.visitorName} onChange={(e) => setVisitorForm({ ...visitorForm, visitorName: e.target.value })} placeholder="John Doe" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Mobile Phone" required value={visitorForm.phone} onChange={(e) => setVisitorForm({ ...visitorForm, phone: e.target.value })} placeholder="9820011223" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Purpose of Visit" value={visitorForm.purpose} onChange={(e) => setVisitorForm({ ...visitorForm, purpose: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Whom to Meet" value={visitorForm.hostEmployee} onChange={(e) => setVisitorForm({ ...visitorForm, hostEmployee: e.target.value })} />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setOpenVisitorDialog(false)}>Cancel</Button>
              <Button type="submit" variant="contained" sx={{ bgcolor: '#4338CA' }}>Issue Visitor Badge</Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Issue Student Gate Pass Dialog */}
        <Dialog open={openStudentPassDialog} onClose={() => setOpenStudentPassDialog(false)} maxWidth="xs" fullWidth>
          <form onSubmit={handleIssueStudentPass}>
            <DialogTitle sx={{ fontWeight: 800 }}>Issue Student Emergency Exit Pass</DialogTitle>
            <DialogContent dividers>
              <TextField select fullWidth label="Select Student" required value={studentPassForm.studentId} onChange={(e) => setStudentPassForm({ ...studentPassForm, studentId: e.target.value })} sx={{ mb: 2 }}>
                {students.map(s => <MenuItem key={s._id} value={s._id}>{s.fname} {s.lname} (Roll #{s.rollno})</MenuItem>)}
              </TextField>
              <TextField fullWidth label="Exit Reason" required value={studentPassForm.reason} onChange={(e) => setStudentPassForm({ ...studentPassForm, reason: e.target.value })} sx={{ mb: 2 }} />
              <TextField fullWidth label="Guardian / Accompanying Person" required value={studentPassForm.accompanyingPerson} onChange={(e) => setStudentPassForm({ ...studentPassForm, accompanyingPerson: e.target.value })} sx={{ mb: 2 }} />
              <TextField fullWidth label="Authorised Officer" value={studentPassForm.approvedBy} onChange={(e) => setStudentPassForm({ ...studentPassForm, approvedBy: e.target.value })} />
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setOpenStudentPassDialog(false)}>Cancel</Button>
              <Button type="submit" variant="contained" sx={{ bgcolor: '#4338CA' }}>Authorise Exit Pass</Button>
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

export default GatePassManagement;
