import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
    Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TextField, MenuItem, Chip, IconButton, Grid, CircularProgress, Alert, Snackbar, Avatar,
    Tabs, Tab, Card, CardContent, Divider, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCalendarCheck, faQrcode, faCheck, faTimes, faClock, faUserCheck,
    faFloppyDisk, faRotateRight, faBolt, faCircleCheck, faTowerBroadcast, faPaperPlane
} from '@fortawesome/free-solid-svg-icons';
import AdminLayout from '../Common/AdminLayout';
import api from '../../api';

const AttendanceEntry = () => {
    const location = useLocation();
    const [activeMode, setActiveMode] = useState(0); // 0: Batch Sheet, 1: Quick RFID Punch

    // Batches & Selected state
    const [batches, setBatches] = useState([]);
    const [selectedBatchId, setSelectedBatchId] = useState('');
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);

    // Roster & Sheet state
    const [roster, setRoster] = useState([]);
    const [batchDetails, setBatchDetails] = useState(null);
    const [isAlreadyMarked, setIsAlreadyMarked] = useState(false);
    const [loadingRoster, setLoadingRoster] = useState(false);
    const [saving, setSaving] = useState(false);

    // Quick Punch state
    const [punchInput, setPunchInput] = useState('');
    const [punchLoading, setPunchLoading] = useState(false);
    const [lastPunchedStudent, setLastPunchedStudent] = useState(null);
    const [punchHistory, setPunchHistory] = useState([]);
    const punchInputRef = useRef(null);

    // Absentee Broadcast SMS State
    const [openSmsModal, setOpenSmsModal] = useState(false);
    const [sendingSms, setSendingSms] = useState(false);

    // Toast
    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

    // 1. Fetch Batches on mount
    useEffect(() => {
        const fetchBatches = async () => {
            try {
                const res = await api.get('/batches/active');
                const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
                setBatches(list);

                const searchParams = new URLSearchParams(location.search);
                const queryBatchId = searchParams.get('batchId');

                if (queryBatchId && list.some(b => b._id === queryBatchId)) {
                    setSelectedBatchId(queryBatchId);
                } else if (list.length > 0) {
                    setSelectedBatchId(list[0]._id);
                }
            } catch (err) {
                setToast({ open: true, message: 'Failed to load batches', severity: 'error' });
            }
        };
        fetchBatches();
    }, [location.search]);

    // 2. Fetch Roster
    const fetchRoster = async () => {
        if (!selectedBatchId) return;
        try {
            setLoadingRoster(true);
            const res = await api.get(`/attendance/batch-roster?batchId=${selectedBatchId}&date=${attendanceDate}`);
            setBatchDetails(res.data.batch);
            setIsAlreadyMarked(res.data.isAlreadyMarked);
            setRoster(res.data.roster);
        } catch (err) {
            setToast({ open: true, message: 'Failed to load batch student roster', severity: 'error' });
        } finally {
            setLoadingRoster(false);
        }
    };

    useEffect(() => {
        if (selectedBatchId) {
            fetchRoster();
        }
    }, [selectedBatchId, attendanceDate]);

    const handleStatusChange = (studentId, newStatus) => {
        const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setRoster(prev => prev.map(item => {
            if (item.studentId === studentId) {
                return {
                    ...item,
                    status: newStatus,
                    inTime: (newStatus === 'Present' || newStatus === 'Late') && !item.inTime ? nowTime : item.inTime
                };
            }
            return item;
        }));
    };

    const handleMarkAll = (status) => {
        const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setRoster(prev => prev.map(item => ({
            ...item,
            status,
            inTime: status === 'Present' ? nowTime : ''
        })));
    };

    // Save Batch Attendance
    const handleSaveBatchAttendance = async () => {
        if (!selectedBatchId || roster.length === 0) return;
        try {
            setSaving(true);
            const payload = {
                batchId: selectedBatchId,
                courseId: batchDetails?.courseId?._id || batchDetails?.courseId,
                date: attendanceDate,
                records: roster.map(r => ({
                    studentId: r.studentId,
                    status: r.status,
                    inTime: r.inTime,
                    remarks: r.remarks
                })),
                markedBy: 'Admin'
            };

            await api.post('/attendance/mark-batch', payload);
            setIsAlreadyMarked(true);
            setToast({ open: true, message: 'Super attendance saved successfully!', severity: 'success' });
        } catch (err) {
            setToast({ open: true, message: 'Failed to save attendance', severity: 'error' });
        } finally {
            setSaving(false);
        }
    };

    // Broadcast SMS to Parents of Absent Students
    const handleBroadcastAbsenteeSMS = async () => {
        try {
            setSendingSms(true);
            const res = await api.post('/attendance/broadcast-absentee-sms', {
                batchId: selectedBatchId,
                date: attendanceDate
            });

            setToast({ open: true, message: res.data.message, severity: 'success' });
            setOpenSmsModal(false);
        } catch (err) {
            setToast({ open: true, message: 'Failed to send parent absentee SMS', severity: 'error' });
        } finally {
            setSendingSms(false);
        }
    };

    // Quick Punch In
    const handleQuickPunch = async (e) => {
        e.preventDefault();
        if (!punchInput.trim()) return;

        try {
            setPunchLoading(true);
            const res = await api.post('/attendance/quick-punch', {
                punchCode: punchInput.trim(),
                date: attendanceDate,
                inTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });

            setLastPunchedStudent(res.data.student);
            setPunchHistory(prev => [
                {
                    ...res.data.student,
                    timestamp: new Date().toLocaleTimeString(),
                    status: 'Present'
                },
                ...prev.slice(0, 15)
            ]);

            setPunchInput('');
            setToast({ open: true, message: res.data.message, severity: 'success' });
            if (selectedBatchId) fetchRoster();
        } catch (err) {
            setToast({
                open: true,
                message: err.response?.data?.message || 'Student not found or punch failed',
                severity: 'error'
            });
        } finally {
            setPunchLoading(false);
            if (punchInputRef.current) punchInputRef.current.focus();
        }
    };

    const presentCount = roster.filter(r => r.status === 'Present').length;
    const absentCount = roster.filter(r => r.status === 'Absent').length;
    const lateCount = roster.filter(r => r.status === 'Late').length;
    const leaveCount = roster.filter(r => r.status === 'Leave').length;
    const totalCount = roster.length;
    const attendancePercentage = totalCount > 0 ? Math.round(((presentCount + lateCount) / totalCount) * 100) : 0;

    return (
        <AdminLayout>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={2}>
                <Box>
                    <Typography variant="h5" fontWeight="900" color="#0f172a">
                        Super Attendance Engine
                    </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Mark batch attendance, record QR/RFID punches, and dispatch parent absentee SMS alerts
                        </Typography>
                    </Box>

                    {/* Mode Tabs */}
                    <Paper sx={{ borderRadius: '10px', p: 0.5, border: '1px solid #e0f2fe', bgcolor: '#ffffff' }}>
                        <Tabs
                            value={activeMode}
                            onChange={(e, val) => setActiveMode(val)}
                            sx={{ minHeight: '36px', '& .Mui-selected': { color: '#0284c7', fontWeight: 800 } }}
                        >
                            <Tab
                                icon={<FontAwesomeIcon icon={faCalendarCheck} style={{ marginRight: 6 }} />}
                                iconPosition="start"
                                label="Daily Batch Sheet"
                                sx={{ minHeight: '36px', py: 0.5, px: 2, textTransform: 'none', fontWeight: 700 }}
                            />
                            <Tab
                                icon={<FontAwesomeIcon icon={faQrcode} style={{ marginRight: 6 }} />}
                                iconPosition="start"
                                label="Rapid QR / RFID Punch"
                                sx={{ minHeight: '36px', py: 0.5, px: 2, textTransform: 'none', fontWeight: 700 }}
                            />
                        </Tabs>
                    </Paper>
                </Box>

                {/* MODE 0: BATCH-WISE ATTENDANCE SHEET */}
                {activeMode === 0 && (
                    <>
                        {/* Selector Controls Bar */}
                        <Paper sx={{ p: 2.5, mb: 3, borderRadius: '12px', border: '1px solid #e0f2fe' }}>
                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} sm={6} md={4}>
                                    <TextField
                                        label="Select Batch"
                                        select
                                        fullWidth
                                        size="small"
                                        value={selectedBatchId}
                                        onChange={(e) => setSelectedBatchId(e.target.value)}
                                    >
                                        {batches.map(b => (
                                            <MenuItem key={b._id} value={b._id}>
                                                {b.batchName} ({b.timing})
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <TextField
                                        label="Attendance Date"
                                        type="date"
                                        fullWidth
                                        size="small"
                                        InputLabelProps={{ shrink: true }}
                                        value={attendanceDate}
                                        onChange={(e) => setAttendanceDate(e.target.value)}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={12} md={5} display="flex" justifyContent={{ xs: 'flex-start', md: 'flex-end' }} gap={1.5} flexWrap="wrap">
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() => handleMarkAll('Present')}
                                        sx={{ borderColor: '#10b981', color: '#10b981', fontWeight: 700, textTransform: 'none' }}
                                    >
                                        Mark All Present
                                    </Button>
                                    {absentCount > 0 && (
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<FontAwesomeIcon icon={faTowerBroadcast} />}
                                            onClick={() => setOpenSmsModal(true)}
                                            sx={{ borderColor: '#f97316', color: '#f97316', fontWeight: 800, textTransform: 'none' }}
                                        >
                                            SMS Absent Parents ({absentCount})
                                        </Button>
                                    )}
                                    <Button
                                        variant="contained"
                                        startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <FontAwesomeIcon icon={faFloppyDisk} />}
                                        onClick={handleSaveBatchAttendance}
                                        disabled={saving || roster.length === 0}
                                        sx={{
                                            backgroundColor: '#0284c7',
                                            '&:hover': { backgroundColor: '#0369a1' },
                                            fontWeight: 800,
                                            textTransform: 'none',
                                            px: 2.5
                                        }}
                                    >
                                        {saving ? 'Saving...' : 'Save Attendance'}
                                    </Button>
                                </Grid>
                            </Grid>
                        </Paper>

                        {/* Summary Stats Cards */}
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={6} sm={3}>
                                <Card sx={{ borderRadius: '10px', border: '1px solid #e0f2fe', bgcolor: '#fff' }}>
                                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                        <Typography variant="caption" color="textSecondary" fontWeight="800">TOTAL</Typography>
                                        <Typography variant="h5" fontWeight="900" color="#0f172a">{totalCount}</Typography>
                                        <Typography variant="caption" color="textSecondary">{batchDetails?.roomNo || 'Lab 1'}</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <Card sx={{ borderRadius: '10px', border: '1px solid #dcfce7', bgcolor: '#f0fdf4' }}>
                                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                        <Typography variant="caption" sx={{ color: '#166534', fontWeight: 800 }}>PRESENT</Typography>
                                        <Typography variant="h5" fontWeight="900" sx={{ color: '#16a34a' }}>{presentCount}</Typography>
                                        <Typography variant="caption" sx={{ color: '#166534' }}>{attendancePercentage}% Rate</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <Card sx={{ borderRadius: '10px', border: '1px solid #fee2e2', bgcolor: '#fef2f2' }}>
                                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                        <Typography variant="caption" sx={{ color: '#991b1b', fontWeight: 800 }}>ABSENT</Typography>
                                        <Typography variant="h5" fontWeight="900" sx={{ color: '#dc2626' }}>{absentCount}</Typography>
                                        <Typography variant="caption" sx={{ color: '#991b1b' }}>{lateCount} Late • {leaveCount} Leave</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <Card sx={{ borderRadius: '10px', border: '1px solid #e0f2fe', bgcolor: isAlreadyMarked ? '#f0fdf4' : '#fffbeb' }}>
                                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                        <Typography variant="caption" sx={{ color: isAlreadyMarked ? '#166534' : '#92400e', fontWeight: 800 }}>STATUS</Typography>
                                        <Typography variant="h6" fontWeight="900" sx={{ color: isAlreadyMarked ? '#16a34a' : '#d97706' }}>
                                            {isAlreadyMarked ? '✓ Saved' : '⏳ Pending'}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        {/* Student Roster Table */}
                        {loadingRoster ? (
                            <Box display="flex" justifyContent="center" py={6}>
                                <CircularProgress sx={{ color: '#0284c7' }} />
                            </Box>
                        ) : roster.length === 0 ? (
                            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '12px' }}>
                                <Typography color="textSecondary">No active students enrolled in this batch.</Typography>
                            </Paper>
                        ) : (
                            <Paper sx={{ borderRadius: '12px', border: '1px solid #e0f2fe', overflow: 'hidden' }}>
                                <TableContainer>
                                    <Table>
                                        <TableHead sx={{ backgroundColor: '#f0f9ff' }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 800, color: '#0369a1', width: '80px' }}>Roll No</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: '#0369a1', width: '120px' }}>GR No</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Student Name</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: '#0369a1', textAlign: 'center', width: '320px' }}>Attendance Status</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: '#0369a1', width: '130px' }}>In-Time</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Remarks</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {roster.map((student) => (
                                                <TableRow
                                                    key={student.studentId}
                                                    hover
                                                    sx={{
                                                        backgroundColor:
                                                            student.status === 'Absent' ? 'rgba(239, 68, 68, 0.04)' :
                                                            student.status === 'Leave' ? 'rgba(2, 132, 199, 0.04)' : 'inherit'
                                                    }}
                                                >
                                                    <TableCell sx={{ fontWeight: 800, color: '#0f172a' }}>
                                                        #{student.rollno}
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>
                                                        {student.grno}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight="800" color="#0f172a">
                                                            {student.fname} {student.lname}
                                                        </Typography>
                                                        <Typography variant="caption" color="textSecondary">
                                                            Ph: {student.mobileNo}
                                                        </Typography>
                                                    </TableCell>

                                                    {/* Status Selection Buttons */}
                                                    <TableCell sx={{ textAlign: 'center' }}>
                                                        <Box display="flex" justifyContent="center" gap={0.8}>
                                                            {['Present', 'Absent', 'Late', 'Leave'].map(st => {
                                                                const isSelected = student.status === st;
                                                                const colorStyles =
                                                                    st === 'Present' ? { bg: '#10b981', light: '#ecfdf5', text: '#065f46' } :
                                                                    st === 'Absent' ? { bg: '#ef4444', light: '#fef2f2', text: '#991b1b' } :
                                                                    st === 'Late' ? { bg: '#f59e0b', light: '#fffbeb', text: '#92400e' } :
                                                                    { bg: '#0284c7', light: '#e0f2fe', text: '#0369a1' };

                                                                return (
                                                                    <Button
                                                                        key={st}
                                                                        size="small"
                                                                        onClick={() => handleStatusChange(student.studentId, st)}
                                                                        sx={{
                                                                            minWidth: '65px',
                                                                            py: '3px',
                                                                            px: '6px',
                                                                            fontSize: '11.5px',
                                                                            fontWeight: 800,
                                                                            textTransform: 'none',
                                                                            borderRadius: '20px',
                                                                            backgroundColor: isSelected ? colorStyles.bg : colorStyles.light,
                                                                            color: isSelected ? '#ffffff' : colorStyles.text,
                                                                            border: `1px solid ${isSelected ? colorStyles.bg : 'transparent'}`,
                                                                            '&:hover': {
                                                                                backgroundColor: colorStyles.bg,
                                                                                color: '#ffffff'
                                                                            }
                                                                        }}
                                                                    >
                                                                        {st}
                                                                    </Button>
                                                                );
                                                            })}
                                                        </Box>
                                                    </TableCell>

                                                    <TableCell>
                                                        <TextField
                                                            size="small"
                                                            placeholder="08:00 AM"
                                                            value={student.inTime || ''}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                setRoster(prev => prev.map(it => it.studentId === student.studentId ? { ...it, inTime: val } : it));
                                                            }}
                                                            sx={{ width: '105px', '& .MuiInputBase-input': { fontSize: '12px', py: '5px' } }}
                                                        />
                                                    </TableCell>

                                                    <TableCell>
                                                        <TextField
                                                            size="small"
                                                            placeholder="Remarks"
                                                            value={student.remarks || ''}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                setRoster(prev => prev.map(it => it.studentId === student.studentId ? { ...it, remarks: val } : it));
                                                            }}
                                                            sx={{ width: '100%', '& .MuiInputBase-input': { fontSize: '12px', py: '5px' } }}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                        )}
                    </>
                )}

                {/* MODE 1: RAPID QR / RFID PUNCH */}
                {activeMode === 1 && (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={5}>
                            <Paper sx={{ p: 3, borderRadius: '14px', border: '1px solid #e0f2fe', bgcolor: '#ffffff', mb: 3 }}>
                                <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                                    <Box sx={{ width: 40, height: 40, borderRadius: '8px', bgcolor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FontAwesomeIcon icon={faBolt} size="lg" />
                                    </Box>
                                    <Box>
                                        <Typography variant="h6" fontWeight="900" color="#0f172a">
                                            Super Punch Scanner
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            Rapid scan RFID card, QR payload, or enter Student Roll No
                                        </Typography>
                                    </Box>
                                </Box>

                                <form onSubmit={handleQuickPunch}>
                                    <TextField
                                        inputRef={punchInputRef}
                                        fullWidth
                                        autoFocus
                                        label="Scan Card ID or Enter Roll / GR No"
                                        value={punchInput}
                                        onChange={(e) => setPunchInput(e.target.value)}
                                        placeholder="e.g. RFID-1001 or 1 or KCC-2024-0001"
                                        disabled={punchLoading}
                                        sx={{ mb: 2 }}
                                        InputProps={{
                                            startAdornment: <FontAwesomeIcon icon={faQrcode} style={{ color: '#0284c7', marginRight: 10 }} />
                                        }}
                                    />
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        fullWidth
                                        disabled={punchLoading || !punchInput.trim()}
                                        sx={{
                                            backgroundColor: '#0284c7',
                                            '&:hover': { backgroundColor: '#0369a1' },
                                            py: 1.2,
                                            fontWeight: 800,
                                            textTransform: 'none'
                                        }}
                                    >
                                        {punchLoading ? 'Punching...' : 'Punch Attendance (Enter ↵)'}
                                    </Button>
                                </form>
                            </Paper>

                            {lastPunchedStudent && (
                                <Paper sx={{ p: 3, borderRadius: '14px', border: '2px solid #10b981', bgcolor: '#f0fdf4', textAlign: 'center' }}>
                                    <Avatar sx={{ width: 50, height: 50, bgcolor: '#10b981', margin: '0 auto 10px' }}>
                                        <FontAwesomeIcon icon={faCheck} size="lg" />
                                    </Avatar>
                                    <Typography variant="h6" fontWeight="900" color="#166534">
                                        Attendance Marked Present!
                                    </Typography>
                                    <Typography variant="h6" fontWeight="800" color="#0f172a" mt={0.5}>
                                        {lastPunchedStudent.fullName}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary" display="block">
                                        {lastPunchedStudent.course} • {lastPunchedStudent.batch}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#0369a1', fontWeight: 700, mt: 0.5, display: 'block' }}>
                                        Punch Time: {lastPunchedStudent.punchTime}
                                    </Typography>
                                </Paper>
                            )}
                        </Grid>

                        <Grid item xs={12} md={7}>
                            <Paper sx={{ p: 3, borderRadius: '14px', border: '1px solid #e0f2fe' }}>
                                <Typography variant="h6" fontWeight="900" color="#0f172a" mb={2}>
                                    Live Session Punch History
                                </Typography>

                                {punchHistory.length === 0 ? (
                                    <Typography color="textSecondary" sx={{ py: 6, textAlign: 'center' }}>
                                        No punches in this session yet.
                                    </Typography>
                                ) : (
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead sx={{ backgroundColor: '#f0f9ff' }}>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 800 }}>Time</TableCell>
                                                    <TableCell sx={{ fontWeight: 800 }}>Student Name</TableCell>
                                                    <TableCell sx={{ fontWeight: 800 }}>Batch</TableCell>
                                                    <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {punchHistory.map((item, idx) => (
                                                    <TableRow key={idx} hover>
                                                        <TableCell sx={{ fontWeight: 800, color: '#0284c7' }}>{item.timestamp}</TableCell>
                                                        <TableCell sx={{ fontWeight: 700 }}>{item.fullName} ({item.grno})</TableCell>
                                                        <TableCell>{item.batch}</TableCell>
                                                        <TableCell>
                                                            <Chip label="Present" size="small" sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 800 }} />
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

                {/* Absentee SMS Broadcast Dialog */}
                <Dialog open={openSmsModal} onClose={() => setOpenSmsModal(false)} maxWidth="xs" fullWidth>
                    <DialogTitle sx={{ fontWeight: 800, bgcolor: '#f97316', color: '#fff' }}>
                        Broadcast Absentee Parent SMS
                    </DialogTitle>
                    <DialogContent sx={{ p: 2.5, mt: 1 }}>
                        <Typography variant="body2" color="textSecondary" mb={2}>
                            Shoot parent absentee alert SMS for all <strong>{absentCount} absent students</strong> in this batch today?
                        </Typography>
                        <Box sx={{ p: 1.5, bgcolor: '#fff7ed', borderRadius: '8px', border: '1px solid #ffedd5' }}>
                            <Typography variant="caption" color="#9a3412" fontWeight="600">
                                📱 SMS will be dispatched to registered guardian numbers with student GR No & Batch timing.
                            </Typography>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0' }}>
                        <Button onClick={() => setOpenSmsModal(false)}>Cancel</Button>
                        <Button
                            variant="contained"
                            disabled={sendingSms}
                            startIcon={<FontAwesomeIcon icon={faPaperPlane} />}
                            onClick={handleBroadcastAbsenteeSMS}
                            sx={{ bgcolor: '#f97316', '&:hover': { bgcolor: '#ea580c' }, fontWeight: 800 }}
                        >
                            {sendingSms ? 'Broadcasting...' : 'Send Parent Alerts'}
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

export default AttendanceEntry;
