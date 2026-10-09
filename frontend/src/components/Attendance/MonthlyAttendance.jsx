import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TextField, MenuItem, Chip, Grid, CircularProgress, Alert, Snackbar
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTableCells, faPrint, faFileCsv, faRotateRight, faCheckCircle, faClock
} from '@fortawesome/free-solid-svg-icons';
import AdminLayout from '../Common/AdminLayout';
import api from '../../api';

const MonthlyAttendance = () => {
    const [batches, setBatches] = useState([]);
    const [selectedBatchId, setSelectedBatchId] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });

    const [matrixData, setMatrixData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        const fetchBatches = async () => {
            try {
                const res = await api.get('/batches/active');
                const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
                setBatches(list);
                if (list.length > 0) {
                    setSelectedBatchId(list[0]._id);
                }
            } catch (err) {
                setToast({ open: true, message: 'Failed to load batches', severity: 'error' });
            }
        };
        fetchBatches();
    }, []);

    const fetchMatrix = async () => {
        if (!selectedBatchId || !selectedMonth) return;
        try {
            setLoading(true);
            const res = await api.get(`/attendance/monthly-matrix?batchId=${selectedBatchId}&yearMonth=${selectedMonth}`);
            setMatrixData(res.data);
        } catch (err) {
            setToast({ open: true, message: 'Failed to generate monthly matrix', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedBatchId && selectedMonth) {
            fetchMatrix();
        }
    }, [selectedBatchId, selectedMonth]);

    const handleExportCSV = () => {
        if (!matrixData || !matrixData.matrix) return;
        const headers = ['Roll No', 'GR No', 'Student Name', 'Mobile', ...matrixData.datesRecorded, 'Present', 'Absent', 'Late', 'Leave', 'Total Sessions', 'Attendance %'];
        const rows = matrixData.matrix.map(st => [
            st.rollno,
            st.grno,
            `"${st.name}"`,
            st.mobileNo,
            ...matrixData.datesRecorded.map(d => st.dayRecords[d] || '-'),
            st.presentCount,
            st.absentCount,
            st.lateCount,
            st.leaveCount,
            st.totalSessions,
            `${st.percentage}%`
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Monthly_Attendance_${matrixData.batch?.batchCode}_${selectedMonth}.csv`);
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
                        Monthly Attendance Matrix Grid
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Comprehensive Student × Day attendance sheet with auto percentages and CSV export
                    </Typography>
                    </Box>

                    <Box display="flex" gap={1.5}>
                        <Button
                            variant="outlined"
                            startIcon={<FontAwesomeIcon icon={faFileCsv} />}
                            onClick={handleExportCSV}
                            disabled={!matrixData || matrixData.matrix?.length === 0}
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
                            Print Matrix
                        </Button>
                    </Box>
                </Box>

                {/* Filters */}
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
                                label="Month (YYYY-MM)"
                                type="month"
                                fullWidth
                                size="small"
                                InputLabelProps={{ shrink: true }}
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                            />
                        </Grid>
                    </Grid>
                </Paper>

                {/* Matrix Table */}
                {loading ? (
                    <Box display="flex" justifyContent="center" py={6}>
                        <CircularProgress sx={{ color: '#0284c7' }} />
                    </Box>
                ) : !matrixData || matrixData.matrix?.length === 0 ? (
                    <Paper sx={{ p: 5, textAlign: 'center', borderRadius: '12px', border: '1px solid #e0f2fe' }}>
                        <Typography color="textSecondary">No attendance recorded for this batch in {selectedMonth}.</Typography>
                    </Paper>
                ) : (
                    <Paper sx={{ borderRadius: '14px', border: '1px solid #e0f2fe', overflow: 'hidden' }}>
                        <TableContainer sx={{ maxHeight: '70vh' }}>
                            <Table size="small" stickyHeader>
                                <TableHead sx={{ backgroundColor: '#f0f9ff' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1', minWidth: 60, bgcolor: '#f0f9ff' }}>Roll</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1', minWidth: 100, bgcolor: '#f0f9ff' }}>GR No</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1', minWidth: 160, bgcolor: '#f0f9ff' }}>Student Name</TableCell>

                                        {matrixData.datesRecorded.map((dateStr) => {
                                            const dayNum = dateStr.split('-')[2];
                                            return (
                                                <TableCell key={dateStr} align="center" sx={{ fontWeight: 800, color: '#0369a1', minWidth: 40, p: 0.5, bgcolor: '#f0f9ff' }}>
                                                    {dayNum}
                                                </TableCell>
                                            );
                                        })}

                                        <TableCell align="center" sx={{ fontWeight: 800, color: '#166534', minWidth: 45, bgcolor: '#f0f9ff' }}>P</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 800, color: '#991b1b', minWidth: 45, bgcolor: '#f0f9ff' }}>A</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 800, color: '#0369a1', minWidth: 45, bgcolor: '#f0f9ff' }}>Lv</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 800, color: '#0f172a', minWidth: 65, bgcolor: '#f0f9ff' }}>Rate %</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {matrixData.matrix.map((row) => {
                                        const isLow = row.percentage < 75;
                                        return (
                                            <TableRow key={row.studentId} hover>
                                                <TableCell sx={{ fontWeight: 800 }}>#{row.rollno}</TableCell>
                                                <TableCell sx={{ color: '#64748b', fontSize: '11px' }}>{row.grno}</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>{row.name}</TableCell>

                                                {matrixData.datesRecorded.map((dateStr) => {
                                                    const status = row.dayRecords[dateStr];
                                                    const bg =
                                                        status === 'Present' ? '#dcfce7' :
                                                        status === 'Absent' ? '#fee2e2' :
                                                        status === 'Late' ? '#fef3c7' :
                                                        status === 'Leave' ? '#e0f2fe' : 'transparent';
                                                    const fg =
                                                        status === 'Present' ? '#166534' :
                                                        status === 'Absent' ? '#991b1b' :
                                                        status === 'Late' ? '#92400e' :
                                                        status === 'Leave' ? '#0369a1' : '#cbd5e1';
                                                    const char =
                                                        status === 'Present' ? 'P' :
                                                        status === 'Absent' ? 'A' :
                                                        status === 'Late' ? 'L' :
                                                        status === 'Leave' ? 'Lv' : '-';

                                                    return (
                                                        <TableCell key={dateStr} align="center" sx={{ p: 0.5 }}>
                                                            <Box
                                                                sx={{
                                                                    backgroundColor: bg,
                                                                    color: fg,
                                                                    fontWeight: 900,
                                                                    fontSize: '11px',
                                                                    borderRadius: '4px',
                                                                    py: 0.3
                                                                }}
                                                            >
                                                                {char}
                                                            </Box>
                                                        </TableCell>
                                                    );
                                                })}

                                                <TableCell align="center" sx={{ fontWeight: 800, color: '#16a34a' }}>{row.presentCount}</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 800, color: '#dc2626' }}>{row.absentCount}</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 800, color: '#0284c7' }}>{row.leaveCount || 0}</TableCell>
                                                <TableCell align="center">
                                                    <Chip
                                                        label={`${row.percentage}%`}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: isLow ? '#fee2e2' : '#dcfce7',
                                                            color: isLow ? '#991b1b' : '#166534',
                                                            fontWeight: 800,
                                                            fontSize: '11px',
                                                            height: '22px'
                                                        }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
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

export default MonthlyAttendance;
