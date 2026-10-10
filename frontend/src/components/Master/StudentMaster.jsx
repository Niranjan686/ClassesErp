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
import { SuccessCheckmark, triggerAcademicConfetti } from '../Common/MotionWrapper';
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
                triggerAcademicConfetti();
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

                {/* Minimalist Filter Toolbar */}
                <Paper sx={{ p: 2, mb: 3, borderRadius: '16px', border: '1px solid #e2e8f0', bgcolor: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Search by name, GR No, phone, RFID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '10px',
                                        bgcolor: '#f8fafc',
                                        '& fieldset': { borderColor: '#e2e8f0' },
                                    }
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <FontAwesomeIcon icon={faSearch} style={{ color: '#94a3b8', fontSize: '14px' }} />
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
                                label="Course"
                                value={courseFilter}
                                onChange={(e) => setCourseFilter(e.target.value)}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '10px',
                                        bgcolor: '#f8fafc',
                                        '& fieldset': { borderColor: '#e2e8f0' },
                                    }
                                }}
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
                                label="Batch Slot"
                                value={batchFilter}
                                onChange={(e) => setBatchFilter(e.target.value)}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '10px',
                                        bgcolor: '#f8fafc',
                                        '& fieldset': { borderColor: '#e2e8f0' },
                                    }
                                }}
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
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '10px',
                                        bgcolor: '#f8fafc',
                                        '& fieldset': { borderColor: '#e2e8f0' },
                                    }
                                }}
                            >
                                <MenuItem value="ALL">All Status</MenuItem>
                                <MenuItem value="Active">Active</MenuItem>
                                <MenuItem value="Completed">Completed</MenuItem>
                                <MenuItem value="Dropped">Dropped</MenuItem>
                            </TextField>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Minimalist Spacious Students Data Grid */}
                {loading ? (
                    <Box display="flex" justifyContent="center" py={8}>
                        <CircularProgress sx={{ color: '#2563eb' }} />
                    </Box>
                ) : (
                    <Paper sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', bgcolor: '#ffffff', mb: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
                        <TableContainer>
                            <Table sx={{ minWidth: 700 }}>
                                <TableHead sx={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', py: 2 }}>GR & Roll</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', py: 2 }}>Student Name</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', py: 2 }}>Enrolled Program</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', py: 2 }}>Contact</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', py: 2 }}>Fee Balance</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', py: 2 }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', textAlign: 'right', pr: 3, py: 2 }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredStudents.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6, color: '#94a3b8', fontSize: '13px' }}>
                                                No student profiles found matching your search criteria.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredStudents.map((st) => {
                                            const isPaid = (st.balanceFees || 0) === 0;
                                            return (
                                                <TableRow
                                                    key={st._id}
                                                    hover
                                                    sx={{
                                                        borderBottom: '1px solid #f1f5f9',
                                                        transition: 'background-color 0.15s ease',
                                                        '&:hover': { bgcolor: '#f8fafc' }
                                                    }}
                                                >
                                                    {/* GR No & Roll */}
                                                    <TableCell sx={{ py: 2.5 }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace', color: '#0f172a' }}>
                                                            {st.grno}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 500 }}>
                                                            Roll #{st.rollno || '1'}
                                                        </Typography>
                                                    </TableCell>

                                                    {/* Student Avatar & Name */}
                                                    <TableCell sx={{ py: 2.5 }}>
                                                        <Box display="flex" alignItems="center" gap={1.8}>
                                                            <Avatar
                                                                sx={{
                                                                    bgcolor: '#eff6ff',
                                                                    color: '#2563eb',
                                                                    border: '1px solid #dbeafe',
                                                                    width: 38,
                                                                    height: 38,
                                                                    fontSize: '13px',
                                                                    fontWeight: 800
                                                                }}
                                                            >
                                                                {st.fname?.[0] || 'S'}{st.lname?.[0] || ''}
                                                            </Avatar>
                                                            <Box>
                                                                <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
                                                                    {st.fname} {st.mname ? `${st.mname} ` : ''}{st.lname}
                                                                </Typography>
                                                                <Typography variant="caption" sx={{ color: '#64748b' }}>
                                                                    {st.gender || 'Student'} • {st.academicYear || '2026-2027'}
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                    </TableCell>

                                                    {/* Enrolled Course & Batch */}
                                                    <TableCell sx={{ py: 2.5 }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                                                            {st.courseId?.courseName || 'General Program'}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.2 }}>
                                                            {st.batchId?.batchName ? `${st.batchId.batchName} (${st.batchId.timing})` : 'Default Batch'}
                                                        </Typography>
                                                    </TableCell>

                                                    {/* Contact & RFID */}
                                                    <TableCell sx={{ py: 2.5 }}>
                                                        <Box display="flex" alignItems="center" gap={1}>
                                                            <FontAwesomeIcon icon={faPhone} style={{ color: '#94a3b8', fontSize: '11px' }} />
                                                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600, color: '#334155' }}>
                                                                {st.mobileNo}
                                                            </Typography>
                                                        </Box>
                                                        {st.rfid && (
                                                            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 0.3, fontSize: '10px' }}>
                                                                RFID: {st.rfid}
                                                            </Typography>
                                                        )}
                                                    </TableCell>

                                                    {/* Fee Status */}
                                                    <TableCell sx={{ py: 2.5 }}>
                                                        {isPaid ? (
                                                            <Box display="flex" alignItems="center" gap={0.8}>
                                                                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#16a34a' }} />
                                                                <Typography variant="body2" sx={{ fontWeight: 700, color: '#16a34a' }}>
                                                                    Cleared
                                                                </Typography>
                                                            </Box>
                                                        ) : (
                                                            <Box>
                                                                <Typography variant="body2" sx={{ fontWeight: 800, color: '#e11d48' }}>
                                                                    ₹{(st.balanceFees || 0).toLocaleString('en-IN')} Due
                                                                </Typography>
                                                                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                                                    Paid ₹{(st.paidFees || 0).toLocaleString('en-IN')} of ₹{(st.totalFees || 0).toLocaleString('en-IN')}
                                                                </Typography>
                                                            </Box>
                                                        )}
                                                    </TableCell>

                                                    {/* Status Badge */}
                                                    <TableCell sx={{ py: 2.5 }}>
                                                        <Box
                                                            sx={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: 0.8,
                                                                px: 1.2,
                                                                py: 0.4,
                                                                borderRadius: '20px',
                                                                bgcolor: st.status === 'Active' ? '#f0fdf4' : '#f8fafc',
                                                                border: '1px solid',
                                                                borderColor: st.status === 'Active' ? '#bbf7d0' : '#e2e8f0',
                                                            }}
                                                        >
                                                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: st.status === 'Active' ? '#16a34a' : '#94a3b8' }} />
                                                            <Typography variant="caption" sx={{ fontWeight: 700, color: st.status === 'Active' ? '#15803d' : '#64748b' }}>
                                                                {st.status || 'Active'}
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>

                                                    {/* Actions */}
                                                    <TableCell sx={{ textAlign: 'right', pr: 3, py: 2.5 }}>
                                                        <Box display="flex" justifyContent="flex-end" alignItems="center" gap={0.8}>
                                                            <Tooltip title="View 3D PVC ID Card">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => setIdCardStudent(st)}
                                                                    sx={{
                                                                        width: 32,
                                                                        height: 32,
                                                                        borderRadius: '8px',
                                                                        bgcolor: '#eff6ff',
                                                                        color: '#2563eb',
                                                                        '&:hover': { bgcolor: '#dbeafe' }
                                                                    }}
                                                                >
                                                                    <FontAwesomeIcon icon={faIdCard} style={{ fontSize: '13px' }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Edit Student">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleOpenEdit(st)}
                                                                    sx={{
                                                                        width: 32,
                                                                        height: 32,
                                                                        borderRadius: '8px',
                                                                        bgcolor: '#f8fafc',
                                                                        color: '#475569',
                                                                        border: '1px solid #e2e8f0',
                                                                        '&:hover': { bgcolor: '#f1f5f9' }
                                                                    }}
                                                                >
                                                                    <FontAwesomeIcon icon={faEdit} style={{ fontSize: '13px' }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Delete Record">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleDeleteStudent(st._id)}
                                                                    sx={{
                                                                        width: 32,
                                                                        height: 32,
                                                                        borderRadius: '8px',
                                                                        bgcolor: '#fff1f2',
                                                                        color: '#e11d48',
                                                                        '&:hover': { bgcolor: '#ffe4e6' }
                                                                    }}
                                                                >
                                                                    <FontAwesomeIcon icon={faTrash} style={{ fontSize: '13px' }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Box>
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
                <Dialog open={Boolean(admissionSuccessModal)} onClose={() => setAdmissionSuccessModal(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}>
                    {admissionSuccessModal && (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Box sx={{ mb: 2 }}>
                                <SuccessCheckmark size={58} />
                            </Box>
                            <Typography variant="h6" fontWeight="900" color="#172033" fontFamily="'Plus Jakarta Sans', sans-serif">
                                Admission Confirmed!
                            </Typography>
                            <Typography variant="body2" color="#64748B" mb={2}>
                                {admissionSuccessModal.studentName} ({admissionSuccessModal.grno})
                            </Typography>

                            <Paper sx={{ p: 2, bgcolor: '#F8FAFC', border: '1px solid #E8EDF4', borderRadius: '12px', textAlign: 'left', mb: 2.5 }}>
                                <Typography variant="caption" color="#64748B" display="block">Student Portal: <strong>http://localhost:5173/app</strong></Typography>
                                <Typography variant="caption" color="#64748B" display="block">Username / Mobile: <strong>{admissionSuccessModal.username}</strong></Typography>
                                <Typography variant="caption" color="#64748B" display="block">Default Password: <strong>{admissionSuccessModal.password}</strong></Typography>
                                <Typography variant="caption" sx={{ color: '#4338CA', fontWeight: 700, mt: 1, display: 'block' }}>
                                    ✓ Welcome SMS & mobile app access dispatched automatically.
                                </Typography>
                            </Paper>

                            <Button
                                variant="contained"
                                fullWidth
                                onClick={() => setAdmissionSuccessModal(null)}
                                sx={{ bgcolor: '#4338CA', '&:hover': { bgcolor: '#3730A3' }, fontWeight: 800, borderRadius: '12px', py: 1.2 }}
                            >
                                Continue
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
