import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TextField, MenuItem, Chip, Grid, CircularProgress, Alert, Snackbar, Tabs, Tab
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faFileLines, faPrint, faFileCsv, faTriangleExclamation, faUsers, faMoneyBillWave, faCalendarCheck
} from '@fortawesome/free-solid-svg-icons';
import AdminLayout from '../Common/AdminLayout';
import api from '../../api';

const Reports = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

    // Reports data
    const [dailyData, setDailyData] = useState([]);
    const [defaultersData, setDefaultersData] = useState([]);
    const [directoryData, setDirectoryData] = useState([]);
    const [financialData, setFinancialData] = useState(null);

    // Filters
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [batches, setBatches] = useState([]);
    const [selectedBatchId, setSelectedBatchId] = useState('ALL');

    useEffect(() => {
        const fetchBatches = async () => {
            try {
                const res = await api.get('/batches/active');
                setBatches(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchBatches();
    }, []);

    const fetchReport = async () => {
        try {
            setLoading(true);
            if (activeTab === 0) {
                const res = await api.get(`/reports/daily-register?date=${selectedDate}&batchId=${selectedBatchId}`);
                setDailyData(res.data);
            } else if (activeTab === 1) {
                const res = await api.get('/reports/defaulters?threshold=75');
                setDefaultersData(res.data);
            } else if (activeTab === 2) {
                const res = await api.get('/reports/student-directory');
                setDirectoryData(res.data);
            } else if (activeTab === 3) {
                const res = await api.get('/reports/financial-summary');
                setFinancialData(res.data);
            }
        } catch (err) {
            setToast({ open: true, message: 'Failed to fetch report data', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [activeTab, selectedDate, selectedBatchId]);

    const handleExportCSV = () => {
        let headers = [];
        let rows = [];
        let filename = 'Keerti_Report.csv';

        if (activeTab === 0) {
            headers = ['GR No', 'Roll No', 'Student Name', 'Course', 'Batch', 'Timing', 'Status', 'In-Time', 'Mobile'];
            rows = dailyData.map(d => [d.grno, d.rollno, `"${d.name}"`, d.course, d.batch, d.timing, d.status, d.inTime, d.mobileNo]);
            filename = `Daily_Attendance_${selectedDate}.csv`;
        } else if (activeTab === 1) {
            headers = ['GR No', 'Roll No', 'Student Name', 'Course', 'Batch', 'Total Sessions', 'Present Days', 'Attendance %', 'Mobile'];
            rows = defaultersData.map(d => [d.grno, d.rollno, `"${d.name}"`, d.course, d.batch, d.totalSessions, d.presentDays, `${d.percentage}%`, d.mobileNo]);
            filename = `Attendance_Defaulters_Below_75pct.csv`;
        } else if (activeTab === 2) {
            headers = ['GR No', 'Roll No', 'Student Name', 'Course', 'Batch', 'Total Fees', 'Paid Fees', 'Balance Fees', 'Contact', 'RFID'];
            rows = directoryData.map(d => [d.grno, d.rollno, `"${d.name}"`, d.course, d.batch, d.totalFees, d.paidFees, d.balanceFees, d.mobileNo, d.rfid]);
            filename = `Student_Directory_Master.csv`;
        }

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <AdminLayout>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                <Box>
                    <Typography variant="h5" fontWeight="900" color="#0f172a">
                        Reports & Analytical Registers
                    </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Export compliance attendance sheets, attendance defaulters (&lt; 75%), and financial fee registers
                        </Typography>
                    </Box>

                    <Box display="flex" gap={1.5}>
                        <Button
                            variant="outlined"
                            startIcon={<FontAwesomeIcon icon={faFileCsv} />}
                            onClick={handleExportCSV}
                            sx={{ borderColor: '#0284c7', color: '#0284c7', fontWeight: 800, textTransform: 'none' }}
                        >
                            Export CSV
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<FontAwesomeIcon icon={faPrint} />}
                            onClick={() => window.print()}
                            sx={{ bgcolor: '#0284c7', '&:hover': { bgcolor: '#0369a1' }, fontWeight: 800, textTransform: 'none' }}
                        >
                            Print Report
                        </Button>
                    </Box>
                </Box>

                {/* Tabs */}
                <Paper sx={{ mb: 3, borderRadius: '12px', border: '1px solid #e0f2fe' }}>
                    <Tabs
                        value={activeTab}
                        onChange={(e, val) => setActiveTab(val)}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{
                            '& .MuiTab-root': { fontWeight: 800, textTransform: 'none', py: 1.5 },
                            '& .Mui-selected': { color: '#0284c7' }
                        }}
                    >
                        <Tab icon={<FontAwesomeIcon icon={faCalendarCheck} style={{ marginRight: 6 }} />} iconPosition="start" label="Daily Attendance Register" />
                        <Tab icon={<FontAwesomeIcon icon={faTriangleExclamation} style={{ marginRight: 6 }} />} iconPosition="start" label="Defaulters (< 75% Attendance)" />
                        <Tab icon={<FontAwesomeIcon icon={faUsers} style={{ marginRight: 6 }} />} iconPosition="start" label="Student Master Directory" />
                        <Tab icon={<FontAwesomeIcon icon={faMoneyBillWave} style={{ marginRight: 6 }} />} iconPosition="start" label="Fee Collection Register" />
                    </Tabs>
                </Paper>

                {/* Filter Controls for Tab 0 */}
                {activeTab === 0 && (
                    <Paper sx={{ p: 2.5, mb: 3, borderRadius: '12px', border: '1px solid #e0f2fe' }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={6} md={3}>
                                <TextField
                                    label="Select Date"
                                    type="date"
                                    fullWidth
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                                <TextField
                                    label="Filter by Batch"
                                    select
                                    fullWidth
                                    size="small"
                                    value={selectedBatchId}
                                    onChange={(e) => setSelectedBatchId(e.target.value)}
                                >
                                    <MenuItem value="ALL">All Batches</MenuItem>
                                    {batches.map(b => <MenuItem key={b._id} value={b._id}>{b.batchName}</MenuItem>)}
                                </TextField>
                            </Grid>
                        </Grid>
                    </Paper>
                )}

                {/* Report Content */}
                {loading ? (
                    <Box display="flex" justifyContent="center" py={6}>
                        <CircularProgress sx={{ color: '#0284c7' }} />
                    </Box>
                ) : (
                    <Paper sx={{ borderRadius: '14px', border: '1px solid #e0f2fe', overflow: 'hidden' }}>
                        {activeTab === 0 && (
                            <TableContainer>
                                <Table>
                                    <TableHead sx={{ backgroundColor: '#f0f9ff' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Roll</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>GR No</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Student Name</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Batch & Timing</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Status</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Punch In-Time</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Contact</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {dailyData.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4, color: '#64748b' }}>
                                                    No attendance logged for {selectedDate}.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            dailyData.map((d, idx) => (
                                                <TableRow key={idx} hover>
                                                    <TableCell sx={{ fontWeight: 800 }}>#{d.rollno}</TableCell>
                                                    <TableCell>{d.grno}</TableCell>
                                                    <TableCell sx={{ fontWeight: 700 }}>{d.name}</TableCell>
                                                    <TableCell>{d.batch} ({d.timing})</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={d.status}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: d.status === 'Present' ? '#dcfce7' : d.status === 'Absent' ? '#fee2e2' : '#e0f2fe',
                                                                color: d.status === 'Present' ? '#166534' : d.status === 'Absent' ? '#991b1b' : '#0369a1',
                                                                fontWeight: 800
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>{d.inTime || 'N/A'}</TableCell>
                                                    <TableCell>{d.mobileNo}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}

                        {activeTab === 1 && (
                            <TableContainer>
                                <Table>
                                    <TableHead sx={{ backgroundColor: '#f0f9ff' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>GR No</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Student Name</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Course & Batch</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Total Sessions</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Present Days</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Attendance %</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Parent Contact</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {defaultersData.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4, color: '#16a34a', fontWeight: 700 }}>
                                                    🎉 Excellent! Zero students below 75% attendance threshold.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            defaultersData.map((d, idx) => (
                                                <TableRow key={idx} hover>
                                                    <TableCell>{d.grno}</TableCell>
                                                    <TableCell sx={{ fontWeight: 800 }}>{d.name}</TableCell>
                                                    <TableCell>{d.course} • {d.batch}</TableCell>
                                                    <TableCell>{d.totalSessions}</TableCell>
                                                    <TableCell>{d.presentDays}</TableCell>
                                                    <TableCell>
                                                        <Chip label={`${d.percentage}%`} size="small" sx={{ bgcolor: '#fee2e2', color: '#991b1b', fontWeight: 900 }} />
                                                    </TableCell>
                                                    <TableCell>{d.mobileNo}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}

                        {activeTab === 2 && (
                            <TableContainer>
                                <Table>
                                    <TableHead sx={{ backgroundColor: '#f0f9ff' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>GR No</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Student Name</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Course</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Batch</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Fee Balance</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Contact</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>RFID Punch ID</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {directoryData.map((d, idx) => (
                                            <TableRow key={idx} hover>
                                                <TableCell sx={{ fontWeight: 800 }}>{d.grno}</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>{d.name}</TableCell>
                                                <TableCell>{d.course}</TableCell>
                                                <TableCell>{d.batch}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={d.balanceFees === 0 ? 'Clear' : `₹${d.balanceFees}`}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: d.balanceFees === 0 ? '#dcfce7' : '#fee2e2',
                                                            color: d.balanceFees === 0 ? '#166534' : '#991b1b',
                                                            fontWeight: 800
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell>{d.mobileNo}</TableCell>
                                                <TableCell>{d.rfid || 'N/A'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}

                        {activeTab === 3 && financialData && (
                            <Box sx={{ p: 3 }}>
                                <Grid container spacing={3} sx={{ mb: 3 }}>
                                    <Grid item xs={12} sm={4}>
                                        <Paper sx={{ p: 2.5, bgcolor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px' }}>
                                            <Typography variant="caption" sx={{ color: '#0369a1', fontWeight: 800 }}>TOTAL EXPECTED</Typography>
                                            <Typography variant="h4" fontWeight="900" color="#0369a1" my={0.5}>₹{financialData.totalExpected?.toLocaleString()}</Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <Paper sx={{ p: 2.5, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px' }}>
                                            <Typography variant="caption" sx={{ color: '#166534', fontWeight: 800 }}>TOTAL COLLECTED</Typography>
                                            <Typography variant="h4" fontWeight="900" color="#16a34a" my={0.5}>₹{financialData.totalCollected?.toLocaleString()}</Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <Paper sx={{ p: 2.5, bgcolor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px' }}>
                                            <Typography variant="caption" sx={{ color: '#991b1b', fontWeight: 800 }}>TOTAL PENDING BALANCE</Typography>
                                            <Typography variant="h4" fontWeight="900" color="#dc2626" my={0.5}>₹{financialData.totalBalance?.toLocaleString()}</Typography>
                                        </Paper>
                                    </Grid>
                                </Grid>
                            </Box>
                        )}
                    </Paper>
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
        </AdminLayout>
    );
};

export default Reports;
