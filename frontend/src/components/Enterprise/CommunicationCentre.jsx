import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, MenuItem, Dialog, DialogTitle, DialogContent,
  DialogActions, Chip, IconButton, Alert, Snackbar, Grid, CircularProgress, Tabs, Tab
} from '@mui/material';
import { Plus, Bell, Send, CheckCircle, Clock, Trash2, Eye } from 'lucide-react';
import AdminLayout from '../Common/AdminLayout';
import { PageTransition } from '../Common/MotionWrapper';
import api from '../../api';

const AUDIENCES = ['All', 'Students', 'Faculty', 'Parents'];

const CommunicationCentre = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [openDialog, setOpenDialog] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    targetAudience: 'All',
    category: 'Circular',
    isMandatoryAck: true
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.get('/announcements');
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setAnnouncements(Array.isArray(list) ? list : []);
    } catch (err) {
      setToast({ open: true, message: 'Failed to load circulars', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await api.post('/announcements', formData);
      setToast({ open: true, message: 'Official circular broadcasted to school community!', severity: 'success' });
      setOpenDialog(false);
      fetchAnnouncements();
    } catch (err) {
      setToast({ open: true, message: err.response?.data?.message || 'Error publishing notice', severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this circular announcement?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      setToast({ open: true, message: 'Notice deleted', severity: 'success' });
      fetchAnnouncements();
    } catch (err) {
      setToast({ open: true, message: 'Failed to delete notice', severity: 'error' });
    }
  };

  return (
    <AdminLayout>
      <PageTransition>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h5" fontWeight="900" color="#0f172a">
              Communication Centre & Digital Circulars
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Broadcast mandatory institutional circulars, track parent/student digital acknowledgements and read receipts
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Plus className="w-4 h-4" />}
            onClick={() => setOpenDialog(true)}
            sx={{ bgcolor: '#4338CA', '&:hover': { bgcolor: '#3730A3' }, fontWeight: 700, textTransform: 'none' }}
          >
            Broadcast Circular
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
                    <TableCell sx={{ fontWeight: 800 }}>Circular Tracking No</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Title / Subject</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Target Group</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Published On</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Acknowledgement Type</TableCell>
                    <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {announcements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: 'center', py: 5, color: '#64748B' }}>
                        No circulars issued yet. Click "Broadcast Circular" to issue notices.
                      </TableCell>
                    </TableRow>
                  ) : (
                    announcements.map((a) => (
                      <TableRow key={a._id} hover>
                        <TableCell sx={{ fontWeight: 800, color: '#4338CA' }}>
                          {a.trackingNo || `CIRC-2026-${a._id.slice(-4).toUpperCase()}`}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, color: '#0F172A' }}>{a.title}</TableCell>
                        <TableCell><Chip label={a.targetAudience || 'All'} size="small" sx={{ fontWeight: 700 }} /></TableCell>
                        <TableCell>{new Date(a.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {a.isMandatoryAck ? (
                            <Chip label="Mandatory Signature" size="small" sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 800 }} />
                          ) : (
                            <Chip label="Information Notice" size="small" sx={{ bgcolor: '#DCFCE7', color: '#166534', fontWeight: 800 }} />
                          )}
                        </TableCell>
                        <TableCell sx={{ textAlign: 'right' }}>
                          <IconButton size="small" onClick={() => setPreviewItem(a)} sx={{ color: '#4338CA', mr: 1 }}>
                            <Eye className="w-4 h-4" />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDelete(a._id)} sx={{ color: '#EF4444' }}>
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

        {/* Broadcast Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <form onSubmit={handleCreateAnnouncement}>
            <DialogTitle sx={{ fontWeight: 800 }}>Broadcast Institutional Circular</DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth label="Notice Subject / Headline" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Schedule for Annual Sports Meet 2026" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField select fullWidth label="Target Audience" value={formData.targetAudience} onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}>
                    {AUDIENCES.map(aud => <MenuItem key={aud} value={aud}>{aud}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField select fullWidth label="Category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                    <MenuItem value="Circular">Administrative Circular</MenuItem>
                    <MenuItem value="Exam">Examination Notification</MenuItem>
                    <MenuItem value="Urgent">Emergency Alert</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth multiline rows={4} label="Detailed Circular Message" required value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
              <Button type="submit" variant="contained" sx={{ bgcolor: '#4338CA' }}>Broadcast Now</Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* View Circular Details Modal */}
        <Dialog open={!!previewItem} onClose={() => setPreviewItem(null)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 800 }}>{previewItem?.title}</DialogTitle>
          <DialogContent dividers>
            <Typography variant="caption" color="textSecondary" display="block" mb={1}>
              Published on: {previewItem && new Date(previewItem.createdAt).toLocaleString()} · Audience: {previewItem?.targetAudience}
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
              {previewItem?.message}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setPreviewItem(null)}>Close</Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast({ ...toast, open: false })}>
          <Alert severity={toast.severity} onClose={() => setToast({ ...toast, open: false })}>{toast.message}</Alert>
        </Snackbar>
      </PageTransition>
    </AdminLayout>
  );
};

export default CommunicationCentre;
