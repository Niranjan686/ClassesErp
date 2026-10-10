import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Chip, IconButton,
    Grid, CircularProgress, Alert, Snackbar, Switch, FormControlLabel
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlus, faSearch, faEdit, faTrash, faBookOpen, faClock
} from '@fortawesome/free-solid-svg-icons';
import AdminLayout from '../Common/AdminLayout';
import { PageTransition } from '../Common/MotionWrapper';
import api from '../../api';

const CATEGORIES = [
    'Basic Computer',
    'Accounting & Finance',
    'Programming & IT',
    'Design & Multimedia',
    'Hardware & Networking',
    'Short Term'
];

const CourseMaster = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [openDialog, setOpenDialog] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

    const [formData, setFormData] = useState({
        courseName: '',
        courseCode: '',
        category: 'Basic Computer',
        duration: '3 Months',
        totalFees: '',
        description: '',
        syllabusText: '',
        isActive: true
    });

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const res = await api.get('/courses');
            setCourses(res.data);
        } catch (err) {
            setToast({ open: true, message: 'Failed to load courses', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    const handleOpenAdd = () => {
        setEditingCourse(null);
        setFormData({
            courseName: '',
            courseCode: '',
            category: 'Basic Computer',
            duration: '3 Months',
            totalFees: '',
            description: '',
            syllabusText: '',
            isActive: true
        });
        setOpenDialog(true);
    };

    const handleOpenEdit = (course) => {
        setEditingCourse(course);
        setFormData({
            courseName: course.courseName,
            courseCode: course.courseCode,
            category: course.category || 'Basic Computer',
            duration: course.duration,
            totalFees: course.totalFees,
            description: course.description || '',
            syllabusText: course.syllabus ? course.syllabus.join(', ') : '',
            isActive: course.isActive !== undefined ? course.isActive : true
        });
        setOpenDialog(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                totalFees: Number(formData.totalFees),
                syllabus: formData.syllabusText ? formData.syllabusText.split(',').map(s => s.trim()).filter(Boolean) : []
            };

            if (editingCourse) {
                await api.put(`/courses/${editingCourse._id}`, payload);
                setToast({ open: true, message: 'Course updated successfully!', severity: 'success' });
            } else {
                await api.post('/courses', payload);
                setToast({ open: true, message: 'Course created successfully!', severity: 'success' });
            }
            setOpenDialog(false);
            fetchCourses();
        } catch (err) {
            setToast({ open: true, message: err.response?.data?.message || 'Error saving course', severity: 'error' });
        }
    };

    const handleDelete = async (courseId, courseName) => {
        if (!window.confirm(`Are you sure you want to delete course "${courseName}"?`)) return;
        try {
            await api.delete(`/courses/${courseId}`);
            setToast({ open: true, message: 'Course deleted successfully!', severity: 'success' });
            fetchCourses();
        } catch (err) {
            setToast({ open: true, message: err.response?.data?.message || 'Error deleting course', severity: 'error' });
        }
    };

    const filteredCourses = courses.filter(c => {
        const matchesSearch = c.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.courseCode.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCat = categoryFilter === 'ALL' || c.category === categoryFilter;
        return matchesSearch && matchesCat;
    });

    return (
        <AdminLayout>
            <PageTransition>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                <Box>
                    <Typography variant="h5" fontWeight="900" color="#0f172a">
                        Course Master & Syllabus Curriculum
                    </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Manage certified computer courses, duration, syllabus modules, and fees
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
                        Add New Course
                    </Button>
                </Box>

                {/* Filter and Search Bar */}
                <Paper sx={{ p: 2, mb: 3, borderRadius: '12px', border: '1px solid #e0f2fe' }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Search by course name or code (e.g. MSCIT, Tally)..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                select
                                size="small"
                                label="Category Filter"
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                            >
                                <MenuItem value="ALL">All Categories ({courses.length})</MenuItem>
                                {CATEGORIES.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
                            </TextField>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Course List Table */}
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
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Course Code</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Course Name & Description</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Category</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Duration</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Total Fees</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Batches / Students</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1', textAlign: 'right' }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredCourses.map((course) => (
                                        <TableRow key={course._id} hover>
                                            <TableCell>
                                                <Chip label={course.courseCode} size="small" sx={{ fontWeight: 800, bgcolor: '#e0f2fe', color: '#0284c7' }} />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight="800" color="#0f172a">{course.courseName}</Typography>
                                                <Typography variant="caption" color="textSecondary" sx={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                    {course.description}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={course.category} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight="700">{course.duration}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight="800" color="#0369a1">
                                                    ₹{course.totalFees.toLocaleString()}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption" display="block" fontWeight="700">
                                                    {course.batchCount || 0} Batches • {course.studentCount || 0} Students
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={course.isActive ? 'Active' : 'Inactive'}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: course.isActive ? '#dcfce7' : '#fee2e2',
                                                        color: course.isActive ? '#166534' : '#991b1b',
                                                        fontWeight: 800
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ textAlign: 'right' }}>
                                                <IconButton size="small" onClick={() => handleOpenEdit(course)} sx={{ color: '#0284c7' }}>
                                                    <FontAwesomeIcon icon={faEdit} />
                                                </IconButton>
                                                <IconButton size="small" onClick={() => handleDelete(course._id, course.courseName)} sx={{ color: '#ef4444' }}>
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                )}

                {/* Add / Edit Dialog */}
                <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                    <form onSubmit={handleSubmit}>
                        <DialogTitle sx={{ fontWeight: 800, bgcolor: '#0284c7', color: '#fff' }}>
                            {editingCourse ? 'Edit Course Details' : 'Add New Academic Course'}
                        </DialogTitle>
                        <DialogContent sx={{ p: 3, mt: 1 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={8}>
                                    <TextField
                                        label="Course Name"
                                        fullWidth
                                        required
                                        value={formData.courseName}
                                        onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                                        placeholder="e.g. MS-CIT / Tally Prime / Python"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        label="Course Code"
                                        fullWidth
                                        required
                                        value={formData.courseCode}
                                        onChange={(e) => setFormData({ ...formData, courseCode: e.target.value.toUpperCase() })}
                                        placeholder="e.g. MSCIT"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Category"
                                        select
                                        fullWidth
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        {CATEGORIES.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Duration"
                                        fullWidth
                                        required
                                        value={formData.duration}
                                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Total Fees (₹)"
                                        type="number"
                                        fullWidth
                                        required
                                        value={formData.totalFees}
                                        onChange={(e) => setFormData({ ...formData, totalFees: e.target.value })}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={formData.isActive}
                                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                                color="primary"
                                            />
                                        }
                                        label="Active Course"
                                        sx={{ mt: 1 }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        label="Course Description"
                                        fullWidth
                                        multiline
                                        rows={2}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        label="Syllabus Highlights (comma separated)"
                                        fullWidth
                                        multiline
                                        rows={2}
                                        value={formData.syllabusText}
                                        onChange={(e) => setFormData({ ...formData, syllabusText: e.target.value })}
                                    />
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
                                {editingCourse ? 'Save Changes' : 'Create Course'}
                            </Button>
                        </DialogActions>
                    </form>
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

export default CourseMaster;
