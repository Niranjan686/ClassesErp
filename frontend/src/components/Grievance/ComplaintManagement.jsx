import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
    Grid, CircularProgress, Alert, Snackbar, Tooltip, IconButton
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faComments, faPaperPlane, faCheckCircle, faRotateRight, faCircleExclamation
} from '@fortawesome/free-solid-svg-icons';
import AdminLayout from '../Common/AdminLayout';
import api from '../../api';

const ComplaintManagement = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('ALL');

    // Response Dialog
    const [replyDialog, setReplyDialog] = useState({ open: false, complaint: null });
    const [adminResponse, setAdminResponse] = useState('');
    const [resolutionStatus, setResolutionStatus] = useState('Resolved');
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

    const fetchComplaints = async () => {
        try {
            setLoading(true);
            let url = '/complaints?';
            if (statusFilter !== 'ALL') url += `status=${statusFilter}&`;
            const res = await api.get(url);
            setComplaints(res.data);
        } catch (err) {
            setToast({ open: true, message: 'Failed to load grievances', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, [statusFilter]);

    const handleOpenReply = (complaint) => {
        setReplyDialog({ open: true, complaint });
        setAdminResponse(complaint.adminResponse || 'Thank you for bringing this to our attention. The center lab supervisor has resolved the issue.');
        setResolutionStatus('Resolved');
    };

    const handleSendResponse = async () => {
        if (!replyDialog.complaint) return;
        try {
            setSubmitting(true);
            await api.put(`/complaints/${replyDialog.complaint._id}/resolve`, {
                status: resolutionStatus,
                adminResponse,
                resolvedBy: 'Center Head'
            });

            setToast({ open: true, message: 'Grievance response sent to student portal!', severity: 'success' });
            setReplyDialog({ open: false, complaint: null });
            fetchComplaints();
        } catch (err) {
            setToast({ open: true, message: 'Failed to save grievance response', severity: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AdminLayout>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                <Box>
                    <Typography variant="h5" fontWeight="900" color="#0f172a">
                        Student Grievance & Feedback Helpdesk
                    </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Investigate student issue tickets regarding labs, teaching, software, fees, and scheduling
                        </Typography>
                    </Box>

                    <Button
                        variant="outlined"
                        startIcon={<FontAwesomeIcon icon={faRotateRight} />}
                        onClick={fetchComplaints}
                        sx={{ borderColor: '#0284c7', color: '#0284c7', fontWeight: 800, textTransform: 'none' }}
                    >
                        Refresh Tickets
                    </Button>
                </Box>

                {/* Filter */}
                <Paper sx={{ p: 2, mb: 3, borderRadius: '12px', border: '1px solid #e0f2fe' }}>
                    <TextField
                        label="Filter by Status"
                        select
                        size="small"
                        sx={{ minWidth: 220 }}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <MenuItem value="ALL">All Grievances ({complaints.length})</MenuItem>
                        <MenuItem value="Open">Open Tickets</MenuItem>
                        <MenuItem value="In Progress">In Progress</MenuItem>
                        <MenuItem value="Resolved">Resolved Issues</MenuItem>
                    </TextField>
                </Paper>

                {/* Complaints Table */}
                {loading ? (
                    <Box display="flex" justifyContent="center" py={6}>
                        <CircularProgress sx={{ color: '#0284c7' }} />
                    </Box>
                ) : complaints.length === 0 ? (
                    <Paper sx={{ p: 5, textAlign: 'center', borderRadius: '12px', border: '1px solid #e0f2fe' }}>
                        <Typography color="textSecondary">No grievance tickets found.</Typography>
                    </Paper>
                ) : (
                    <Paper sx={{ borderRadius: '14px', border: '1px solid #e0f2fe', overflow: 'hidden' }}>
                        <TableContainer>
                            <Table>
                                <TableHead sx={{ backgroundColor: '#f0f9ff' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Student</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Category</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Subject & Description</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Priority</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1', textAlign: 'right' }}>Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {complaints.map((cp) => (
                                        <TableRow key={cp._id} hover>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight="800" color="#0f172a">
                                                    {cp.studentName}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    GR: {cp.grno}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={cp.category} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                                            </TableCell>
                                            <TableCell sx={{ maxWidth: 300 }}>
                                                <Typography variant="body2" fontWeight="700" color="#0f172a">
                                                    {cp.subject}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                    {cp.description}
                                                </Typography>
                                                {cp.adminResponse && (
                                                    <Box sx={{ mt: 0.8, p: 1, bgcolor: '#f0fdf4', borderRadius: '6px' }}>
                                                        <Typography variant="caption" color="#166534" fontWeight="700">
                                                            Response: "{cp.adminResponse}"
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={cp.priority}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: cp.priority === 'High' || cp.priority === 'Urgent' ? '#fee2e2' : '#fef3c7',
                                                        color: cp.priority === 'High' || cp.priority === 'Urgent' ? '#991b1b' : '#92400e',
                                                        fontWeight: 800
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={cp.status}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: cp.status === 'Resolved' ? '#dcfce7' : cp.status === 'In Progress' ? '#fef3c7' : '#eff6ff',
                                                        color: cp.status === 'Resolved' ? '#166534' : cp.status === 'In Progress' ? '#92400e' : '#1e40af',
                                                        fontWeight: 800
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ textAlign: 'right' }}>
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    onClick={() => handleOpenReply(cp)}
                                                    sx={{ bgcolor: '#0284c7', '&:hover': { bgcolor: '#0369a1' }, textTransform: 'none', fontWeight: 700 }}
                                                >
                                                    {cp.status === 'Resolved' ? 'View / Edit Reply' : 'Resolve & Reply'}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                )}

                {/* Reply / Resolution Modal */}
                <Dialog open={replyDialog.open} onClose={() => setReplyDialog({ ...replyDialog, open: false })} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ fontWeight: 800, bgcolor: '#0284c7', color: '#fff' }}>
                        Respond to Student Grievance
                    </DialogTitle>
                    <DialogContent sx={{ p: 2.5, mt: 1 }}>
                        <Typography variant="subtitle2" fontWeight="800" color="#0f172a" mb={0.5}>
                            Ticket: {replyDialog.complaint?.subject}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" mb={2}>
                            Student: {replyDialog.complaint?.studentName} ({replyDialog.complaint?.grno})
                        </Typography>

                        <TextField
                            label="Resolution Status"
                            select
                            fullWidth
                            size="small"
                            value={resolutionStatus}
                            onChange={(e) => setResolutionStatus(e.target.value)}
                            sx={{ mb: 2 }}
                        >
                            <MenuItem value="In Progress">In Progress (Investigating)</MenuItem>
                            <MenuItem value="Resolved">Resolved (Completed)</MenuItem>
                            <MenuItem value="Closed">Closed</MenuItem>
                        </TextField>

                        <TextField
                            label="Administrator Response (Visible to Student)"
                            multiline
                            rows={3}
                            fullWidth
                            value={adminResponse}
                            onChange={(e) => setAdminResponse(e.target.value)}
                        />
                    </DialogContent>
                    <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0' }}>
                        <Button onClick={() => setReplyDialog({ ...replyDialog, open: false })}>Cancel</Button>
                        <Button
                            variant="contained"
                            disabled={submitting}
                            onClick={handleSendResponse}
                            sx={{ bgcolor: '#0284c7', fontWeight: 800 }}
                        >
                            {submitting ? 'Sending...' : 'Send Response'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Toast Notification */}
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

export default ComplaintManagement;
