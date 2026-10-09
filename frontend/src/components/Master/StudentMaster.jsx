import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Chip, IconButton,
    InputAdornment, Grid, CircularProgress, Alert, Snackbar, Avatar, Tooltip, Tabs, Tab
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlus, faSearch, faEdit, faTrash, faIdCard, faPhone, faEnvelope,
    faCalendarCheck, faMoneyBillWave, faPrint, faUserGraduate, faQrcode,
    faPaperPlane, faCircleCheck
} from '@fortawesome/free-solid-svg-icons';
import AdminLayout from '../Common/AdminLayout';
import api from '../../api';

const StudentMaster = () => {
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [courseFilter, setCourseFilter] = useState('ALL');
    const [batchFilter, setBatchFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // Modals
    const [openDialog, setOpenDialog] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [idCardStudent, setIdCardStudent] = useState(null);
    const [admissionSuccessModal, setAdmissionSuccessModal] = useState(null);
    const [activeTab, setActiveTab] = useState(0);
    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

    // Form state
    const [formData, setFormData] = useState({
        grno: '',
        rollno: '',
        fname: '',
        mname: '',
        lname: '',
        dob: '2004-01-01',
        gender: 'Male',
        mobileNo: '',
        email: '',
        address: '',
        adharno: '',
        fatherName: '',
        fatherMobileNo: '',
        motherMobileNo: '',
        courseId: '',
        batchId: '',
        academicYear: '2024-2025',
        totalFees: 0,
        paidFees: 0,
        balanceFees: 0,
        rfid: '',
        status: 'Active'
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [studentRes, courseRes, batchRes] = await Promise.all([
                api.get('/students'),
                api.get('/courses'),
                api.get('/batches')
            ]);
            setStudents(studentRes.data?.data || studentRes.data || []);
            setCourses(courseRes.data?.data || courseRes.data || []);
            setBatches(batchRes.data?.data || batchRes.data || []);
        } catch (err) {
            setToast({ open: true, message: 'Failed to load student directory', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCourseChange = (selectedCourseId) => {
        const selCourse = courses.find(c => c._id === selectedCourseId);
        const fees = selCourse ? selCourse.totalFees : 0;
        setFormData(prev => ({
            ...prev,
            courseId: selectedCourseId,
            totalFees: fees,
            balanceFees: Math.max(0, fees - Number(prev.paidFees || 0))
        }));
    };

    const handlePaidFeesChange = (paid) => {
        const paidNum = Number(paid) || 0;
        setFormData(prev => ({
            ...prev,
            paidFees: paidNum,
            balanceFees: Math.max(0, Number(prev.totalFees || 0) - paidNum)
        }));
    };

    const handleOpenAdd = async () => {
        setEditingStudent(null);
        setActiveTab(0);

        let nextGr = 'K001-GR-0001';
        let nextStuId = 'K001-2026-0001';
        try {
            const grRes = await api.get('/students/next-id');
            if (grRes.data?.studentId) nextStuId = grRes.data.studentId;
            if (grRes.data?.nextGrno) nextGr = grRes.data.nextGrno;
        } catch (e) {
            console.error(e);
        }

        const defaultCourse = courses[0];
        const defaultBatch = batches.find(b => b.courseId?._id === defaultCourse?._id || b.courseId === defaultCourse?._id) || batches[0];

        setFormData({
            studentId: nextStuId,
            grno: nextGr,
            rollno: students.length + 1,
            fname: '',
            mname: '',
            lname: '',
            dob: '2008-01-01',
            gender: 'Male',
            mobileNo: '',
            email: '',
            address: '',
            adharno: '',
            fatherName: '',
            fatherMobileNo: '',
            motherMobileNo: '',
            courseId: defaultCourse?._id || '',
            batchId: defaultBatch?._id || '',
            academicYear: '2026-2027',
            totalFees: defaultCourse ? defaultCourse.totalFees : 0,
            paidFees: 0,
            balanceFees: defaultCourse ? defaultCourse.totalFees : 0,
            rfid: `RFID-${1000 + students.length + 1}`,
            status: 'Active'
        });
        setOpenDialog(true);
    };

    const handleOpenEdit = (st) => {
        setEditingStudent(st);
        setActiveTab(0);
        setFormData({
            grno: st.grno,
            rollno: st.rollno,
            fname: st.fname,
            mname: st.mname || '',
            lname: st.lname,
            dob: st.dob ? st.dob.split('T')[0] : '2004-01-01',
            gender: st.gender || 'Male',
            mobileNo: st.mobileNo,
            email: st.email || '',
            address: st.address || '',
            adharno: st.adharno || '',
            fatherName: st.fatherName || '',
            fatherMobileNo: st.fatherMobileNo || '',
            motherMobileNo: st.motherMobileNo || '',
            courseId: st.courseId?._id || st.courseId || '',
            batchId: st.batchId?._id || st.batchId || '',
            academicYear: st.academicYear || '2024-2025',
            totalFees: st.totalFees || 0,
            paidFees: st.paidFees || 0,
            balanceFees: st.balanceFees || 0,
            rfid: st.rfid || '',
            status: st.status || 'Active'
        });
        setOpenDialog(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                rollno: Number(formData.rollno),
                totalFees: Number(formData.totalFees),
                paidFees: Number(formData.paidFees),
                balanceFees: Math.max(0, Number(formData.totalFees) - Number(formData.paidFees))
            };

            if (editingStudent) {
                await api.put(`/students/${editingStudent._id}`, payload);
                setToast({ open: true, message: 'Student details updated!', severity: 'success' });
            } else {
                const res = await api.post('/students', payload);
                setAdmissionSuccessModal({
                    studentName: `${payload.fname} ${payload.lname}`,
                    grno: payload.grno,
                    email: payload.email,
                    mobileNo: payload.mobileNo,
                    username: res.data.loginCredentials?.username || payload.grno,
                    password: res.data.loginCredentials?.temporaryPassword || payload.mobileNo
                });
                setToast({ open: true, message: res.data.message, severity: 'success' });
            }
            setOpenDialog(false);
            fetchData();
        } catch (err) {
            setToast({
                open: true,
                message: err.response?.data?.message || 'Error saving student profile',
                severity: 'error'
            });
        }
    };

    const handleDelete = async (studentId, studentName) => {
        if (!window.confirm(`Are you sure you want to remove student "${studentName}"?`)) return;
        try {
            await api.delete(`/students/${studentId}`);
            setToast({ open: true, message: 'Student removed successfully', severity: 'success' });
            fetchData();
        } catch (err) {
            setToast({ open: true, message: 'Failed to delete student', severity: 'error' });
        }
    };

    const filteredStudents = students.filter(st => {
        const fullName = `${st.fname} ${st.mname || ''} ${st.lname}`.toLowerCase();
        const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
            st.grno.toLowerCase().includes(searchTerm.toLowerCase()) ||
            st.mobileNo.includes(searchTerm) ||
            (st.rfid && st.rfid.toLowerCase().includes(searchTerm.toLowerCase()));

        const courseIdStr = st.courseId?._id || st.courseId;
        const batchIdStr = st.batchId?._id || st.batchId;

        const matchesCourse = courseFilter === 'ALL' || courseIdStr === courseFilter;
        const matchesBatch = batchFilter === 'ALL' || batchIdStr === batchFilter;
        const matchesStatus = statusFilter === 'ALL' || st.status === statusFilter;

        return matchesSearch && matchesCourse && matchesBatch && matchesStatus;
    });

    return (
        <AdminLayout>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                <Box>
                    <Typography variant="h5" fontWeight="900" color="#0f172a">
                        Student Master & Enrollment Directory
                    </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Manage candidate admissions with auto-generated student login accounts and Email/SMS notifications
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
                        Register New Student
                    </Button>
                </Box>

                {/* Filters */}
                <Paper sx={{ p: 2, mb: 3, borderRadius: '12px', border: '1px solid #e0f2fe' }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Search by name, GR No, mobile, RFID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <FontAwesomeIcon icon={faSearch} style={{ color: '#0284c7' }} />
                                        </InputAdornment>
                                    )
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4} md={3}>
                            <TextField
                                fullWidth
                                select
                                size="small"
                                label="Course Filter"
                                value={courseFilter}
                                onChange={(e) => setCourseFilter(e.target.value)}
                            >
                                <MenuItem value="ALL">All Courses ({courses.length})</MenuItem>
                                {courses.map(c => (
                                    <MenuItem key={c._id} value={c._id}>{c.courseName}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={4} md={3}>
                            <TextField
                                fullWidth
                                select
                                size="small"
                                label="Batch Filter"
                                value={batchFilter}
                                onChange={(e) => setBatchFilter(e.target.value)}
                            >
                                <MenuItem value="ALL">All Batches ({batches.length})</MenuItem>
                                {batches.map(b => (
                                    <MenuItem key={b._id} value={b._id}>{b.batchName}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={4} md={2}>
                            <TextField
                                fullWidth
                                select
                                size="small"
                                label="Status"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <MenuItem value="ALL">All Status</MenuItem>
                                <MenuItem value="Active">Active</MenuItem>
                                <MenuItem value="Completed">Completed</MenuItem>
                                <MenuItem value="Dropped">Dropped</MenuItem>
                            </TextField>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Students Table */}
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
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>GR No / Roll</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Student Name</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Course & Batch</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Contact Details</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Fees Status</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1', textAlign: 'right' }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredStudents.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4, color: '#64748b' }}>
                                                No students found matching your filters.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredStudents.map((st) => {
                                            const isPaid = (st.balanceFees || 0) === 0;
                                            return (
                                                <TableRow key={st._id} hover>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight="800" color="#0f172a">
                                                            {st.grno}
                                                        </Typography>
                                                        <Typography variant="caption" color="textSecondary">
                                                            Roll #{st.rollno}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box display="flex" alignItems="center" gap={1.5}>
                                                            <Avatar sx={{ bgcolor: st.gender === 'Female' ? '#ec4899' : '#0284c7', width: 36, height: 36, fontSize: '13px', fontWeight: 'bold' }}>
                                                                {st.fname[0]}{st.lname[0]}
                                                            </Avatar>
                                                            <Box>
                                                                <Typography variant="body2" fontWeight="800" color="#0f172a">
                                                                    {st.fname} {st.mname ? `${st.mname} ` : ''}{st.lname}
                                                                </Typography>
                                                                <Typography variant="caption" color="textSecondary">
                                                                    {st.gender} • {st.academicYear}
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={st.courseId?.courseName || 'No Course'}
                                                            size="small"
                                                            sx={{ fontWeight: 700, backgroundColor: '#e0f2fe', color: '#0369a1', mb: 0.5, maxWidth: 200 }}
                                                        />
                                                        <Typography variant="caption" display="block" color="textSecondary">
                                                            {st.batchId?.batchName ? `${st.batchId.batchName} (${st.batchId.timing})` : 'Unassigned Batch'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box display="flex" alignItems="center" gap={0.8}>
                                                            <FontAwesomeIcon icon={faPhone} style={{ color: '#0284c7', fontSize: '11px' }} />
                                                            <Typography variant="body2">{st.mobileNo}</Typography>
                                                        </Box>
                                                        {st.rfid && (
                                                            <Chip label={st.rfid} size="small" variant="outlined" sx={{ fontSize: '10px', height: '18px', mt: 0.3 }} />
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={isPaid ? 'Fully Paid' : `Bal: ₹${st.balanceFees}`}
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: isPaid ? '#dcfce7' : '#fee2e2',
                                                                color: isPaid ? '#166534' : '#991b1b',
                                                                fontWeight: 800
                                                            }}
                                                        />
                                                        <Typography variant="caption" display="block" color="textSecondary">
                                                            Paid ₹{st.paidFees} / ₹{st.totalFees}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={st.status}
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: st.status === 'Active' ? '#dcfce7' : '#f1f5f9',
                                                                color: st.status === 'Active' ? '#166534' : '#64748b',
                                                                fontWeight: 700
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ textAlign: 'right' }}>
                                                        <Tooltip title="View Student ID Card">
                                                            <IconButton size="small" onClick={() => setIdCardStudent(st)} sx={{ color: '#0284c7', mr: 0.5 }}>
                                                                <FontAwesomeIcon icon={faIdCard} />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Edit Profile">
                                                            <IconButton size="small" onClick={() => handleOpenEdit(st)} sx={{ color: '#0369a1', mr: 0.5 }}>
                                                                <FontAwesomeIcon icon={faEdit} />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Delete Student">
                                                            <IconButton size="small" onClick={() => handleDelete(st._id, `${st.fname} ${st.lname}`)} sx={{ color: '#ef4444' }}>
                                                                <FontAwesomeIcon icon={faTrash} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                )}

                {/* Add / Edit Student Multi-Tab Dialog */}
                <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
                    <form onSubmit={handleSubmit}>
                        <DialogTitle sx={{ fontWeight: 800, backgroundColor: '#0284c7', color: '#fff' }}>
                            {editingStudent ? `Edit Student: ${editingStudent.fname} ${editingStudent.lname}` : 'Register New Student (Admission Entry)'}
                        </DialogTitle>

                        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, pt: 1, backgroundColor: '#f0f9ff' }}>
                            <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)}>
                                <Tab label="1. Personal Info" sx={{ textTransform: 'none', fontWeight: 800 }} />
                                <Tab label="2. Course & Batch" sx={{ textTransform: 'none', fontWeight: 800 }} />
                                <Tab label="3. Parents & Contact" sx={{ textTransform: 'none', fontWeight: 800 }} />
                                <Tab label="4. Fees & RFID" sx={{ textTransform: 'none', fontWeight: 800 }} />
                            </Tabs>
                        </Box>

                        <DialogContent sx={{ p: 3 }}>
                            {activeTab === 0 && (
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={4}>
                                        <TextField
                                            label="First Name"
                                            fullWidth
                                            required
                                            value={formData.fname}
                                            onChange={(e) => setFormData({ ...formData, fname: e.target.value })}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <TextField
                                            label="Middle Name"
                                            fullWidth
                                            value={formData.mname}
                                            onChange={(e) => setFormData({ ...formData, mname: e.target.value })}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <TextField
                                            label="Last Name"
                                            fullWidth
                                            required
                                            value={formData.lname}
                                            onChange={(e) => setFormData({ ...formData, lname: e.target.value })}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <TextField
                                            label="Date of Birth"
                                            type="date"
                                            fullWidth
                                            InputLabelProps={{ shrink: true }}
                                            value={formData.dob}
                                            onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <TextField
                                            label="Gender"
                                            select
                                            fullWidth
                                            value={formData.gender}
                                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                        >
                                            <MenuItem value="Male">Male</MenuItem>
                                            <MenuItem value="Female">Female</MenuItem>
                                            <MenuItem value="Other">Other</MenuItem>
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <TextField
                                            label="Aadhar Number"
                                            fullWidth
                                            value={formData.adharno}
                                            onChange={(e) => setFormData({ ...formData, adharno: e.target.value })}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            label="Residential Address"
                                            fullWidth
                                            multiline
                                            rows={2}
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        />
                                    </Grid>
                                </Grid>
                            )}

                            {activeTab === 1 && (
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="GR Number / Student Reg No"
                                            fullWidth
                                            required
                                            value={formData.grno}
                                            onChange={(e) => setFormData({ ...formData, grno: e.target.value.toUpperCase() })}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="Roll Number"
                                            type="number"
                                            fullWidth
                                            required
                                            value={formData.rollno}
                                            onChange={(e) => setFormData({ ...formData, rollno: e.target.value })}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="Enrolled Course"
                                            select
                                            fullWidth
                                            required
                                            value={formData.courseId}
                                            onChange={(e) => handleCourseChange(e.target.value)}
                                        >
                                            {courses.map(c => (
                                                <MenuItem key={c._id} value={c._id}>
                                                    {c.courseName} (₹{c.totalFees})
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="Assigned Batch"
                                            select
                                            fullWidth
                                            required
                                            value={formData.batchId}
                                            onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                                        >
                                            {batches
                                                .filter(b => !formData.courseId || (b.courseId?._id === formData.courseId || b.courseId === formData.courseId))
                                                .map(b => (
                                                    <MenuItem key={b._id} value={b._id}>
                                                        {b.batchName} ({b.timing})
                                                    </MenuItem>
                                                ))}
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="Academic Year / Session"
                                            fullWidth
                                            value={formData.academicYear}
                                            onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="Admission Status"
                                            select
                                            fullWidth
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        >
                                            <MenuItem value="Active">Active</MenuItem>
                                            <MenuItem value="Completed">Completed</MenuItem>
                                            <MenuItem value="Dropped">Dropped</MenuItem>
                                        </TextField>
                                    </Grid>
                                </Grid>
                            )}

                            {activeTab === 2 && (
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="Student Mobile Number (For Login & SMS)"
                                            fullWidth
                                            required
                                            value={formData.mobileNo}
                                            onChange={(e) => setFormData({ ...formData, mobileNo: e.target.value })}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="Student Email Address (For Welcome Email)"
                                            type="email"
                                            fullWidth
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <TextField
                                            label="Father / Guardian Name"
                                            fullWidth
                                            value={formData.fatherName}
                                            onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <TextField
                                            label="Father Mobile (For Absentee Alert SMS)"
                                            fullWidth
                                            value={formData.fatherMobileNo}
                                            onChange={(e) => setFormData({ ...formData, fatherMobileNo: e.target.value })}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <TextField
                                            label="Mother Mobile Number"
                                            fullWidth
                                            value={formData.motherMobileNo}
                                            onChange={(e) => setFormData({ ...formData, motherMobileNo: e.target.value })}
                                        />
                                    </Grid>
                                </Grid>
                            )}

                            {activeTab === 3 && (
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={4}>
                                        <TextField
                                            label="Total Course Fees (₹)"
                                            type="number"
                                            fullWidth
                                            required
                                            value={formData.totalFees}
                                            onChange={(e) => {
                                                const total = Number(e.target.value) || 0;
                                                setFormData(prev => ({
                                                    ...prev,
                                                    totalFees: total,
                                                    balanceFees: Math.max(0, total - Number(prev.paidFees || 0))
                                                }));
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <TextField
                                            label="Paid Amount (₹)"
                                            type="number"
                                            fullWidth
                                            value={formData.paidFees}
                                            onChange={(e) => handlePaidFeesChange(e.target.value)}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <TextField
                                            label="Balance Pending (₹)"
                                            type="number"
                                            fullWidth
                                            disabled
                                            value={formData.balanceFees}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="RFID Card Tag / Barcode"
                                            fullWidth
                                            value={formData.rfid}
                                            onChange={(e) => setFormData({ ...formData, rfid: e.target.value })}
                                            placeholder="e.g. RFID-1001"
                                            helperText="For 1-second Rapid Attendance Punch"
                                        />
                                    </Grid>
                                </Grid>
                            )}
                        </DialogContent>

                        <DialogActions sx={{ p: 2.5, borderTop: '1px solid #e0f2fe', justifyContent: 'space-between' }}>
                            <Box>
                                {activeTab > 0 && (
                                    <Button onClick={() => setActiveTab(activeTab - 1)} sx={{ mr: 1 }}>Previous</Button>
                                )}
                                {activeTab < 3 && (
                                    <Button variant="outlined" onClick={() => setActiveTab(activeTab + 1)}>Next</Button>
                                )}
                            </Box>
                            <Box>
                                <Button onClick={() => setOpenDialog(false)} sx={{ color: '#64748b', mr: 1 }}>Cancel</Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    sx={{ backgroundColor: '#0284c7', '&:hover': { backgroundColor: '#0369a1' }, fontWeight: 800 }}
                                >
                                    {editingStudent ? 'Save Changes' : 'Confirm Admission & Shoot Credentials'}
                                </Button>
                            </Box>
                        </DialogActions>
                    </form>
                </Dialog>

                {/* Admission Credentials Success Dialog */}
                <Dialog open={Boolean(admissionSuccessModal)} onClose={() => setAdmissionSuccessModal(null)} maxWidth="xs" fullWidth>
                    {admissionSuccessModal && (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Avatar sx={{ bgcolor: '#10b981', width: 60, height: 60, margin: '0 auto 12px' }}>
                                <FontAwesomeIcon icon={faCircleCheck} size="xl" />
                            </Avatar>
                            <Typography variant="h6" fontWeight="900" color="#166534">
                                Admission & Student Portal Ready!
                            </Typography>
                            <Typography variant="body2" color="textSecondary" mb={2}>
                                {admissionSuccessModal.studentName} ({admissionSuccessModal.grno})
                            </Typography>

                            <Paper sx={{ p: 2, bgcolor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', textAlign: 'left', mb: 2 }}>
                                <Typography variant="caption" color="textSecondary" display="block">Portal URL: <strong>http://localhost:5173/login</strong></Typography>
                                <Typography variant="caption" color="textSecondary" display="block">Student GR No / User: <strong>{admissionSuccessModal.username}</strong></Typography>
                                <Typography variant="caption" color="textSecondary" display="block">Password: <strong>{admissionSuccessModal.password}</strong></Typography>
                                <Typography variant="caption" sx={{ color: '#0369a1', fontWeight: 700, mt: 1, display: 'block' }}>
                                    ✉️ Welcome Email & SMS dispatched to student's mobile & email.
                                </Typography>
                            </Paper>

                            <Button
                                variant="contained"
                                fullWidth
                                onClick={() => setAdmissionSuccessModal(null)}
                                sx={{ bgcolor: '#0284c7', fontWeight: 800 }}
                            >
                                Done
                            </Button>
                        </Box>
                    )}
                </Dialog>

                {/* Student ID Card Modal */}
                <Dialog open={Boolean(idCardStudent)} onClose={() => setIdCardStudent(null)} maxWidth="xs" fullWidth>
                    {idCardStudent && (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Paper
                                elevation={4}
                                sx={{
                                    p: 3,
                                    borderRadius: '16px',
                                    border: '2px solid #0284c7',
                                    background: 'linear-gradient(180deg, #075985 0%, #0369a1 100%)',
                                    color: '#fff',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                <Typography variant="h6" fontWeight="900" sx={{ color: '#bae6fd', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                    KEERTI COMPUTER CLASSES
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#e0f2fe', display: 'block', mb: 2 }}>
                                    STUDENT IDENTITY CARD
                                </Typography>

                                <Avatar
                                    sx={{
                                        width: 75,
                                        height: 75,
                                        margin: '0 auto 12px',
                                        bgcolor: '#ffffff',
                                        color: '#0284c7',
                                        fontSize: '26px',
                                        fontWeight: '900',
                                        border: '3px solid #38bdf8'
                                    }}
                                >
                                    {idCardStudent.fname[0]}{idCardStudent.lname[0]}
                                </Avatar>

                                <Typography variant="h6" fontWeight="800" sx={{ color: '#fff' }}>
                                    {idCardStudent.fname} {idCardStudent.lname}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#bae6fd', fontWeight: 600, mb: 2 }}>
                                    {idCardStudent.courseId?.courseName || 'Certified IT Course'}
                                </Typography>

                                <Box sx={{ backgroundColor: 'rgba(255,255,255,0.1)', p: 1.5, borderRadius: '8px', textAlign: 'left', mb: 2 }}>
                                    <Typography variant="caption" sx={{ color: '#e0f2fe', display: 'block' }}>
                                        <strong>GR No:</strong> {idCardStudent.grno}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#e0f2fe', display: 'block' }}>
                                        <strong>Batch:</strong> {idCardStudent.batchId?.batchName || 'General'}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#e0f2fe', display: 'block' }}>
                                        <strong>Timing:</strong> {idCardStudent.batchId?.timing || 'N/A'}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#e0f2fe', display: 'block' }}>
                                        <strong>Contact:</strong> {idCardStudent.mobileNo}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#e0f2fe', display: 'block' }}>
                                        <strong>RFID / Punch:</strong> {idCardStudent.rfid || 'N/A'}
                                    </Typography>
                                </Box>

                                <Box display="flex" justifyContent="center" alignItems="center" gap={1} sx={{ color: '#bae6fd' }}>
                                    <FontAwesomeIcon icon={faQrcode} />
                                    <Typography variant="caption">Authorized Campus Smart ID</Typography>
                                </Box>
                            </Paper>

                            <Box display="flex" justifyContent="space-between" mt={2.5}>
                                <Button onClick={() => setIdCardStudent(null)} sx={{ color: '#64748b' }}>Close</Button>
                                <Button
                                    variant="contained"
                                    startIcon={<FontAwesomeIcon icon={faPrint} />}
                                    onClick={() => window.print()}
                                    sx={{ backgroundColor: '#0284c7', '&:hover': { backgroundColor: '#0369a1' }, fontWeight: 800 }}
                                >
                                    Print ID Card
                                </Button>
                            </Box>
                        </Box>
                    )}
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

export default StudentMaster;
