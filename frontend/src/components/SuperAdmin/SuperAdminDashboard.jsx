import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  CircularProgress, Alert, Snackbar, IconButton, Tooltip, Avatar
} from '@mui/material';
import {
  GraduationCap, School, BookOpen, Layers, Users, Plus, RefreshCw,
  Trash2, ShieldCheck, CheckCircle2, Copy, Building2, Key, Mail, Phone, Lock, Sparkles
} from 'lucide-react';
import AdminLayout from '../Common/AdminLayout';
import { PageTransition, SuccessCheckmark, triggerAcademicConfetti } from '../Common/MotionWrapper';
import api from '../../api';

const SuperAdminDashboard = () => {
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [createdCredentialsModal, setCreatedCredentialsModal] = useState(null);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  // Class / Institute Registration Form
  const [classForm, setClassForm] = useState({
    code: 'K001',
    name: '',
    ownerName: '',
    phone: '',
    email: '',
    ownerPassword: 'Class@123',
    plan: 'Pro',
    brandColor: '#2563eb',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/institutes');
      setInstitutes(res.data.data || []);
    } catch (err) {
      setToast({ open: true, message: 'Failed to load coaching institutes', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    const nextCode = `K${(institutes.length + 1).toString().padStart(3, '0')}`;
    setClassForm({
      code: nextCode,
      name: '',
      ownerName: '',
      phone: '',
      email: '',
      ownerPassword: 'Class@123',
      plan: 'Pro',
      brandColor: '#2563eb',
    });
    setOpenDialog(true);
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await api.post('/institutes', classForm);

      setOpenDialog(false);
      setCreatedCredentialsModal({
        className: classForm.name,
        classCode: classForm.code.toUpperCase(),
        ownerName: classForm.ownerName,
        email: classForm.email || `admin@${classForm.code.toLowerCase()}.com`,
        password: classForm.ownerPassword,
      });
      triggerAcademicConfetti();
      setToast({ open: true, message: 'Coaching Class and Admin provisioned successfully!', severity: 'success' });
      fetchData();
    } catch (err) {
      setToast({
        open: true,
        message: err.response?.data?.message || 'Error registering coaching class',
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const totalStudentsAcrossClasses = institutes.reduce((acc, inst) => acc + (inst.stats?.students || 0), 0);
  const totalBatchesAcrossClasses = institutes.reduce((acc, inst) => acc + (inst.stats?.batches || 0), 0);
  const totalCoursesAcrossClasses = institutes.reduce((acc, inst) => acc + (inst.stats?.courses || 0), 0);

  return (
    <AdminLayout>
      <PageTransition>
      {/* Education Radiant Banner */}
      <div className="bg-gradient-to-r from-indigo-50 via-blue-50/60 to-white border border-[#E8EDF4] rounded-3xl p-6 sm:p-8 mb-8 text-[#172033] shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            <GraduationCap className="w-9 h-9" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">ClassTech Super Admin HQ</h1>
              <span className="px-3 py-0.5 rounded-full text-[11px] font-black bg-blue-100 text-blue-800 border border-blue-200">
                Global Platform
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Create new coaching classes with unique Class Codes (e.g. <b>K001</b>) and auto-prefix all enrolled students to prevent duplication.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={fetchData}
            className="p-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-all shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
            <button
              onClick={handleOpenAdd}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 text-white font-black text-sm shadow-xl shadow-blue-500/30 flex items-center gap-2 transition-all transform hover:scale-105"
            >
              <Plus className="w-5 h-5" /> Provision New Coaching Class
            </button>
          </div>
        </div>

        {/* Large Prominent KPI Cards with Education Icons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          
          {/* Card 1: Active Coaching Classes */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">Total Coaching Classes</span>
              <h3 className="text-3xl sm:text-4xl font-black text-slate-900 mt-2">
                {institutes.length}
              </h3>
              <p className="text-xs font-bold text-blue-600 mt-1">Active Institutes</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <School className="w-7 h-7" />
            </div>
          </div>

          {/* Card 2: Total Enrolled Students */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">Enrolled Students</span>
              <h3 className="text-3xl sm:text-4xl font-black text-slate-900 mt-2">
                {totalStudentsAcrossClasses}
              </h3>
              <p className="text-xs font-bold text-emerald-600 mt-1">Across all Class Codes</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-7 h-7" />
            </div>
          </div>

          {/* Card 3: Active Classroom Batches */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">Active Batches</span>
              <h3 className="text-3xl sm:text-4xl font-black text-slate-900 mt-2">
                {totalBatchesAcrossClasses}
              </h3>
              <p className="text-xs font-bold text-indigo-600 mt-1">Classroom Schedules</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Layers className="w-7 h-7" />
            </div>
          </div>

          {/* Card 4: Academic Courses */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">Curricula & Courses</span>
              <h3 className="text-3xl sm:text-4xl font-black text-slate-900 mt-2">
                {totalCoursesAcrossClasses}
              </h3>
              <p className="text-xs font-bold text-amber-600 mt-1">JEE / NEET / Boards</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <BookOpen className="w-7 h-7" />
            </div>
          </div>
        </div>

        {/* Registered Classes Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900">Registered Coaching Classes & Franchise Admins</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every coaching class has an isolated database sandbox identified by their unique Class Code.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
              {institutes.length} Institutes Live
            </span>
          </div>

          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, fontSize: '12px', color: '#64748b' }}>CLASS CODE & PREFIX</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '12px', color: '#64748b' }}>INSTITUTE / CLASS NAME</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '12px', color: '#64748b' }}>CLASS ADMIN / OWNER</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '12px', color: '#64748b' }}>STUDENTS</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '12px', color: '#64748b' }}>BATCHES</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '12px', color: '#64748b' }}>TIER PLAN</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '12px', color: '#64748b' }}>STATUS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {institutes.map((inst) => (
                  <TableRow key={inst._id} hover>
                    <TableCell>
                      <span className="px-3 py-1.5 rounded-xl font-mono font-black text-xs bg-blue-50 text-blue-700 border border-blue-200 inline-block">
                        {inst.code}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="font-black text-slate-900 text-sm">{inst.name}</div>
                      <div className="text-xs text-slate-400">{inst.email || 'No email registered'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-bold text-slate-800">{inst.owner?.name || 'Class Admin'}</div>
                      <div className="text-[11px] font-mono text-slate-400">{inst.owner?.email || `admin@${inst.code.toLowerCase()}.com`}</div>
                    </TableCell>
                    <TableCell>
                      <span className="font-black text-sm text-slate-800">{inst.stats?.students || 0}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-black text-sm text-slate-800">{inst.stats?.batches || 0}</span>
                    </TableCell>
                    <TableCell>
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {inst.plan || 'Pro'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                        <span className="w-2 h-2 rounded-full bg-emerald-600"></span> ACTIVE
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>

        {/* Create Coaching Class Modal */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 800, bgcolor: '#0f172a', color: '#fff' }}>
            Provision New Coaching Class & Admin
          </DialogTitle>
          <form onSubmit={handleCreateClass}>
            <DialogContent sx={{ p: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Class Code (Prefix)"
                    required
                    fullWidth
                    size="small"
                    placeholder="e.g. K001"
                    helperText="Prefix for all students"
                    value={classForm.code}
                    onChange={(e) => setClassForm({ ...classForm, code: e.target.value.toUpperCase() })}
                  />
                </Grid>
                <Grid item xs={12} sm={8}>
                  <TextField
                    label="Coaching Class Name"
                    required
                    fullWidth
                    size="small"
                    placeholder="e.g. Keerti Science & Computer Classes"
                    value={classForm.name}
                    onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Class Admin / Owner Name"
                    required
                    fullWidth
                    size="small"
                    placeholder="e.g. Prof. Anil Sharma"
                    value={classForm.ownerName}
                    onChange={(e) => setClassForm({ ...classForm, ownerName: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Contact Phone"
                    fullWidth
                    size="small"
                    placeholder="e.g. 9820112345"
                    value={classForm.phone}
                    onChange={(e) => setClassForm({ ...classForm, phone: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Admin Login Email"
                    required
                    type="email"
                    fullWidth
                    size="small"
                    placeholder="admin@k001.com"
                    value={classForm.email}
                    onChange={(e) => setClassForm({ ...classForm, email: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Initial Dummy Password"
                    required
                    fullWidth
                    size="small"
                    value={classForm.ownerPassword}
                    onChange={(e) => setClassForm({ ...classForm, ownerPassword: e.target.value })}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2.5, bgcolor: '#f8fafc' }}>
              <Button onClick={() => setOpenDialog(false)} sx={{ fontWeight: 700 }}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={submitting} sx={{ fontWeight: 800, bgcolor: '#2563eb' }}>
                {submitting ? 'Creating...' : 'Provision Class [K001]'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Institute Credentials Modal */}
        <Dialog open={Boolean(createdCredentialsModal)} onClose={() => setCreatedCredentialsModal(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}>
          <DialogContent sx={{ p: 3, textAlign: 'center' }}>
            <Box sx={{ mb: 2 }}>
              <SuccessCheckmark size={58} />
            </Box>
            <Typography variant="h6" fontWeight="900" color="#172033" fontFamily="'Plus Jakarta Sans', sans-serif" mb={0.5}>
              Campus Provisioned!
            </Typography>
            <Typography variant="body2" color="#64748B" mb={2}>
              {createdCredentialsModal?.className}
            </Typography>

            <div className="p-3.5 bg-[#F8FAFC] rounded-2xl border border-[#E8EDF4] text-xs space-y-2.5 text-left mb-3">
              <div className="flex justify-between items-center">
                <span className="text-[#64748B] font-medium">Campus Code:</span>
                <span className="font-mono font-black text-[#4338CA] text-sm">{createdCredentialsModal?.classCode}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B] font-medium">Admin Email:</span>
                <span className="font-mono font-bold text-[#172033]">{createdCredentialsModal?.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B] font-medium">Default Password:</span>
                <span className="font-mono font-bold text-[#10B981]">{createdCredentialsModal?.password}</span>
              </div>
            </div>

            <Button
              variant="contained"
              fullWidth
              onClick={() => setCreatedCredentialsModal(null)}
              sx={{ bgcolor: '#4338CA', '&:hover': { bgcolor: '#3730A3' }, fontWeight: 800, borderRadius: '12px', py: 1.2 }}
            >
              Done & Continue
            </Button>
          </DialogContent>
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
      </PageTransition>
    </AdminLayout>
  );
};

export default SuperAdminDashboard;
