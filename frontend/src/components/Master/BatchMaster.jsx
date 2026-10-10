import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Chip, IconButton,
    Grid, CircularProgress, Alert, Snackbar, LinearProgress, Tooltip
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlus, faSearch, faEdit, faTrash, faCalendarDays, faUsers, faClock, faBuilding, faCalendarCheck
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../Common/AdminLayout';
import { PageTransition } from '../Common/MotionWrapper';
import api from '../../api';

const DAY_OPTIONS = [
    'Daily (Mon-Sat)',
    'Mon-Wed-Fri (MWF)',
    'Tue-Thu-Sat (TTS)',
    'Weekend (Sat-Sun)',
    'Sunday Only'
];

const STATUS_OPTIONS = ['Active', 'Upcoming', 'Completed', 'Paused'];

const BatchMaster = () => {
    const navigate = useNavigate();
    const [batches, setBatches] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [courseFilter, setCourseFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // Dialogs
    const [openDialog, setOpenDialog] = useState(false);
    const [editingBatch, setEditingBatch] = useState(null);
    const [rosterDialog, setRosterDialog] = useState({ open: false, batch: null, students: [] });
    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

    // Form state
    const [formData, setFormData] = useState({
        batchName: '',
        batchCode: '',
        courseId: '',
        timing: '08:00 AM - 09:30 AM',
        days: 'Daily (Mon-Sat)',
        instructor: 'Prof. Ramesh Sharma',
        maxCapacity: 20,
        roomNo: 'Lab 1',
        status: 'Active'
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [batchRes, courseRes] = await Promise.all([
                api.get('/batches'),
                api.get('/courses')
            ]);
            setBatches(batchRes.data);
            setCourses(courseRes.data);
        } catch (err) {
            setToast({ open: true, message: 'Failed to load batch data', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenAdd = () => {
        setEditingBatch(null);
        setFormData({
            batchName: '',
            batchCode: `KCC-B${batches.length + 1}`,
            courseId: courses[0]?._id || '',
            timing: '08:00 AM - 09:30 AM',
            days: 'Daily (Mon-Sat)',
            instructor: 'Faculty Member',
            maxCapacity: 20,
            roomNo: 'Lab 1',
            status: 'Active'
        });
        setOpenDialog(true);
    };

    const handleOpenEdit = (batch) => {
        setEditingBatch(batch);
        setFormData({
            batchName: batch.batchName,
            batchCode: batch.batchCode,
            courseId: batch.courseId?._id || batch.courseId || '',
            timing: batch.timing,
            days: batch.days || 'Daily (Mon-Sat)',
            instructor: batch.instructor || '',
            maxCapacity: batch.maxCapacity || 20,
            roomNo: batch.roomNo || 'Lab 1',
            status: batch.status || 'Active'
        });
        setOpenDialog(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                maxCapacity: Number(formData.maxCapacity)
            };

            if (editingBatch) {
                await api.put(`/batches/${editingBatch._id}`, payload);
                setToast({ open: true, message: 'Batch updated successfully!', severity: 'success' });
            } else {
                await api.post('/batches', payload);
                setToast({ open: true, message: 'Batch created successfully!', severity: 'success' });
            }
            setOpenDialog(false);
            fetchData();
        } catch (err) {
            setToast({ open: true, message: err.response?.data?.message || 'Error saving batch', severity: 'error' });
        }
    };

    const handleDelete = async (batchId, batchName) => {
        if (!window.confirm(`Are you sure you want to delete batch "${batchName}"?`)) return;
        try {
            await api.delete(`/batches/${batchId}`);
            setToast({ open: true, message: 'Batch deleted successfully!', severity: 'success' });
            fetchData();
        } catch (err) {
            setToast({ open: true, message: err.response?.data?.message || 'Error deleting batch', severity: 'error' });
        }
    };

    const handleViewRoster = async (batch) => {
        try {
            const res = await api.get(`/batches/${batch._id}/students`);
            setRosterDialog({ open: true, batch, students: res.data });
        } catch (err) {
            setToast({ open: true, message: 'Failed to load batch students', severity: 'error' });
        }
    };

    const filteredBatches = batches.filter(b => {
        const matchesSearch = b.batchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.batchCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (b.instructor && b.instructor.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const courseIdStr = b.courseId?._id || b.courseId;
        const matchesCourse = courseFilter === 'ALL' || courseIdStr === courseFilter;
        const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
        return matchesSearch && matchesCourse && matchesStatus;
    });

    return (
        <AdminLayout>
            <PageTransition>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                <Box>
                    <Typography variant="h5" fontWeight="900" color="#0f172a">
                        Batch Master & Timetable
                    </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Schedule classroom slots, allocate labs, instructors, and monitor live seat capacities
                        </Typography>
                    </Box>

                    <Button
                        variant="contained"
                        startIcon={<FontAwesomeIcon icon={faPlus} />}
                        onClick={handleOpenAdd}
                        sx={{
                            backgroundColor: '#0284c7',
                            '&:hover': { backgroundColor: '#0369a1' },
                            fontWeight: 800,
                            textTransform: 'none',
                            px: 2.5,
                            borderRadius: '10px'
                        }}
                    >
                        Create New Batch
                    </Button>
                </Box>

                {/* Filters */}
                <Paper sx={{ p: 2, mb: 3, borderRadius: '12px', border: '1px solid #e0f2fe' }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Search by batch name, code, instructor..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <TextField
                                fullWidth
                                select
                                size="small"
                                label="Course"
                                value={courseFilter}
                                onChange={(e) => setCourseFilter(e.target.value)}
                            >
                                <MenuItem value="ALL">All Courses ({courses.length})</MenuItem>
                                {courses.map(c => (
                                    <MenuItem key={c._id} value={c._id}>{c.courseName}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <TextField
                                fullWidth
                                select
                                size="small"
                                label="Status"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <MenuItem value="ALL">All Statuses</MenuItem>
                                {STATUS_OPTIONS.map(st => <MenuItem key={st} value={st}>{st}</MenuItem>)}
                            </TextField>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Batches Table */}
                {loading ? (
                    <Box display="flex" justifyContent="center" py={6}>
                        <CircularProgress sx={{ color: '#0284c7' }} />
                    </Box>
                ) : (
                    <Paper sx={{ borderRadius: '14px', border: '1px solid #e0f2fe', overflow: 'hidden' }}>
                        <TableContainer>
                            <Table>
                                <TableHead sx={{ backgroundColor: '#f0f9ff' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Batch Code</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Batch Name & Course</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Timing & Days</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Instructor & Lab</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Occupancy</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1', textAlign: 'right' }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredBatches.map((batch) => {
                                        const enrolled = batch.enrolledCount || 0;
                                        const capacity = batch.maxCapacity || 20;
                                        const percentage = Math.min(100, Math.round((enrolled / capacity) * 100));

                                        return (
                                            <TableRow key={batch._id} hover>
                                                <TableCell>
                                                    <Chip label={batch.batchCode} size="small" sx={{ fontWeight: 800, bgcolor: '#e0f2fe', color: '#0284c7' }} />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="800" color="#0f172a">{batch.batchName}</Typography>
                                                    <Typography variant="caption" color="textSecondary">{batch.courseId?.courseName}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="700">{batch.timing}</Typography>
                                                    <Typography variant="caption" color="textSecondary">{batch.days}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="600">{batch.instructor}</Typography>
                                                    <Chip label={batch.roomNo} size="small" variant="outlined" sx={{ fontSize: '10px', height: '20px' }} />
                                                </TableCell>
                                                <TableCell sx={{ minWidth: 130 }}>
                                                    <Typography variant="caption" fontWeight="800">
                                                        {enrolled} / {capacity} Enrolled
                                                    </Typography>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={percentage}
                                                        sx={{ height: 6, borderRadius: 3, mt: 0.5, bgcolor: '#e0f2fe' }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={batch.status}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: batch.status === 'Active' ? '#dcfce7' : '#f1f5f9',
                                                            color: batch.status === 'Active' ? '#166534' : '#64748b',
                                                            fontWeight: 800
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ textAlign: 'right' }}>
                                                    <Tooltip title="Super Attendance">
                                                        <IconButton size="small" onClick={() => navigate(`/attendance-entry?batchId=${batch._id}`)} sx={{ color: '#0284c7', mr: 0.5 }}>
                                                            <FontAwesomeIcon icon={faCalendarCheck} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="View Enrolled Students">
                                                        <IconButton size="small" onClick={() => handleViewRoster(batch)} sx={{ color: '#0ea5e9', mr: 0.5 }}>
                                                            <FontAwesomeIcon icon={faUsers} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Edit Batch">
                                                        <IconButton size="small" onClick={() => handleOpenEdit(batch)} sx={{ color: '#0369a1', mr: 0.5 }}>
                                                            <FontAwesomeIcon icon={faEdit} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete Batch">
                                                        <IconButton size="small" onClick={() => handleDelete(batch._id, batch.batchName)} sx={{ color: '#ef4444' }}>
                                                            <FontAwesomeIcon icon={faTrash} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                )}

                {/* Add / Edit Dialog */}
                <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                    <form onSubmit={handleSubmit}>
                        <DialogTitle sx={{ fontWeight: 800, bgcolor: '#0284c7', color: '#fff' }}>
                            {editingBatch ? 'Edit Batch Schedule' : 'Create New Batch'}
                        </DialogTitle>
                        <DialogContent sx={{ p: 3, mt: 1 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={8}>
                                    <TextField
                                        label="Batch Name"
                                        fullWidth
                                        required
                                        value={formData.batchName}
                                        onChange={(e) => setFormData({ ...formData, batchName: e.target.value })}
                                        placeholder="e.g. MS-CIT Morning Regular"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        label="Batch Code"
                                        fullWidth
                                        required
                                        value={formData.batchCode}
                                        onChange={(e) => setFormData({ ...formData, batchCode: e.target.value.toUpperCase() })}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        label="Assign Course"
                                        select
                                        fullWidth
                                        required
                                        value={formData.courseId}
                                        onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                                    >
                                        {courses.map(c => (
                                            <MenuItem key={c._id} value={c._id}>
                                                {c.courseName} ({c.courseCode})
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Timing Slot"
                                        fullWidth
                                        required
                                        value={formData.timing}
                                        onChange={(e) => setFormData({ ...formData, timing: e.target.value })}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Days Schedule"
                                        select
                                        fullWidth
                                        value={formData.days}
                                        onChange={(e) => setFormData({ ...formData, days: e.target.value })}
                                    >
                                        {DAY_OPTIONS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Instructor / Faculty"
                                        fullWidth
                                        value={formData.instructor}
                                        onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Room / Lab No"
                                        fullWidth
                                        value={formData.roomNo}
                                        onChange={(e) => setFormData({ ...formData, roomNo: e.target.value })}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Max Student Capacity"
                                        type="number"
                                        fullWidth
                                        required
                                        value={formData.maxCapacity}
                                        onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Batch Status"
                                        select
                                        fullWidth
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        {STATUS_OPTIONS.map(st => <MenuItem key={st} value={st}>{st}</MenuItem>)}
                                    </TextField>
                                </Grid>
                            </Grid>
                        </DialogContent>
                        <DialogActions sx={{ p: 2.5, borderTop: '1px solid #e0f2fe' }}>
                            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                            <Button
                                type="submit"
                                variant="contained"
                                sx={{ bgcolor: '#0284c7', '&:hover': { bgcolor: '#0369a1' }, fontWeight: 800 }}
                            >
                                {editingBatch ? 'Save Changes' : 'Create Batch'}
                            </Button>
                        </DialogActions>
                    </form>
                </Dialog>

                {/* Enrolled Students Roster Modal */}
                <Dialog open={rosterDialog.open} onClose={() => setRosterDialog({ open: false, batch: null, students: [] })} maxWidth="md" fullWidth>
                    <DialogTitle sx={{ fontWeight: 800, bgcolor: '#0284c7', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Enrolled Students in {rosterDialog.batch?.batchName}</span>
                        <Chip label={`${rosterDialog.students.length} Students`} sx={{ bgcolor: '#ffffff', color: '#0284c7', fontWeight: 800 }} />
                    </DialogTitle>
                    <DialogContent sx={{ p: 2.5 }}>
                        {rosterDialog.students.length === 0 ? (
                            <Typography sx={{ py: 3, textAlign: 'center', color: '#64748b' }}>No students assigned yet.</Typography>
                        ) : (
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead sx={{ backgroundColor: '#f0f9ff' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 800 }}>Roll No</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>GR No</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Student Name</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Mobile No</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Fee Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {rosterDialog.students.map((st) => (
                                            <TableRow key={st._id} hover>
                                                <TableCell sx={{ fontWeight: 800 }}>#{st.rollno}</TableCell>
                                                <TableCell>{st.grno}</TableCell>
                                                <TableCell sx={{ fontWeight: 800 }}>{st.fname} {st.lname}</TableCell>
                                                <TableCell>{st.mobileNo}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={st.balanceFees === 0 ? 'Fully Paid' : `Bal: ₹${st.balanceFees}`}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: st.balanceFees === 0 ? '#dcfce7' : '#fee2e2',
                                                            color: st.balanceFees === 0 ? '#166534' : '#991b1b',
                                                            fontWeight: 800
                                                        }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setRosterDialog({ open: false, batch: null, students: [] })}>Close</Button>
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
            </PageTransition>
        </AdminLayout>
    );
};

export default BatchMaster;
