import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, MenuItem, Dialog, DialogTitle, DialogContent,
  DialogActions, Chip, IconButton, Alert, Snackbar, Grid, CircularProgress, Switch, FormControlLabel
} from '@mui/material';
import { Plus, GraduationCap, Briefcase, Download, Lock, Globe, Search } from 'lucide-react';
import AdminLayout from '../Common/AdminLayout';
import { PageTransition } from '../Common/MotionWrapper';
import api from '../../api';

const AlumniManagement = () => {
  const [alumniList, setAlumniList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    graduationYear: 2025,
    degreeProgram: 'Full Stack Web Development',
    employmentStatus: 'Employed',
    companyName: 'Infosys Tech',
    currentDesignation: 'Junior Software Engineer',
    email: '',
    phone: '',
    isProfilePublic: true
  });

  useEffect(() => {
    fetchAlumni();
  }, []);

  const fetchAlumni = async () => {
    try {
      setLoading(true);
      const res = await api.get('/alumni');
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setAlumniList(Array.isArray(list) ? list : []);
    } catch (err) {
      setToast({ open: true, message: 'Failed to load alumni directory', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterAlumni = async (e) => {
    e.preventDefault();
    try {
      await api.post('/alumni/register', {
        ...formData,
        graduationYear: Number(formData.graduationYear)
      });
      setToast({ open: true, message: 'Alumni member registered!', severity: 'success' });
      setOpenDialog(false);
      fetchAlumni();
    } catch (err) {
      setToast({ open: true, message: err.response?.data?.message || 'Error registering alumni', severity: 'error' });
    }
  };

  const handleTogglePrivacy = async (id, currentVal) => {
    try {
      await api.patch(`/alumni/${id}/privacy`, { isProfilePublic: !currentVal });
      setToast({ open: true, message: `Privacy updated to ${!currentVal ? 'Public' : 'Private'}!`, severity: 'success' });
      fetchAlumni();
    } catch (err) {
      setToast({ open: true, message: 'Failed to toggle privacy', severity: 'error' });
    }
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Graduation Year', 'Degree', 'Employment Status', 'Company', 'Designation', 'Contact'];
    const rows = (Array.isArray(alumniList) ? alumniList : []).map(a => [
      `"${a.name || ''}"`,
      a.graduationYear || '',
      `"${a.degreeProgram || ''}"`,
      a.employmentStatus || '',
      `"${a.companyName || ''}"`,
      `"${a.currentDesignation || ''}"`,
      a.phone || ''
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Alumni_Directory_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const filtered = (Array.isArray(alumniList) ? alumniList : []).filter(a =>
    (a.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.companyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.degreeProgram || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <PageTransition>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h5" fontWeight="900" color="#0f172a">
              Alumni Relations & Career Tracking
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Track school graduates, career placements, higher education admissions, and alumni network directories
            </Typography>
          </Box>
          <Box display="flex" gap={1.5}>
            <Button
              variant="outlined"
              startIcon={<Download className="w-4 h-4" />}
              onClick={handleExportCSV}
              sx={{ borderColor: '#CBD5E1', color: '#334155', fontWeight: 700, textTransform: 'none' }}
            >
              Export CSV
            </Button>
            <Button
              variant="contained"
              startIcon={<Plus className="w-4 h-4" />}
              onClick={() => setOpenDialog(true)}
              sx={{ bgcolor: '#4338CA', '&:hover': { bgcolor: '#3730A3' }, fontWeight: 700, textTransform: 'none' }}
            >
              Register Alumni
            </Button>
          </Box>
        </Box>

        <Paper sx={{ borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <Box p={2} borderBottom="1px solid #E2E8F0">
            <TextField
              size="small"
              placeholder="Search by alumni name, company, degree program..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ width: { xs: '100%', sm: 380 } }}
            />
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress sx={{ color: '#4338CA' }} />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Graduate Name</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Graduation Class</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Degree / Program</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Current Career Placement</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Directory Privacy</TableCell>
                    <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: 'center', py: 5, color: '#64748B' }}>
                        No alumni records registered yet. Click "Register Alumni" to add graduates.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((a) => (
                      <TableRow key={a._id} hover>
                        <TableCell sx={{ fontWeight: 800, color: '#0F172A' }}>{a.name}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#4338CA' }}>Class of {a.graduationYear}</TableCell>
                        <TableCell>{a.degreeProgram}</TableCell>
                        <TableCell>
                          <div>
                            <span className="font-semibold text-slate-800">{a.currentDesignation || 'Graduate'}</span>
                            <span className="text-xs text-slate-500 block">at {a.companyName || 'Self-Employed'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {a.isProfilePublic ? (
                            <Chip icon={<Globe className="w-3.5 h-3.5" />} label="Public" size="small" sx={{ bgcolor: '#DCFCE7', color: '#166534', fontWeight: 800 }} />
                          ) : (
                            <Chip icon={<Lock className="w-3.5 h-3.5" />} label="Private" size="small" sx={{ bgcolor: '#F1F5F9', color: '#475569', fontWeight: 800 }} />
                          )}
                        </TableCell>
                        <TableCell sx={{ textAlign: 'right' }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleTogglePrivacy(a._id, a.isProfilePublic)}
                            sx={{ textTransform: 'none', fontSize: 11, borderColor: '#CBD5E1', color: '#334155' }}
                          >
                            Toggle Privacy
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {/* Register Alumni Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <form onSubmit={handleRegisterAlumni}>
            <DialogTitle sx={{ fontWeight: 800 }}>Register Graduate Alumni</DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={8}>
                  <TextField fullWidth label="Full Name" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label="Graduation Year" type="number" required value={formData.graduationYear} onChange={(e) => setFormData({ ...formData, graduationYear: Number(e.target.value) })} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Degree / Academic Program Completed" required value={formData.degreeProgram} onChange={(e) => setFormData({ ...formData, degreeProgram: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Current Employer / Company" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Designation / Role" value={formData.currentDesignation} onChange={(e) => setFormData({ ...formData, currentDesignation: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Mobile Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Email Address" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={<Switch checked={formData.isProfilePublic} onChange={(e) => setFormData({ ...formData, isProfilePublic: e.target.checked })} />}
                    label="Show on Public ClassTech Alumni Network Directory"
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
              <Button type="submit" variant="contained" sx={{ bgcolor: '#4338CA' }}>Save Alumni Profile</Button>
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

export default AlumniManagement;
