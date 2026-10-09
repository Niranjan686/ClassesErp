import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
    Grid, CircularProgress, Alert, Snackbar, Tooltip, IconButton
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEnvelopeOpenText, faCheck, faTimes, faRotateRight, faUserGraduate, faChalkboardUser, faFilter
} from '@fortawesome/free-solid-svg-icons';
import AdminLayout from '../Common/AdminLayout';
import api from '../../api';

const LeaveManagement = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [typeFilter, setTypeFilter] = useState('ALL');

    // Review Dialog
    const [reviewDialog, setReviewDialog] = useState({ open: false, leave: null, action: 'Approved' });
    const [adminRemarks, setAdminRemarks] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

    const fetchLeaves = async () => {
        try {
            setLoading(true);
            let url = '/leaves?';
            if (statusFilter !== 'ALL') url += `status=${statusFilter}&`;
            if (typeFilter !== 'ALL') url += `applicantType=${typeFilter}&`;

            const res = await api.get(url);
            setLeaves(res.data);
        } catch (err) {
            setToast({ open: true, message: 'Failed to load leave applications', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaves();
    }, [statusFilter, typeFilter]);

    const handleOpenReview = (leave, action) => {
        setReviewDialog({ open: true, leave, action });
        setAdminRemarks(action === 'Approved' ? 'Leave Approved. Please complete missed lab hours later.' : 'Unable to approve due to scheduled examinations.');
    };

    const handleConfirmReview = async () => {
        if (!reviewDialog.leave) return;
        try {
            setSubmitting(true);
            await api.put(`/leaves/${reviewDialog.leave._id}/status`, {
                status: reviewDialog.action,
                adminRemarks,
                reviewedBy: 'Center Admin'
            });

            setToast({ open: true, message: `Leave request marked as ${reviewDialog.action}!`, severity: 'success' });
            setReviewDialog({ open: false, leave: null, action: 'Approved' });
            fetchLeaves();
        } catch (err) {
            setToast({ open: true, message: 'Failed to update leave status', severity: 'error' });
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
                        Leave Approvals & Records
                    </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Review and approve leave applications from students and faculty instructors
                        </Typography>
                    </Box>

                    <Button
                        variant="outlined"
                        startIcon={<FontAwesomeIcon icon={faRotateRight} />}
                        onClick={fetchLeaves}
                        sx={{ borderColor: '#0284c7', color: '#0284c7', fontWeight: 800, textTransform: 'none' }}
                    >
                        Refresh List
                    </Button>
                </Box>

                {/* Filters */}
                <Paper sx={{ p: 2, mb: 3, borderRadius: '12px', border: '1px solid #e0f2fe' }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Filter by Status"
                                select
                                fullWidth
                                size="small"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <MenuItem value="ALL">All Statuses ({leaves.length})</MenuItem>
                                <MenuItem value="Pending">Pending Approvals</MenuItem>
                                <MenuItem value="Approved">Approved Leaves</MenuItem>
                                <MenuItem value="Rejected">Rejected Applications</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Applicant Type"
                                select
                                fullWidth
                                size="small"
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                            >
                                <MenuItem value="ALL">All Applicants</MenuItem>
                                <MenuItem value="Student">Students Only</MenuItem>
                                <MenuItem value="Staff">Faculty / Staff Only</MenuItem>
                            </TextField>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Leaves Table */}
                {loading ? (
                    <Box display="flex" justifyContent="center" py={6}>
                        <CircularProgress sx={{ color: '#0284c7' }} />
                    </Box>
                ) : leaves.length === 0 ? (
                    <Paper sx={{ p: 5, textAlign: 'center', borderRadius: '12px', border: '1px solid #e0f2fe' }}>
                        <Typography color="textSecondary">No leave applications found matching your criteria.</Typography>
                    </Paper>
                ) : (
                    <Paper sx={{ borderRadius: '14px', border: '1px solid #e0f2fe', overflow: 'hidden' }}>
                        <TableContainer>
                            <Table>
                                <TableHead sx={{ backgroundColor: '#f0f9ff' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Applicant</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Role</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Leave Type</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Dates & Duration</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Reason</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1', textAlign: 'right' }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {leaves.map((lv) => (
                                        <TableRow key={lv._id} hover>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight="800" color="#0f172a">
                                                    {lv.applicantName}
                                                </Typography>
                                                {lv.identifier && (
                                                    <Typography variant="caption" color="textSecondary">
                                                        ID: {lv.identifier}
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    icon={<FontAwesomeIcon icon={lv.applicantType === 'Student' ? faUserGraduate : faChalkboardUser} style={{ fontSize: '11px' }} />}
                                                    label={lv.applicantType}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: lv.applicantType === 'Student' ? '#e0f2fe' : '#fef3c7',
                                                        color: lv.applicantType === 'Student' ? '#0369a1' : '#b45309',
                                                        fontWeight: 800
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight="600">{lv.leaveType}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight="700">
                                                    {lv.startDate} to {lv.endDate}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    {lv.totalDays || 1} Day(s)
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ maxWidth: 220 }}>
                                                <Typography variant="body2" color="textSecondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                    {lv.reason}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={lv.status}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: lv.status === 'Approved' ? '#dcfce7' : lv.status === 'Rejected' ? '#fee2e2' : '#fef3c7',
                                                        color: lv.status === 'Approved' ? '#166534' : lv.status === 'Rejected' ? '#991b1b' : '#92400e',
                                                        fontWeight: 800
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ textAlign: 'right' }}>
                                                {lv.status === 'Pending' ? (
                                                    <Box display="flex" justifyContent="flex-end" gap={1}>
                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            startIcon={<FontAwesomeIcon icon={faCheck} />}
                                                            onClick={() => handleOpenReview(lv, 'Approved')}
                                                            sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, textTransform: 'none', fontWeight: 700 }}
                                                        >
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            startIcon={<FontAwesomeIcon icon={faTimes} />}
                                                            onClick={() => handleOpenReview(lv, 'Rejected')}
                                                            sx={{ borderColor: '#ef4444', color: '#ef4444', textTransform: 'none', fontWeight: 700 }}
                                                        >
                                                            Reject
                                                        </Button>
                                                    </Box>
                                                ) : (
                                                    <Typography variant="caption" color="textSecondary">
                                                        Reviewed
                                                    </Typography>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                )}

                {/* Review Remarks Modal */}
                <Dialog open={reviewDialog.open} onClose={() => setReviewDialog({ ...reviewDialog, open: false })} maxWidth="xs" fullWidth>
                    <DialogTitle sx={{ fontWeight: 800, bgcolor: reviewDialog.action === 'Approved' ? '#059669' : '#dc2626', color: '#fff' }}>
                        {reviewDialog.action === 'Approved' ? 'Approve Leave Request' : 'Reject Leave Request'}
                    </DialogTitle>
                    <DialogContent sx={{ p: 2.5, mt: 1 }}>
                        <Typography variant="body2" color="textSecondary" mb={2}>
                            Applicant: <strong>{reviewDialog.leave?.applicantName}</strong> ({reviewDialog.leave?.startDate} to {reviewDialog.leave?.endDate})
                        </Typography>
                        <TextField
                            label="Admin Remarks / Message"
                            multiline
                            rows={3}
                            fullWidth
                            value={adminRemarks}
                            onChange={(e) => setAdminRemarks(e.target.value)}
                        />
                    </DialogContent>
                    <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0' }}>
                        <Button onClick={() => setReviewDialog({ ...reviewDialog, open: false })}>Cancel</Button>
                        <Button
                            variant="contained"
                            disabled={submitting}
                            onClick={handleConfirmReview}
                            sx={{
                                bgcolor: reviewDialog.action === 'Approved' ? '#059669' : '#dc2626',
                                fontWeight: 800
                            }}
                        >
                            {submitting ? 'Updating...' : `Confirm ${reviewDialog.action}`}
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

export default LeaveManagement;
