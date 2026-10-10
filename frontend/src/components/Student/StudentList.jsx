import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Grid, Paper, Card, CardContent, Button, Chip, TextField,
    MenuItem, CircularProgress, Alert, Snackbar, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent,
    DialogActions, IconButton, Tooltip, Avatar, InputAdornment, Divider
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faIdCard, faPlus, faPrint, faSearch, faUserGraduate, faQrcode,
    faBarcode, faPhone, faEnvelope, faFilter, faFileCsv, faCheckCircle,
    faClock, faShieldHalved, faHeartPulse, faAddressBook
} from '@fortawesome/free-solid-svg-icons';
import AdminLayout from '../Common/AdminLayout';
import { PageTransition } from '../Common/MotionWrapper';
import { ClassTechLoader } from '../Common/ClassTechLoader';
import { EmptyStateIllustration } from '../Common/EducationalSVGs';
import api from '../../api';

const StudentList = () => {
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [courseFilter, setCourseFilter] = useState('ALL');
    const [batchFilter, setBatchFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // ID Card Modal
    const [idCardModal, setIdCardModal] = useState({ open: false, student: null, format: 'vertical' });
    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [stuRes, crsRes, batRes] = await Promise.all([
                api.get('/students'),
                api.get('/courses'),
                api.get('/batches')
            ]);
            setStudents(Array.isArray(stuRes.data) ? stuRes.data : (stuRes.data?.data || []));
            setCourses(Array.isArray(crsRes.data) ? crsRes.data : (crsRes.data?.data || []));
            setBatches(Array.isArray(batRes.data) ? batRes.data : (batRes.data?.data || []));
        } catch (err) {
            setToast({ open: true, message: 'Failed to load students directory', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredStudents = students.filter(s => {
        const fullName = `${s.fname} ${s.mname || ''} ${s.lname}`.toLowerCase();
        const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
            s.grno?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.mobileNo?.includes(searchTerm) ||
            s.rfid?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesCourse = courseFilter === 'ALL' || (s.courseId?._id || s.courseId) === courseFilter;
        const matchesBatch = batchFilter === 'ALL' || (s.batchId?._id || s.batchId) === batchFilter;
        const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;

        return matchesSearch && matchesCourse && matchesBatch && matchesStatus;
    });

    const handlePrintIdCard = () => {
        window.print();
    };

    const handleExportCSV = () => {
        const headers = ['GR No', 'Roll No', 'Full Name', 'Course', 'Batch', 'Mobile', 'RFID Tag', 'Blood Group', 'Total Fees', 'Paid Fees', 'Balance Dues', 'Status'];
        const rows = filteredStudents.map(s => [
            s.grno,
            s.rollno || '',
            `"${s.fname} ${s.lname}"`,
            `"${s.courseId?.courseName || 'Course'}"`,
            `"${s.batchId?.batchName || 'Batch'}"`,
            s.mobileNo,
            s.rfid || 'UNASSIGNED',
            s.bloodGroup || 'B+',
            s.totalFees || 0,
            s.paidFees || 0,
            s.balanceFees || 0,
            s.status
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `ClassTech_Students_Roster_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <AdminLayout>
            <PageTransition>
            {/* Header Banner */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                <Box>
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <Typography variant="h5" fontWeight="900" color="#0f172a">
                            Students & Smart Identity Management
                        </Typography>
                        <Chip label="ClassTech Roster" sx={{ bgcolor: '#dbeafe', color: '#1d4ed8', fontWeight: 900 }} />
                    </Box>
                            <Typography variant="body2" color="textSecondary" sx={{ mt: 0.3 }}>
                                Identity verification, RFID smart cards, batch enrollments, and printable PVC student ID badges
                            </Typography>
                        </Box>

                        <Box display="flex" gap={1.5} flexWrap="wrap">
                            <Button
                                variant="outlined"
                                startIcon={<FontAwesomeIcon icon={faFileCsv} />}
                                onClick={handleExportCSV}
                                sx={{ borderColor: '#2563eb', color: '#2563eb', fontWeight: 800, textTransform: 'none', borderRadius: '10px' }}
                            >
                                Export CSV
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<FontAwesomeIcon icon={faPlus} />}
                                href="/student-master"
                                sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' }, fontWeight: 800, textTransform: 'none', px: 2.5, borderRadius: '10px' }}
                            >
                                Enroll New Student
                            </Button>
                        </Box>
                    </Box>

                    {/* Metric Highlights */}
                    <Grid container spacing={2.5} sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{ borderRadius: '14px', border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                                <CardContent sx={{ p: 2.5 }}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800 }}>TOTAL ENROLLED</Typography>
                                        <Box sx={{ width: 38, height: 38, borderRadius: '10px', bgcolor: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <FontAwesomeIcon icon={faUserGraduate} />
                                        </Box>
                                    </Box>
                                    <Typography variant="h4" fontWeight="900" color="#0f172a">
                                        {students.length}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">Active Student Candidates</Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{ borderRadius: '14px', border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                                <CardContent sx={{ p: 2.5 }}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800 }}>RFID SMART CARDS</Typography>
                                        <Box sx={{ width: 38, height: 38, borderRadius: '10px', bgcolor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <FontAwesomeIcon icon={faIdCard} />
                                        </Box>
                                    </Box>
                                    <Typography variant="h4" fontWeight="900" color="#16a34a">
                                        {students.filter(s => s.rfid).length}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">Tags Programmed & Active</Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{ borderRadius: '14px', border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                                <CardContent sx={{ p: 2.5 }}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800 }}>ACTIVE BATCHES</Typography>
                                        <Box sx={{ width: 38, height: 38, borderRadius: '10px', bgcolor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <FontAwesomeIcon icon={faClock} />
                                        </Box>
                                    </Box>
                                    <Typography variant="h4" fontWeight="900" color="#0f172a">
                                        {batches.length}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">Operational Class Slots</Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{ borderRadius: '14px', border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                                <CardContent sx={{ p: 2.5 }}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800 }}>CERTIFIED COURSES</Typography>
                                        <Box sx={{ width: 38, height: 38, borderRadius: '10px', bgcolor: '#f3e8ff', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <FontAwesomeIcon icon={faShieldHalved} />
                                        </Box>
                                    </Box>
                                    <Typography variant="h4" fontWeight="900" color="#0f172a">
                                        {courses.length}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">Active Curriculums</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Filter Toolbar */}
                    <Paper sx={{ p: 2.5, mb: 3, borderRadius: '14px', border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Search by student name, GR no, mobile, RFID tag..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <FontAwesomeIcon icon={faSearch} style={{ color: '#2563eb' }} />
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
                                    label="Filter by Course"
                                    value={courseFilter}
                                    onChange={(e) => setCourseFilter(e.target.value)}
                                >
                                    <MenuItem value="ALL">All Courses</MenuItem>
                                    {courses.map(c => <MenuItem key={c._id} value={c._id}>{c.courseName}</MenuItem>)}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={4} md={3}>
                                <TextField
                                    fullWidth
                                    select
                                    size="small"
                                    label="Filter by Batch Slot"
                                    value={batchFilter}
                                    onChange={(e) => setBatchFilter(e.target.value)}
                                >
                                    <MenuItem value="ALL">All Batches</MenuItem>
                                    {batches.map(b => <MenuItem key={b._id} value={b._id}>{b.batchName} ({b.timing})</MenuItem>)}
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

                    {/* Students Data Grid */}
                    {loading ? (
                        <Box display="flex" justifyContent="center" py={8}>
                            <CircularProgress sx={{ color: '#2563eb' }} />
                        </Box>
                    ) : filteredStudents.length === 0 ? (
                        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '14px', border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                            <Typography color="textSecondary" fontWeight="600">No student profiles found matching criteria.</Typography>
                        </Paper>
                    ) : (
                        <Paper sx={{ borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', bgcolor: '#ffffff' }}>
                            <TableContainer>
                                <Table>
                                    <TableHead sx={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 800, color: '#1e293b' }}>Student Profile</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: '#1e293b' }}>GR & RFID Tag</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: '#1e293b' }}>Class / Course</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: '#1e293b' }}>Batch Timing</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: '#1e293b' }}>Parent Contact</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: '#1e293b' }}>Fee Status</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: '#1e293b', textAlign: 'right' }}>Smart ID Badge</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredStudents.map((s) => (
                                            <TableRow key={s._id} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                                                <TableCell>
                                                    <Box display="flex" alignItems="center" gap={1.5}>
                                                        <Avatar
                                                            sx={{
                                                                width: 40,
                                                                height: 40,
                                                                bgcolor: '#2563eb',
                                                                color: '#ffffff',
                                                                fontWeight: 900,
                                                                fontSize: '15px'
                                                            }}
                                                        >
                                                            {s.fname[0].toUpperCase()}
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant="body2" fontWeight="800" color="#0f172a">
                                                                {s.fname} {s.mname || ''} {s.lname}
                                                            </Typography>
                                                            <Typography variant="caption" color="textSecondary">
                                                                Roll: {s.rollno || '01'} • Blood: {s.bloodGroup || 'B+'}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={s.grno}
                                                        size="small"
                                                        sx={{ bgcolor: '#dbeafe', color: '#1d4ed8', fontWeight: 900, mb: 0.3 }}
                                                    />
                                                    <Typography variant="caption" color="textSecondary" display="block">
                                                        RFID: {s.rfid || 'UNASSIGNED'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="700" color="#0f172a">
                                                        {s.courseId?.courseName || 'Certified Course'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="600">
                                                        {s.batchId?.batchName || 'Regular Batch'}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        {s.batchId?.timing || 'Morning Slot'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="700">
                                                        {s.mobileNo}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        Parent: {s.fatherMobileNo || s.motherMobileNo || 'N/A'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={s.balanceFees === 0 ? 'Clear' : `Due ₹${s.balanceFees || 0}`}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: s.balanceFees === 0 ? '#dcfce7' : '#fee2e2',
                                                            color: s.balanceFees === 0 ? '#166534' : '#991b1b',
                                                            fontWeight: 800,
                                                            fontSize: '11px'
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ textAlign: 'right' }}>
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        startIcon={<FontAwesomeIcon icon={faIdCard} />}
                                                        onClick={() => setIdCardModal({ open: true, student: s, format: 'vertical' })}
                                                        sx={{
                                                            bgcolor: '#2563eb',
                                                            '&:hover': { bgcolor: '#1d4ed8' },
                                                            textTransform: 'none',
                                                            fontWeight: 800,
                                                            fontSize: '11px',
                                                            borderRadius: '8px'
                                                        }}
                                                    >
                                                        Print ID
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    )}

                    {/* Dialog: Printable ClassTech PVC Smart ID Card */}
                    <Dialog
                        open={idCardModal.open}
                        onClose={() => setIdCardModal({ open: false, student: null, format: 'vertical' })}
                        maxWidth="xs"
                        fullWidth
                    >
                        <DialogTitle sx={{ fontWeight: 800, bgcolor: '#0f172a', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>ClassTech Smart PVC Identity Card</span>
                            <Button
                                size="small"
                                variant="contained"
                                startIcon={<FontAwesomeIcon icon={faPrint} />}
                                onClick={handlePrintIdCard}
                                sx={{ bgcolor: '#2563eb', color: '#fff', fontWeight: 800, '&:hover': { bgcolor: '#1d4ed8' } }}
                            >
                                Print PVC
                            </Button>
                        </DialogTitle>
                        <DialogContent sx={{ p: 3, display: 'flex', justifyContent: 'center', bgcolor: '#f1f5f9' }}>
                            {idCardModal.student && (
                                <Box
                                    sx={{
                                        width: '320px',
                                        minHeight: '480px',
                                        bgcolor: '#ffffff',
                                        borderRadius: '16px',
                                        overflow: 'hidden',
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                                        border: '2px solid #2563eb',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        position: 'relative'
                                    }}
                                >
                                    {/* ID Card Header */}
                                    <Box sx={{ bgcolor: '#0f172a', color: '#ffffff', p: 2, textAlign: 'center', borderBottom: '3px solid #2563eb' }}>
                                        <Typography variant="h6" fontWeight="900" sx={{ letterSpacing: '1px', color: '#ffffff', fontSize: '18px' }}>
                                            ClassTech<span style={{ color: '#60a5fa', fontSize: '12px' }}>®</span> CAMPUS
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            Integrated Coaching & School Management
                                        </Typography>
                                    </Box>

                                    {/* Student Avatar & Identity Badge */}
                                    <Box sx={{ p: 2.5, textAlign: 'center', flexGrow: 1 }}>
                                        <Avatar
                                            sx={{
                                                width: 84,
                                                height: 84,
                                                margin: '0 auto 12px auto',
                                                bgcolor: '#2563eb',
                                                color: '#ffffff',
                                                fontSize: '32px',
                                                fontWeight: 900,
                                                border: '4px solid #dbeafe',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                            }}
                                        >
                                            {idCardModal.student.fname[0].toUpperCase()}
                                        </Avatar>

                                        <Typography variant="h6" fontWeight="900" color="#0f172a" lineHeight={1.2}>
                                            {idCardModal.student.fname} {idCardModal.student.lname}
                                        </Typography>
                                        <Chip
                                            label={`GR NO: ${idCardModal.student.grno}`}
                                            size="small"
                                            sx={{ bgcolor: '#dbeafe', color: '#1d4ed8', fontWeight: 900, mt: 0.8, fontSize: '11px' }}
                                        />

                                        <Divider sx={{ my: 1.8 }} />

                                        {/* Identity Attributes */}
                                        <Box textAlign="left" sx={{ fontSize: '12px', color: '#334155' }}>
                                            <Box display="flex" justifyContent="space-between" py={0.4}>
                                                <Typography variant="caption" color="textSecondary" fontWeight="700">Course / Class:</Typography>
                                                <Typography variant="caption" fontWeight="800" color="#0f172a">{idCardModal.student.courseId?.courseName || 'Certified IT Course'}</Typography>
                                            </Box>
                                            <Box display="flex" justifyContent="space-between" py={0.4}>
                                                <Typography variant="caption" color="textSecondary" fontWeight="700">Batch Slot:</Typography>
                                                <Typography variant="caption" fontWeight="800" color="#0f172a">{idCardModal.student.batchId?.batchName || 'Regular Batch'}</Typography>
                                            </Box>
                                            <Box display="flex" justifyContent="space-between" py={0.4}>
                                                <Typography variant="caption" color="textSecondary" fontWeight="700">RFID Smart Tag:</Typography>
                                                <Typography variant="caption" fontWeight="900" color="#2563eb">{idCardModal.student.rfid || 'RFID-9820-001'}</Typography>
                                            </Box>
                                            <Box display="flex" justifyContent="space-between" py={0.4}>
                                                <Typography variant="caption" color="textSecondary" fontWeight="700">Blood Group:</Typography>
                                                <Typography variant="caption" fontWeight="800" color="#dc2626">{idCardModal.student.bloodGroup || 'B+'}</Typography>
                                            </Box>
                                            <Box display="flex" justifyContent="space-between" py={0.4}>
                                                <Typography variant="caption" color="textSecondary" fontWeight="700">Emergency Contact:</Typography>
                                                <Typography variant="caption" fontWeight="800">{idCardModal.student.mobileNo}</Typography>
                                            </Box>
                                        </Box>

                                        {/* Barcode & Signature */}
                                        <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Box textAlign="left">
                                                <FontAwesomeIcon icon={faBarcode} style={{ fontSize: '28px', color: '#0f172a' }} />
                                                <Typography variant="caption" sx={{ display: 'block', fontSize: '9px', color: '#64748b' }}>
                                                    *{idCardModal.student.grno}*
                                                </Typography>
                                            </Box>
                                            <Box textAlign="center">
                                                <Box sx={{ width: 80, borderBottom: '1px solid #0f172a', mb: 0.3 }} />
                                                <Typography variant="caption" sx={{ fontSize: '9px', fontWeight: 700, color: '#64748b' }}>
                                                    Authorized Sign
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>

                                    {/* Card Footer */}
                                    <Box sx={{ bgcolor: '#2563eb', color: '#ffffff', py: 0.6, textAlign: 'center', fontSize: '10px', fontWeight: 800 }}>
                                        ClassTech® Verified Student Identity Card
                                    </Box>
                                </Box>
                            )}
                        </DialogContent>
                        <DialogActions sx={{ p: 2 }}>
                            <Button onClick={() => setIdCardModal({ open: false, student: null, format: 'vertical' })}>Close</Button>
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

export default StudentList;
