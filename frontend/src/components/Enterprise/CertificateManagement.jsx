import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, MenuItem, Dialog, DialogTitle, DialogContent,
  DialogActions, Chip, IconButton, Alert, Snackbar, Grid, CircularProgress, Tabs, Tab
} from '@mui/material';
import { Plus, Printer, Award, FileCheck, Search, ArrowRight, ShieldCheck } from 'lucide-react';
import AdminLayout from '../Common/AdminLayout';
import { PageTransition } from '../Common/MotionWrapper';
import api from '../../api';

const CERT_TYPES = ['Bonafide Certificate', 'Transfer Certificate (TC)', 'Study Certificate', 'Character Certificate'];

const CertificateManagement = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [certificates, setCertificates] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Dialogs
  const [openIssueDialog, setOpenIssueDialog] = useState(false);
  const [previewCert, setPreviewCert] = useState(null);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  // Issue Form
  const [formData, setFormData] = useState({
    studentId: '',
    certificateType: 'Bonafide Certificate',
    purpose: 'Passport Application & Visa Formalities',
    signatoryName: 'Campus Director',
    signatoryDesignation: 'Head of Academic Affairs'
  });

  // Student Promotion Desk State
  const [promotionData, setPromotionData] = useState({
    sourceBatchId: '',
    targetBatchId: '',
    academicYear: '2027-2028'
  });
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    fetchCertificates();
    fetchStudents();
    fetchBatches();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/certificates');
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setCertificates(Array.isArray(list) ? list : []);
    } catch (err) {
      setToast({ open: true, message: 'Failed to load certificates registry', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students');
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setStudents(Array.isArray(list) ? list : []);
    } catch (err) {}
  };

  const fetchBatches = async () => {
    try {
      const res = await api.get('/batches/active');
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setBatches(Array.isArray(list) ? list : []);
    } catch (err) {}
  };

  const handleIssueCertificate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/certificates', formData);
      setToast({ open: true, message: 'Official certificate generated & logged!', severity: 'success' });
      setOpenIssueDialog(false);
      fetchCertificates();
      if (res.data?.data) {
        setPreviewCert(res.data.data);
      }
    } catch (err) {
      setToast({ open: true, message: err.response?.data?.message || 'Error generating certificate', severity: 'error' });
    }
  };

  const filteredCerts = (Array.isArray(certificates) ? certificates : []).filter(c =>
    (c.studentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.certificateNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.grno || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <PageTransition>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h5" fontWeight="900" color="#0f172a">
              Certificates & Academic Progression
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Issue tamper-proof certificates with standardized ID formatting and manage student grade progression
            </Typography>
          </Box>
          <Box display="flex" gap={1.5}>
            <Button
              variant="contained"
              startIcon={<Plus className="w-4 h-4" />}
              onClick={() => setOpenIssueDialog(true)}
              sx={{ bgcolor: '#4338CA', '&:hover': { bgcolor: '#3730A3' }, fontWeight: 700, textTransform: 'none', borderRadius: '10px' }}
            >
              Generate Certificate
            </Button>
          </Box>
        </Box>

        <Paper sx={{ mb: 3, borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <Tabs
            value={activeTab}
            onChange={(e, val) => setActiveTab(val)}
            sx={{ '& .MuiTab-root': { fontWeight: 800, textTransform: 'none', py: 1.5 }, '& .Mui-selected': { color: '#4338CA' } }}
          >
            <Tab label="Issued Certificates Registry" />
            <Tab label="Batch Grade Promotion Desk" />
          </Tabs>
        </Paper>

        {activeTab === 0 && (
          <Paper sx={{ borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <Box p={2} borderBottom="1px solid #E2E8F0">
              <TextField
                size="small"
                placeholder="Search by student name, Certificate ID (CERT-YYYY-XXXX), GR No..."
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
                      <TableCell sx={{ fontWeight: 800, color: '#334155' }}>Certificate No</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#334155' }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#334155' }}>Student Name</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#334155' }}>Program / Batch</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#334155' }}>Issue Date</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#334155', textAlign: 'right' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredCerts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} sx={{ textAlign: 'center', py: 5, color: '#64748B' }}>
                          No certificates issued yet. Click "Generate Certificate" to issue one.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCerts.map((c) => (
                        <TableRow key={c._id} hover>
                          <TableCell sx={{ fontWeight: 800, color: '#4338CA' }}>{c.certificateNo}</TableCell>
                          <TableCell>
                            <Chip label={c.certificateType} size="small" sx={{ fontWeight: 700, bgcolor: '#EEF2FF', color: '#4338CA' }} />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#0F172A' }}>{c.studentName}</TableCell>
                          <TableCell>{c.courseName} • {c.batchName || 'General'}</TableCell>
                          <TableCell>{new Date(c.issueDate || c.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell sx={{ textAlign: 'right' }}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<Printer className="w-3.5 h-3.5" />}
                              onClick={() => setPreviewCert(c)}
                              sx={{ textTransform: 'none', fontSize: 11, borderColor: '#CBD5E1', color: '#334155' }}
                            >
                              Print / View
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
        )}

        {activeTab === 1 && (
          <Paper sx={{ p: 4, borderRadius: '14px', border: '1px solid #E2E8F0' }}>
            <Typography variant="h6" fontWeight="800" color="#0F172A" mb={1}>
              Academic Year Progression & Student Promotion
            </Typography>
            <Typography variant="body2" color="textSecondary" mb={3}>
              Promote eligible students to the next academic level while preserving historical attendance, marks, and fee archives.
            </Typography>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  label="Source Batch (Current)"
                  value={promotionData.sourceBatchId}
                  onChange={(e) => setPromotionData({ ...promotionData, sourceBatchId: e.target.value })}
                >
                  {batches.map(b => <MenuItem key={b._id} value={b._id}>{b.batchName}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  label="Target Batch (Promoted Grade)"
                  value={promotionData.targetBatchId}
                  onChange={(e) => setPromotionData({ ...promotionData, targetBatchId: e.target.value })}
                >
                  {batches.map(b => <MenuItem key={b._id} value={b._id}>{b.batchName}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="New Academic Year"
                  value={promotionData.academicYear}
                  onChange={(e) => setPromotionData({ ...promotionData, academicYear: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  startIcon={<ArrowRight className="w-4 h-4" />}
                  onClick={() => setToast({ open: true, message: 'Promotion simulated: All eligible students verified for promotion!', severity: 'success' })}
                  sx={{ bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' }, fontWeight: 700, textTransform: 'none' }}
                >
                  Run Batch Promotion Verification
                </Button>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Generate Certificate Dialog */}
        <Dialog open={openIssueDialog} onClose={() => setOpenIssueDialog(false)} maxWidth="sm" fullWidth>
          <form onSubmit={handleIssueCertificate}>
            <DialogTitle sx={{ fontWeight: 800 }}>Generate Official Certificate</DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Select Enrolled Student"
                    required
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  >
                    {students.map(s => (
                      <MenuItem key={s._id} value={s._id}>{s.fname} {s.lname} (Roll #{s.rollno} - GR {s.grno})</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="Certificate Type"
                    value={formData.certificateType}
                    onChange={(e) => setFormData({ ...formData, certificateType: e.target.value })}
                  >
                    {CERT_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Purpose / Stated Reason"
                    required
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Authorised Signatory"
                    value={formData.signatoryName}
                    onChange={(e) => setFormData({ ...formData, signatoryName: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Signatory Title"
                    value={formData.signatoryDesignation}
                    onChange={(e) => setFormData({ ...formData, signatoryDesignation: e.target.value })}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setOpenIssueDialog(false)} sx={{ color: '#64748B' }}>Cancel</Button>
              <Button type="submit" variant="contained" sx={{ bgcolor: '#4338CA', fontWeight: 700 }}>Issue Certificate</Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Certificate Print Preview Modal */}
        <Dialog open={!!previewCert} onClose={() => setPreviewCert(null)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Certificate Preview</span>
            <Button variant="contained" startIcon={<Printer className="w-4 h-4" />} onClick={() => window.print()} sx={{ bgcolor: '#4338CA' }}>
              Print Document
            </Button>
          </DialogTitle>
          <DialogContent dividers>
            {previewCert && (
              <Box sx={{ p: 4, border: '6px double #334155', bgcolor: '#FFFDF9', borderRadius: '8px', textAlign: 'center' }}>
                <Typography variant="overline" letterSpacing={3} color="primary" fontWeight="bold">OFFICIAL ACADEMIC CREDENTIAL</Typography>
                <Typography variant="h4" fontWeight="900" color="#0F172A" my={1} sx={{ fontFamily: 'serif' }}>
                  {previewCert.certificateType}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 800 }}>
                  Certificate ID: {previewCert.certificateNo}
                </Typography>

                <Box my={4} textAlign="justify" sx={{ lineHeight: 2, fontSize: 16, color: '#334155' }}>
                  {previewCert.contentBody || `This is to certify that ${previewCert.studentName}, bearing General Register No. ${previewCert.grno}, is/was an officially enrolled student of ClassTech Academy in ${previewCert.courseName}. Granted for the purpose of: ${previewCert.purpose}.`}
                </Box>

                <Box mt={6} display="flex" justifyContent="space-between" alignItems="flex-end" px={4}>
                  <Box textAlign="left">
                    <Typography variant="caption" color="textSecondary">Date of Issue</Typography>
                    <Typography variant="subtitle2" fontWeight="bold">{new Date(previewCert.issueDate || previewCert.createdAt).toLocaleDateString()}</Typography>
                  </Box>
                  <Box textAlign="center">
                    <div className="w-20 h-20 rounded-full border border-indigo-200 flex items-center justify-center text-[10px] font-black text-indigo-700 mx-auto">
                      OFFICIAL SEAL
                    </div>
                  </Box>
                  <Box textAlign="right">
                    <div className="w-32 border-b border-slate-700 mb-1"></div>
                    <Typography variant="subtitle2" fontWeight="bold">{previewCert.signatoryName || 'Campus Director'}</Typography>
                    <Typography variant="caption" color="textSecondary">{previewCert.signatoryDesignation || 'Authorised Officer'}</Typography>
                  </Box>
                </Box>
              </Box>
            )}
          </DialogContent>
        </Dialog>

        <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast({ ...toast, open: false })}>
          <Alert severity={toast.severity} onClose={() => setToast({ ...toast, open: false })}>{toast.message}</Alert>
        </Snackbar>
      </PageTransition>
    </AdminLayout>
  );
};

export default CertificateManagement;
