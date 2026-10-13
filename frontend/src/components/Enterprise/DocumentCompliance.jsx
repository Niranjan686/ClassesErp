import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, MenuItem, Dialog, DialogTitle, DialogContent,
  DialogActions, Chip, IconButton, Alert, Snackbar, Grid, CircularProgress
} from '@mui/material';
import { Plus, FileText, CheckCircle2, XCircle, Search, ShieldCheck } from 'lucide-react';
import AdminLayout from '../Common/AdminLayout';
import { PageTransition } from '../Common/MotionWrapper';
import api from '../../api';

const DOC_TYPES = ['Aadhaar Card', 'Birth Certificate', 'Previous Marksheet', 'Transfer Certificate', 'Passport Photograph'];

const DocumentCompliance = () => {
  const [documents, setDocuments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [openDialog, setOpenDialog] = useState(false);

  const [formData, setFormData] = useState({
    studentId: '',
    documentType: 'Aadhaar Card',
    fileName: 'student_aadhaar.pdf',
    verificationNotes: 'Verified with original UIDAI copy'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dRes, sRes] = await Promise.all([
        api.get('/documents'),
        api.get('/students')
      ]);
      setDocuments(Array.isArray(dRes.data) ? dRes.data : (dRes.data?.data || []));
      setStudents(Array.isArray(sRes.data) ? sRes.data : (sRes.data?.data || []));
    } catch (err) {
      setToast({ open: true, message: 'Failed to load student documents', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    try {
      await api.post('/documents/upload', formData);
      setToast({ open: true, message: 'Document archived and submitted for verification!', severity: 'success' });
      setOpenDialog(false);
      fetchData();
    } catch (err) {
      setToast({ open: true, message: err.response?.data?.message || 'Error uploading document', severity: 'error' });
    }
  };

  const handleVerify = async (id, status) => {
    try {
      await api.patch(`/documents/${id}/verify`, { status });
      setToast({ open: true, message: `Document marked as ${status}!`, severity: 'success' });
      fetchData();
    } catch (err) {
      setToast({ open: true, message: 'Failed to update verification status', severity: 'error' });
    }
  };

  return (
    <AdminLayout>
      <PageTransition>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h5" fontWeight="900" color="#0f172a">
              Student Document Vault & Compliance Audit
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Track mandatory identity proofs (Aadhaar, Birth Certificate, Marksheets), verification approvals, and missing files
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Plus className="w-4 h-4" />}
            onClick={() => setOpenDialog(true)}
            sx={{ bgcolor: '#4338CA', '&:hover': { bgcolor: '#3730A3' }, fontWeight: 700, textTransform: 'none' }}
          >
            Upload Document
          </Button>
        </Box>

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
                    <TableCell sx={{ fontWeight: 800 }}>Student Name</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Document Category</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>File Name</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Upload Date</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Compliance Status</TableCell>
                    <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {documents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: 'center', py: 5, color: '#64748B' }}>
                        No compliance documents uploaded yet. Click "Upload Document" to upload credentials.
                      </TableCell>
                    </TableRow>
                  ) : (
                    documents.map((d) => (
                      <TableRow key={d._id} hover>
                        <TableCell sx={{ fontWeight: 800, color: '#0F172A' }}>
                          {d.studentId ? `${d.studentId.fname} ${d.studentId.lname} (Roll #${d.studentId.rollno})` : 'Student'}
                        </TableCell>
                        <TableCell><Chip label={d.documentType} size="small" sx={{ fontWeight: 700, bgcolor: '#EEF2FF', color: '#4338CA' }} /></TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: 13 }}>{d.fileName}</TableCell>
                        <TableCell>{new Date(d.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Chip
                            label={d.status || 'Verified'}
                            size="small"
                            sx={{
                              bgcolor: d.status === 'Rejected' ? '#FEE2E2' : d.status === 'Pending' ? '#FEF3C7' : '#DCFCE7',
                              color: d.status === 'Rejected' ? '#991B1B' : d.status === 'Pending' ? '#92400E' : '#166534',
                              fontWeight: 800
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ textAlign: 'right' }}>
                          {d.status !== 'Verified' && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleVerify(d._id, 'Verified')}
                              sx={{ textTransform: 'none', fontSize: 11, borderColor: '#10B981', color: '#10B981', mr: 1 }}
                            >
                              Approve
                            </Button>
                          )}
                          {d.status !== 'Rejected' && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleVerify(d._id, 'Rejected')}
                              sx={{ textTransform: 'none', fontSize: 11, borderColor: '#EF4444', color: '#EF4444' }}
                            >
                              Reject
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

        {/* Upload Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <form onSubmit={handleUploadDocument}>
            <DialogTitle sx={{ fontWeight: 800 }}>Upload Student Document</DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField select fullWidth label="Select Enrolled Student" required value={formData.studentId} onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}>
                    {students.map(s => <MenuItem key={s._id} value={s._id}>{s.fname} {s.lname} (GR: {s.grno})</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField select fullWidth label="Document Category" value={formData.documentType} onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}>
                    {DOC_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="File Name" required value={formData.fileName} onChange={(e) => setFormData({ ...formData, fileName: e.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth multiline rows={2} label="Verification Notes" value={formData.verificationNotes} onChange={(e) => setFormData({ ...formData, verificationNotes: e.target.value })} />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
              <Button type="submit" variant="contained" sx={{ bgcolor: '#4338CA' }}>Upload & Archive</Button>
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

export default DocumentCompliance;
