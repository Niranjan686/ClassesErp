import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Grid, Paper, Card, CardContent, Button, Chip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    CircularProgress, Alert, Avatar, Tabs, Tab, TextField, MenuItem,
    Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Divider, IconButton, Tooltip
} from '@mui/material';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUserGraduate, faCalendarCheck, faBookOpen, faEnvelopeOpenText,
    faComments, faCheckCircle, faClock, faTriangleExclamation,
    faPlus, faFileLines, faMoneyBillWave, faReceipt, faPrint,
    faAward, faTrophy
} from '@fortawesome/free-solid-svg-icons';
import { useLocation } from 'react-router-dom';
import Navbar from '../Common/Navbar';
import Sidebar from '../Dashboard/Sidebar';
import api from '../../api';

const COLORS = ['#10b981', '#ef4444', '#0284c7'];

const StudentPortal = () => {
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [activeTab, setActiveTab] = useState(0); // 0: Overview, 1: Attendance, 2: Fees & Receipts, 3: Exam Marksheets, 4: Leaves, 5: Complaints
    const [studentData, setStudentData] = useState(null);
    const [attendanceStats, setAttendanceStats] = useState(null);
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [myLeaves, setMyLeaves] = useState([]);
    const [myComplaints, setMyComplaints] = useState([]);
    const [feeLedger, setFeeLedger] = useState(null);
    const [reportCardData, setReportCardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

    // Leave Form State
    const [leaveForm, setLeaveForm] = useState({
        leaveType: 'Personal / Family',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        reason: ''
    });
    const [submittingLeave, setSubmittingLeave] = useState(false);

    // Complaint Form State
    const [complaintForm, setComplaintForm] = useState({
        category: 'Faculty & Teaching',
        subject: '',
        description: '',
        priority: 'Medium'
    });
    const [submittingComplaint, setSubmittingComplaint] = useState(false);

    // Receipt Modal State
    const [receiptModal, setReceiptModal] = useState({ open: false, tx: null });

    // Load active tab from query params if specified
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tabParam = params.get('tab');
        if (tabParam === 'attendance') setActiveTab(1);
        else if (tabParam === 'fees') setActiveTab(2);
        else if (tabParam === 'exams') setActiveTab(3);
        else if (tabParam === 'leave') setActiveTab(4);
        else if (tabParam === 'complaint') setActiveTab(5);
    }, [location.search]);

    // Fetch Student Profile & Data
    const fetchStudentProfile = async () => {
        try {
            setLoading(true);
            const storedUser = localStorage.getItem('user');
            if (!storedUser) return;
            const parsedUser = JSON.parse(storedUser);

            const studentId = parsedUser.studentId || parsedUser.id;
            if (!studentId) return;

            const [profileRes, historyRes, leavesRes, complaintsRes, feeRes, examRes] = await Promise.all([
                api.get(`/students/${studentId}`).catch(() => ({ data: parsedUser })),
                api.get(`/attendance/student-history/${studentId}`).catch(() => ({ data: { history: [], stats: {} } })),
                api.get(`/leaves/my-leaves/${studentId}`).catch(() => ({ data: [] })),
                api.get(`/complaints/my-complaints/${studentId}`).catch(() => ({ data: [] })),
                api.get(`/fees/student/${studentId}`).catch(() => ({ data: null })),
                api.get(`/exams/student/${studentId}/report-card`).catch(() => ({ data: null }))
            ]);

            setStudentData(profileRes.data);
            setAttendanceStats(historyRes.data.stats || profileRes.data.attendanceStats || {});
            setAttendanceHistory(historyRes.data.history || []);
            setMyLeaves(leavesRes.data);
            setMyComplaints(complaintsRes.data);
            setFeeLedger(feeRes.data);
            setReportCardData(examRes.data);
        } catch (err) {
            console.error(err);
            setToast({ open: true, message: 'Could not load student data', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudentProfile();
    }, []);

    // Handle Leave Submission
    const handleApplyLeave = async (e) => {
        e.preventDefault();
        if (!leaveForm.reason.trim()) return;

        try {
            setSubmittingLeave(true);
            await api.post('/leaves/apply', {
                applicantId: studentData._id,
                applicantType: 'Student',
                applicantName: `${studentData.fname} ${studentData.lname}`,
                identifier: studentData.grno,
                branchId: studentData.branchId?._id || studentData.branchId,
                courseId: studentData.courseId?._id || studentData.courseId,
                batchId: studentData.batchId?._id || studentData.batchId,
                ...leaveForm
            });

            setToast({ open: true, message: 'Leave application submitted to center admin!', severity: 'success' });
            setLeaveForm({
                leaveType: 'Personal / Family',
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0],
                reason: ''
            });
            fetchStudentProfile();
        } catch (err) {
            setToast({ open: true, message: err.response?.data?.message || 'Failed to submit leave', severity: 'error' });
        } finally {
            setSubmittingLeave(false);
        }
    };

    // Handle Complaint Submission
    const handleComplaintSubmit = async (e) => {
        e.preventDefault();
        if (!complaintForm.subject.trim() || !complaintForm.description.trim()) return;

        try {
            setSubmittingComplaint(true);
            await api.post('/complaints', {
                studentId: studentData._id,
                studentName: `${studentData.fname} ${studentData.lname}`,
                grno: studentData.grno,
                branchId: studentData.branchId?._id || studentData.branchId,
                courseName: studentData.courseId?.courseName || 'Certified IT Course',
                batchName: studentData.batchId?.batchName || 'Regular Batch',
                ...complaintForm
            });

            setToast({ open: true, message: 'Grievance ticket created! Admin will review shortly.', severity: 'success' });
            setComplaintForm({
                category: 'Faculty & Teaching',
                subject: '',
                description: '',
                priority: 'Medium'
            });
            fetchStudentProfile();
        } catch (err) {
            setToast({ open: true, message: 'Failed to submit grievance', severity: 'error' });
        } finally {
            setSubmittingComplaint(false);
        }
    };

    const attendancePct = attendanceStats?.percentage !== undefined ? attendanceStats.percentage : 92;

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f0f9ff' }}>
            <Navbar onToggleSidebar={() => setMobileOpen(!mobileOpen)} />
            <Sidebar mobileOpen={mobileOpen} onToggleSidebar={() => setMobileOpen(!mobileOpen)} />

            <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, mt: '70px', ml: { xs: 0, md: '260px' }, width: { xs: '100%', md: 'calc(100% - 260px)' }, boxSizing: 'border-box', overflowX: 'hidden' }}>
                <Box sx={{ width: '100%' }}>
                    {/* Student Hero Banner */}
                    <Paper
                        sx={{
                            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                            color: '#ffffff',
                            p: { xs: 2.5, md: 3.5 },
                            borderRadius: '16px',
                            mb: 3,
                            boxShadow: '0 8px 25px rgba(2, 132, 199, 0.25)',
                            display: 'flex',
                            flexDirection: { xs: 'column', md: 'row' },
                            justifyContent: 'space-between',
                            alignItems: { xs: 'flex-start', md: 'center' },
                            gap: 2
                        }}
                    >
                        <Box display="flex" alignItems="center" gap={2}>
                            <Avatar
                                sx={{
                                    width: { xs: 50, md: 64 },
                                    height: { xs: 50, md: 64 },
                                    bgcolor: '#ffffff',
                                    color: '#0284c7',
                                    fontWeight: 900,
                                    fontSize: '24px',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                                }}
                            >
                                {studentData?.fname ? studentData.fname[0].toUpperCase() : 'S'}
                            </Avatar>
                            <Box>
                                <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
                                    <Typography variant="h5" fontWeight="900">
                                        {studentData?.fname} {studentData?.lname}
                                    </Typography>
                                    <Chip
                                        label={`GR: ${studentData?.grno || 'KCC-2024-0001'}`}
                                        sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 800 }}
                                    />
                                    <Chip
                                        label={studentData?.status || 'Active Enrolled'}
                                        size="small"
                                        sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 800 }}
                                    />
                                </Box>
                                <Typography variant="body2" sx={{ color: '#e0f2fe', mt: 0.5 }}>
                                    {studentData?.courseId?.courseName || 'Certified Computer Course'} • {studentData?.batchId?.batchName || 'Morning Batch'} ({studentData?.batchId?.timing || '08:00 AM - 09:30 AM'})
                                </Typography>
                            </Box>
                        </Box>

                        <Box display="flex" gap={1} flexWrap="wrap">
                            <Button
                                variant="contained"
                                startIcon={<FontAwesomeIcon icon={faEnvelopeOpenText} />}
                                onClick={() => setActiveTab(4)}
                                sx={{ bgcolor: '#ffffff', color: '#0284c7', fontWeight: 800, textTransform: 'none', borderRadius: '10px', '&:hover': { bgcolor: '#f0f9ff' } }}
                            >
                                Apply Leave
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<FontAwesomeIcon icon={faComments} />}
                                onClick={() => setActiveTab(5)}
                                sx={{ borderColor: 'rgba(255,255,255,0.4)', color: '#fff', fontWeight: 800, textTransform: 'none', borderRadius: '10px', '&:hover': { borderColor: '#fff' } }}
                            >
                                Raise Ticket
                            </Button>
                        </Box>
                    </Paper>

                    {/* Navigation Tabs */}
                    <Paper sx={{ mb: 3, borderRadius: '12px', border: '1px solid #e0f2fe' }}>
                        <Tabs
                            value={activeTab}
                            onChange={(e, val) => setActiveTab(val)}
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={{
                                '& .MuiTab-root': { fontWeight: 800, textTransform: 'none', py: 1.5, fontSize: '13px' },
                                '& .Mui-selected': { color: '#0284c7' }
                            }}
                        >
                            <Tab icon={<FontAwesomeIcon icon={faUserGraduate} />} iconPosition="start" label="Overview" />
                            <Tab icon={<FontAwesomeIcon icon={faCalendarCheck} />} iconPosition="start" label="Attendance Register" />
                            <Tab icon={<FontAwesomeIcon icon={faReceipt} />} iconPosition="start" label="Fee Receipts & Ledger" />
                            <Tab icon={<FontAwesomeIcon icon={faTrophy} />} iconPosition="start" label="Exam Results & Marksheets" />
                            <Tab icon={<FontAwesomeIcon icon={faEnvelopeOpenText} />} iconPosition="start" label={`My Leaves (${myLeaves.length})`} />
                            <Tab icon={<FontAwesomeIcon icon={faComments} />} iconPosition="start" label={`Grievance Box (${myComplaints.length})`} />
                        </Tabs>
                    </Paper>

                    {/* Tab 0: Overview & Dashboard */}
                    {activeTab === 0 && (
                        <Grid container spacing={2.5}>
                            {/* Attendance Meter */}
                            <Grid item xs={12} md={4}>
                                <Paper sx={{ p: 3, borderRadius: '14px', border: '1px solid #e0f2fe', textAlign: 'center', height: '100%' }}>
                                    <Typography variant="subtitle2" fontWeight="800" color="#64748b" mb={1}>
                                        ATTENDANCE COMPLIANCE
                                    </Typography>
                                    <Box sx={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Box position="relative" display="inline-flex">
                                            <CircularProgress
                                                variant="determinate"
                                                value={attendancePct}
                                                size={130}
                                                thickness={6}
                                                sx={{ color: attendancePct >= 75 ? '#10b981' : '#ef4444' }}
                                            />
                                            <Box
                                                top={0}
                                                left={0}
                                                bottom={0}
                                                right={0}
                                                position="absolute"
                                                display="flex"
                                                alignItems="center"
                                                justifyContent="center"
                                                flexDirection="column"
                                            >
                                                <Typography variant="h4" fontWeight="900" color="#0f172a">
                                                    {attendancePct}%
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">Present</Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                    <Chip
                                        label={attendancePct >= 75 ? '✓ Exam Eligible (>= 75%)' : '⚠️ Defaulter Warning (< 75%)'}
                                        sx={{
                                            bgcolor: attendancePct >= 75 ? '#dcfce7' : '#fee2e2',
                                            color: attendancePct >= 75 ? '#166534' : '#991b1b',
                                            fontWeight: 800,
                                            mt: 2
                                        }}
                                    />
                                </Paper>
                            </Grid>

                            {/* Academic & Course Progress */}
                            <Grid item xs={12} md={8}>
                                <Paper sx={{ p: 3, borderRadius: '14px', border: '1px solid #e0f2fe', height: '100%' }}>
                                    <Typography variant="h6" fontWeight="800" color="#0f172a" mb={2}>
                                        Course Modules & Curriculum
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary" mb={2}>
                                        {studentData?.courseId?.description || 'Practical lab curriculum covering key digital skills.'}
                                    </Typography>

                                    <Grid container spacing={1.5}>
                                        {(studentData?.courseId?.syllabus || ['Fundamentals of OS & MS-Office', 'Live Practical Exercises', 'Database Concepts', 'Final Project']).map((mod, idx) => (
                                            <Grid item xs={12} sm={6} key={idx}>
                                                <Paper sx={{ p: 1.5, bgcolor: '#f0f9ff', borderRadius: '10px', border: '1px solid #bae6fd', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Box sx={{ width: 28, height: 28, borderRadius: '6px', bgcolor: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 900 }}>
                                                        {idx + 1}
                                                    </Box>
                                                    <Typography variant="body2" fontWeight="700" color="#0f172a">{mod}</Typography>
                                                </Paper>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Paper>
                            </Grid>
                        </Grid>
                    )}

                    {/* Tab 1: Attendance History */}
                    {activeTab === 1 && (
                        <Paper sx={{ p: 3, borderRadius: '14px', border: '1px solid #e0f2fe' }}>
                            <Typography variant="h6" fontWeight="800" color="#0f172a" mb={2}>
                                My Daily Punch Records
                            </Typography>
                            <TableContainer>
                                <Table>
                                    <TableHead sx={{ backgroundColor: '#f0f9ff' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Date</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Status</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Time In</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Verification Mode</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {(attendanceHistory.length > 0 ? attendanceHistory : [
                                            { date: '2026-08-23', status: 'Present', inTime: '08:05 AM', method: 'RFID Scanner' },
                                            { date: '2026-08-22', status: 'Present', inTime: '08:00 AM', method: 'Roll Punch' },
                                            { date: '2026-08-21', status: 'Present', inTime: '08:10 AM', method: 'RFID Scanner' }
                                        ]).map((row, idx) => (
                                            <TableRow key={idx} hover>
                                                <TableCell sx={{ fontWeight: 700 }}>{row.date}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={row.status}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: row.status === 'Present' ? '#dcfce7' : row.status === 'Leave' ? '#e0f2fe' : '#fee2e2',
                                                            color: row.status === 'Present' ? '#166534' : row.status === 'Leave' ? '#0369a1' : '#991b1b',
                                                            fontWeight: 800
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell>{row.inTime || '08:00 AM'}</TableCell>
                                                <TableCell>{row.method || 'Rapid Attendance'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    )}

                    {/* Tab 2: Fee Receipts & Ledger */}
                    {activeTab === 2 && (
                        <Box>
                            {/* Summary Cards */}
                            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                                <Grid item xs={12} sm={4}>
                                    <Card sx={{ borderRadius: '14px', border: '1px solid #e0f2fe', bgcolor: '#ffffff' }}>
                                        <CardContent sx={{ p: 2.5 }}>
                                            <Typography variant="caption" color="textSecondary" fontWeight="800">TOTAL COURSE FEE</Typography>
                                            <Typography variant="h4" fontWeight="900" color="#0f172a" my={0.5}>
                                                ₹{(feeLedger?.student?.totalFees || studentData?.totalFees || 0).toLocaleString()}
                                            </Typography>
                                            <Typography variant="caption" color="#0284c7" fontWeight="700">All Modules Included</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Card sx={{ borderRadius: '14px', border: '1px solid #bbf7d0', bgcolor: '#f0fdf4' }}>
                                        <CardContent sx={{ p: 2.5 }}>
                                            <Typography variant="caption" color="#166534" fontWeight="800">TOTAL AMOUNT PAID</Typography>
                                            <Typography variant="h4" fontWeight="900" color="#16a34a" my={0.5}>
                                                ₹{(feeLedger?.student?.paidFees || studentData?.paidFees || 0).toLocaleString()}
                                            </Typography>
                                            <Typography variant="caption" color="#166534" fontWeight="700">Receipts Issued</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Card sx={{ borderRadius: '14px', border: '1px solid #fecaca', bgcolor: '#fef2f2' }}>
                                        <CardContent sx={{ p: 2.5 }}>
                                            <Typography variant="caption" color="#991b1b" fontWeight="800">REMAINING BALANCE</Typography>
                                            <Typography variant="h4" fontWeight="900" color="#dc2626" my={0.5}>
                                                ₹{(feeLedger?.student?.balanceFees !== undefined ? feeLedger.student.balanceFees : (studentData?.balanceFees || 0)).toLocaleString()}
                                            </Typography>
                                            <Typography variant="caption" color="#991b1b" fontWeight="700">Payable at Accounts</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>

                            {/* Receipts Ledger */}
                            <Paper sx={{ p: 3, borderRadius: '14px', border: '1px solid #e0f2fe' }}>
                                <Typography variant="h6" fontWeight="800" color="#0f172a" mb={2}>
                                    Official Payment Receipts
                                </Typography>
                                {(!feeLedger?.history || feeLedger.history.length === 0) ? (
                                    <Typography color="textSecondary">No payment receipts recorded yet.</Typography>
                                ) : (
                                    <TableContainer>
                                        <Table>
                                            <TableHead sx={{ bgcolor: '#f0f9ff' }}>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 800 }}>Receipt #</TableCell>
                                                    <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
                                                    <TableCell sx={{ fontWeight: 800 }}>Amount Paid</TableCell>
                                                    <TableCell sx={{ fontWeight: 800 }}>Payment Channel</TableCell>
                                                    <TableCell sx={{ fontWeight: 800 }}>Remaining Balance</TableCell>
                                                    <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Download / Print</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {feeLedger.history.map((tx) => (
                                                    <TableRow key={tx._id} hover>
                                                        <TableCell>
                                                            <Chip label={tx.receiptNo} size="small" sx={{ bgcolor: '#e0f2fe', color: '#0284c7', fontWeight: 800 }} />
                                                        </TableCell>
                                                        <TableCell>{tx.paymentDate}</TableCell>
                                                        <TableCell sx={{ fontWeight: 900, color: '#16a34a' }}>₹{tx.amountPaid.toLocaleString()}</TableCell>
                                                        <TableCell>{tx.paymentMode}</TableCell>
                                                        <TableCell sx={{ fontWeight: 700, color: tx.remainingBalance > 0 ? '#dc2626' : '#16a34a' }}>
                                                            ₹{tx.remainingBalance.toLocaleString()}
                                                        </TableCell>
                                                        <TableCell sx={{ textAlign: 'right' }}>
                                                            <Button
                                                                size="small"
                                                                variant="outlined"
                                                                startIcon={<FontAwesomeIcon icon={faPrint} />}
                                                                onClick={() => window.print()}
                                                                sx={{ borderColor: '#0284c7', color: '#0284c7', fontWeight: 700, textTransform: 'none' }}
                                                            >
                                                                Print Receipt
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                            </Paper>
                        </Box>
                    )}

                    {/* Tab 3: Exam Results & Marksheets */}
                    {activeTab === 3 && (
                        <Box>
                            {!reportCardData || reportCardData.marksheet?.length === 0 ? (
                                <Paper sx={{ p: 5, textAlign: 'center', borderRadius: '14px', border: '1px solid #e0f2fe' }}>
                                    <Typography color="textSecondary">No published assessment marks recorded for your account yet.</Typography>
                                </Paper>
                            ) : (
                                <Paper sx={{ p: 3.5, borderRadius: '14px', border: '2px solid #0284c7', bgcolor: '#ffffff' }}>
                                    {/* Certificate Marksheet Header */}
                                    <Box textAlign="center" borderBottom="2px solid #e0f2fe" pb={2} mb={3}>
                                        <Typography variant="h5" fontWeight="900" color="#0284c7">
                                            ClassTech Student Performance Marksheet
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary" textTransform="uppercase">
                                            Academic Scores, Theory, Practical, and Aggregate Evaluation
                                        </Typography>
                                    </Box>

                                    {/* Overall Scorecard Bar */}
                                    <Paper sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '10px', border: '1px solid #cbd5e1', mb: 3 }}>
                                        <Grid container spacing={2} textAlign="center">
                                            <Grid item xs={3}>
                                                <Typography variant="caption" color="textSecondary">Total Marks</Typography>
                                                <Typography variant="h6" fontWeight="900">{reportCardData.summary?.totalMarksEarned} / {reportCardData.summary?.totalMaxPossible}</Typography>
                                            </Grid>
                                            <Grid item xs={3}>
                                                <Typography variant="caption" color="textSecondary">Aggregate %</Typography>
                                                <Typography variant="h6" fontWeight="900" color="#0284c7">{reportCardData.summary?.overallPercentage}%</Typography>
                                            </Grid>
                                            <Grid item xs={3}>
                                                <Typography variant="caption" color="textSecondary">Overall Grade</Typography>
                                                <Typography variant="h6" fontWeight="900" color="#16a34a">{reportCardData.summary?.overallGrade}</Typography>
                                            </Grid>
                                            <Grid item xs={3}>
                                                <Typography variant="caption" color="textSecondary">Outcome</Typography>
                                                <Chip label={reportCardData.summary?.finalResult} sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 900, mt: 0.5 }} />
                                            </Grid>
                                        </Grid>
                                    </Paper>

                                    {/* Marks Table */}
                                    <TableContainer sx={{ mb: 3, border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                        <Table size="small">
                                            <TableHead sx={{ bgcolor: '#f0f9ff' }}>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 800 }}>Assessment Title</TableCell>
                                                    <TableCell sx={{ fontWeight: 800 }}>Type</TableCell>
                                                    <TableCell sx={{ fontWeight: 800 }}>Theory</TableCell>
                                                    <TableCell sx={{ fontWeight: 800 }}>Practical</TableCell>
                                                    <TableCell sx={{ fontWeight: 800 }}>Total Marks</TableCell>
                                                    <TableCell sx={{ fontWeight: 800 }}>Grade</TableCell>
                                                    <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {reportCardData.marksheet.map((m, mIdx) => (
                                                    <TableRow key={mIdx}>
                                                        <TableCell sx={{ fontWeight: 700 }}>{m.examTitle}</TableCell>
                                                        <TableCell>{m.examType}</TableCell>
                                                        <TableCell>{m.theoryObtained} / {m.maxTheory}</TableCell>
                                                        <TableCell>{m.practicalObtained} / {m.maxPractical}</TableCell>
                                                        <TableCell sx={{ fontWeight: 800 }}>{m.totalObtained} / {m.totalMax}</TableCell>
                                                        <TableCell sx={{ fontWeight: 800, color: '#0284c7' }}>{m.grade}</TableCell>
                                                        <TableCell sx={{ fontWeight: 800, color: m.resultStatus === 'Passed' ? '#16a34a' : '#dc2626' }}>
                                                            {m.resultStatus}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>

                                    <Box textAlign="right">
                                        <Button
                                            variant="contained"
                                            startIcon={<FontAwesomeIcon icon={faPrint} />}
                                            onClick={() => window.print()}
                                            sx={{ bgcolor: '#0284c7', fontWeight: 800, textTransform: 'none' }}
                                        >
                                            Print Official Marksheet
                                        </Button>
                                    </Box>
                                </Paper>
                            )}
                        </Box>
                    )}

                    {/* Tab 4: Leaves */}
                    {activeTab === 4 && (
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={5}>
                                <Paper sx={{ p: 3, borderRadius: '14px', border: '1px solid #e0f2fe' }}>
                                    <Typography variant="h6" fontWeight="800" color="#0f172a" mb={2}>
                                        Apply for Absence Leave
                                    </Typography>
                                    <form onSubmit={handleApplyLeave}>
                                        <TextField
                                            label="Reason Category"
                                            select
                                            fullWidth
                                            size="small"
                                            value={leaveForm.leaveType}
                                            onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                                            sx={{ mb: 2 }}
                                        >
                                            <MenuItem value="Personal / Family">Personal / Family</MenuItem>
                                            <MenuItem value="Medical / Health">Medical / Health</MenuItem>
                                            <MenuItem value="College / School Exam">College / School Exam</MenuItem>
                                            <MenuItem value="Out of Station">Out of Station</MenuItem>
                                        </TextField>

                                        <TextField
                                            label="From Date"
                                            type="date"
                                            fullWidth
                                            size="small"
                                            InputLabelProps={{ shrink: true }}
                                            value={leaveForm.startDate}
                                            onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                                            sx={{ mb: 2 }}
                                        />

                                        <TextField
                                            label="To Date"
                                            type="date"
                                            fullWidth
                                            size="small"
                                            InputLabelProps={{ shrink: true }}
                                            value={leaveForm.endDate}
                                            onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                                            sx={{ mb: 2 }}
                                        />

                                        <TextField
                                            label="Detailed Reason"
                                            multiline
                                            rows={3}
                                            fullWidth
                                            required
                                            value={leaveForm.reason}
                                            onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                                            sx={{ mb: 2 }}
                                        />

                                        <Button
                                            type="submit"
                                            variant="contained"
                                            fullWidth
                                            disabled={submittingLeave}
                                            sx={{ bgcolor: '#0284c7', '&:hover': { bgcolor: '#0369a1' }, fontWeight: 800, py: 1 }}
                                        >
                                            {submittingLeave ? 'Submitting...' : 'Submit Leave Request'}
                                        </Button>
                                    </form>
                                </Paper>
                            </Grid>

                            <Grid item xs={12} md={7}>
                                <Paper sx={{ p: 3, borderRadius: '14px', border: '1px solid #e0f2fe' }}>
                                    <Typography variant="h6" fontWeight="800" color="#0f172a" mb={2}>
                                        My Leave Applications ({myLeaves.length})
                                    </Typography>
                                    {myLeaves.length === 0 ? (
                                        <Typography color="textSecondary">No leave requests submitted yet.</Typography>
                                    ) : (
                                        <TableContainer>
                                            <Table size="small">
                                                <TableHead sx={{ bgcolor: '#f0f9ff' }}>
                                                    <TableRow>
                                                        <TableCell sx={{ fontWeight: 800 }}>Dates</TableCell>
                                                        <TableCell sx={{ fontWeight: 800 }}>Category</TableCell>
                                                        <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {myLeaves.map((l) => (
                                                        <TableRow key={l._id}>
                                                            <TableCell>{l.startDate} to {l.endDate}</TableCell>
                                                            <TableCell>{l.leaveType}</TableCell>
                                                            <TableCell>
                                                                <Chip
                                                                    label={l.status}
                                                                    size="small"
                                                                    sx={{
                                                                        bgcolor: l.status === 'Approved' ? '#dcfce7' : l.status === 'Rejected' ? '#fee2e2' : '#fef3c7',
                                                                        color: l.status === 'Approved' ? '#166534' : l.status === 'Rejected' ? '#991b1b' : '#92400e',
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
                                </Paper>
                            </Grid>
                        </Grid>
                    )}

                    {/* Tab 5: Grievances */}
                    {activeTab === 5 && (
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={5}>
                                <Paper sx={{ p: 3, borderRadius: '14px', border: '1px solid #e0f2fe' }}>
                                    <Typography variant="h6" fontWeight="800" color="#0f172a" mb={2}>
                                        Submit Grievance / Feedback
                                    </Typography>
                                    <form onSubmit={handleComplaintSubmit}>
                                        <TextField
                                            label="Issue Category"
                                            select
                                            fullWidth
                                            size="small"
                                            value={complaintForm.category}
                                            onChange={(e) => setComplaintForm({ ...complaintForm, category: e.target.value })}
                                            sx={{ mb: 2 }}
                                        >
                                            <MenuItem value="Faculty & Teaching">Faculty & Teaching</MenuItem>
                                            <MenuItem value="PC / Lab Hardware">PC / Lab Hardware</MenuItem>
                                            <MenuItem value="Batch Timing">Batch Timing</MenuItem>
                                            <MenuItem value="Fees & Billing">Fees & Billing</MenuItem>
                                            <MenuItem value="Other">Other</MenuItem>
                                        </TextField>

                                        <TextField
                                            label="Subject"
                                            fullWidth
                                            size="small"
                                            required
                                            value={complaintForm.subject}
                                            onChange={(e) => setComplaintForm({ ...complaintForm, subject: e.target.value })}
                                            sx={{ mb: 2 }}
                                        />

                                        <TextField
                                            label="Description"
                                            multiline
                                            rows={3}
                                            fullWidth
                                            required
                                            value={complaintForm.description}
                                            onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                                            sx={{ mb: 2 }}
                                        />

                                        <Button
                                            type="submit"
                                            variant="contained"
                                            fullWidth
                                            disabled={submittingComplaint}
                                            sx={{ bgcolor: '#f97316', '&:hover': { bgcolor: '#ea580c' }, fontWeight: 800, py: 1 }}
                                        >
                                            {submittingComplaint ? 'Submitting...' : 'Submit Grievance Ticket'}
                                        </Button>
                                    </form>
                                </Paper>
                            </Grid>

                            <Grid item xs={12} md={7}>
                                <Paper sx={{ p: 3, borderRadius: '14px', border: '1px solid #e0f2fe' }}>
                                    <Typography variant="h6" fontWeight="800" color="#0f172a" mb={2}>
                                        My Grievance History ({myComplaints.length})
                                    </Typography>
                                    {myComplaints.length === 0 ? (
                                        <Typography color="textSecondary">No complaints submitted.</Typography>
                                    ) : (
                                        <TableContainer>
                                            <Table size="small">
                                                <TableHead sx={{ bgcolor: '#f0f9ff' }}>
                                                    <TableRow>
                                                        <TableCell sx={{ fontWeight: 800 }}>Category</TableCell>
                                                        <TableCell sx={{ fontWeight: 800 }}>Subject</TableCell>
                                                        <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {myComplaints.map((c) => (
                                                        <TableRow key={c._id}>
                                                            <TableCell>{c.category}</TableCell>
                                                            <TableCell sx={{ fontWeight: 700 }}>{c.subject}</TableCell>
                                                            <TableCell>
                                                                <Chip
                                                                    label={c.status}
                                                                    size="small"
                                                                    sx={{
                                                                        bgcolor: c.status === 'Resolved' ? '#dcfce7' : '#fef3c7',
                                                                        color: c.status === 'Resolved' ? '#166534' : '#92400e',
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
                                </Paper>
                            </Grid>
                        </Grid>
                    )}

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
                </Box>
            </Box>
        </Box>
    );
};

export default StudentPortal;
