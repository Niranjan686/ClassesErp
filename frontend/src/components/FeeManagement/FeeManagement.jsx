import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Grid, Paper, Card, CardContent, Button, Chip, TextField,
    MenuItem, CircularProgress, Alert, Snackbar, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent,
    DialogActions, IconButton, Tooltip, Avatar, Tabs, Tab, InputAdornment, Divider
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faMoneyBillWave, faPlus, faReceipt, faSearch, faPrint, faFileCsv,
    faHandHoldingDollar, faCreditCard, faMobileScreen, faBuildingColumns,
    faMoneyCheck, faBell, faCheckCircle, faClock, faUserGraduate, faPhone
} from '@fortawesome/free-solid-svg-icons';
import AdminLayout from '../Common/AdminLayout';
import { PageTransition, triggerAcademicConfetti } from '../Common/MotionWrapper';
import api from '../../api';

const PAYMENT_MODES = [
    'Cash',
    'UPI / GPay / PhonePe',
    'Cheque',
    'Bank Transfer (NEFT/IMPS)',
    'Credit / Debit Card'
];

const FeeManagement = () => {
    const [activeTab, setActiveTab] = useState(0); // 0: Transactions Ledger, 1: Pending Dues & Defaulters
    const [analytics, setAnalytics] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [modeFilter, setModeFilter] = useState('ALL');

    // Dialog States
    const [openCollectDialog, setOpenCollectDialog] = useState(false);
    const [selectedStudentForPay, setSelectedStudentForPay] = useState(null);
    const [receiptModal, setReceiptModal] = useState({ open: false, transaction: null, student: null });
    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
    const [submitting, setSubmitting] = useState(false);

    // Collect Form
    const [collectForm, setCollectForm] = useState({
        studentId: '',
        amountPaid: '',
        paymentMode: 'UPI / GPay / PhonePe',
        transactionRef: '',
        discount: 0,
        paymentDate: new Date().toISOString().split('T')[0],
        remarks: 'Tuition installment fee received'
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [anaRes, txRes, stuRes] = await Promise.all([
                api.get('/fees/analytics'),
                api.get('/fees/transactions'),
                api.get('/students')
            ]);
            setAnalytics(anaRes.data?.data || anaRes.data || null);
            setTransactions(Array.isArray(txRes.data) ? txRes.data : (txRes.data?.data || []));
            setStudents(Array.isArray(stuRes.data) ? stuRes.data : (stuRes.data?.data || []));
        } catch (err) {
            setToast({ open: true, message: 'Failed to load fee records', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenCollect = (preselectedStudent = null) => {
        const student = preselectedStudent || (students.length > 0 ? students[0] : null);
        setSelectedStudentForPay(student);
        setCollectForm({
            studentId: student?._id || '',
            amountPaid: student ? Math.min(2000, student.balanceFees || 2000) : '',
            paymentMode: 'UPI / GPay / PhonePe',
            transactionRef: '',
            discount: 0,
            paymentDate: new Date().toISOString().split('T')[0],
            remarks: 'Installment fee payment received'
        });
        setOpenCollectDialog(true);
    };

    const handleStudentSelectChange = (studentId) => {
        const student = students.find(s => s._id === studentId);
        setSelectedStudentForPay(student);
        setCollectForm(prev => ({
            ...prev,
            studentId,
            amountPaid: student ? Math.min(2000, student.balanceFees || 2000) : prev.amountPaid
        }));
    };

    const handleSaveFeePayment = async (e) => {
        e.preventDefault();
        if (!collectForm.studentId || !collectForm.amountPaid) {
            setToast({ open: true, message: 'Please select student and enter amount', severity: 'error' });
            return;
        }

        try {
            setSubmitting(true);
            const res = await api.post('/fees/collect', collectForm);
            setToast({ open: true, message: res.data.message, severity: 'success' });
            setOpenCollectDialog(false);
            triggerAcademicConfetti();

            // Open Receipt Modal immediately for printing
            setReceiptModal({
                open: true,
                transaction: res.data.transaction,
                student: selectedStudentForPay
            });

            fetchData();
        } catch (err) {
            setToast({ open: true, message: err.response?.data?.message || 'Error recording fee payment', severity: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleSendReminder = async (studentId, name) => {
        try {
            const res = await api.post('/fees/send-reminder', { studentId });
            setToast({ open: true, message: res.data.message, severity: 'success' });
        } catch (err) {
            setToast({ open: true, message: err.response?.data?.message || 'Failed to dispatch reminder', severity: 'error' });
        }
    };

    const handlePrintReceipt = () => {
        window.print();
    };

    const handleExportCSV = () => {
        const headers = ['Receipt No', 'Date', 'Student Name', 'GR No', 'Course', 'Amount Paid', 'Payment Mode', 'Remaining Balance', 'Tx Ref', 'Remarks'];
        const rows = transactions.map(tx => [
            tx.receiptNo,
            tx.paymentDate,
            `"${tx.studentName}"`,
            tx.grno,
            `"${tx.courseName}"`,
            tx.amountPaid,
            `"${tx.paymentMode}"`,
            tx.remainingBalance,
            `"${tx.transactionRef || ''}"`,
            `"${tx.remarks?.replace(/"/g, '""') || ''}"`
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `ClassTech_Fee_Transactions_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredTransactions = transactions.filter(tx => {
        const matchesSearch = tx.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.grno?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.receiptNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.courseName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesMode = modeFilter === 'ALL' || tx.paymentMode === modeFilter;
        return matchesSearch && matchesMode;
    });

    const filteredDefaulters = (analytics?.defaulters || []).filter(d => {
        return d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.grno?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.courseName?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <AdminLayout>
            <PageTransition>
            {/* Header Banner */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                <Box>
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <Typography variant="h5" fontWeight="900" color="#0f172a">
                            Fee Management & Receipts Desk
                        </Typography>
                                <Chip label="Accounts & Billing" sx={{ bgcolor: '#e0f2fe', color: '#0284c7', fontWeight: 800 }} />
                            </Box>
                            <Typography variant="body2" color="textSecondary" sx={{ mt: 0.3 }}>
                                Collect student tuition installments, generate printable receipts, track balances, and dispatch fee alerts
                            </Typography>
                        </Box>

                        <Box display="flex" gap={1.5} flexWrap="wrap">
                            <Button
                                variant="outlined"
                                startIcon={<FontAwesomeIcon icon={faFileCsv} />}
                                onClick={handleExportCSV}
                                sx={{ borderColor: '#0284c7', color: '#0284c7', fontWeight: 800, textTransform: 'none', borderRadius: '10px' }}
                            >
                                Export CSV
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<FontAwesomeIcon icon={faPlus} />}
                                onClick={() => handleOpenCollect()}
                                sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, fontWeight: 800, textTransform: 'none', px: 2.5, borderRadius: '10px' }}
                            >
                                Collect Fee Payment
                            </Button>
                        </Box>
                    </Box>

                    {/* Financial KPIs */}
                    <Grid container spacing={2.5} sx={{ mb: 3 }}>
                        {/* Total Expected Revenue */}
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{ borderRadius: '14px', border: '1px solid #e0f2fe', bgcolor: '#ffffff', minHeight: '138px' }}>
                                <CardContent sx={{ p: 2.5 }}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800 }}>EXPECTED FEES</Typography>
                                        <Box sx={{ width: 38, height: 38, borderRadius: '10px', bgcolor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <FontAwesomeIcon icon={faHandHoldingDollar} />
                                        </Box>
                                    </Box>
                                    <Typography variant="h4" fontWeight="900" color="#0f172a" mb={0.5}>
                                        ₹{(analytics?.kpis?.totalExpected || 0).toLocaleString()}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">Enrolled Course Value</Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Total Collected */}
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{ borderRadius: '14px', border: '1px solid #bbf7d0', bgcolor: '#f0fdf4', minHeight: '138px' }}>
                                <CardContent sx={{ p: 2.5 }}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                        <Typography variant="caption" sx={{ color: '#166534', fontWeight: 800 }}>FEES COLLECTED</Typography>
                                        <Box sx={{ width: 38, height: 38, borderRadius: '10px', bgcolor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <FontAwesomeIcon icon={faCheckCircle} />
                                        </Box>
                                    </Box>
                                    <Typography variant="h4" fontWeight="900" color="#16a34a" mb={0.5}>
                                        ₹{(analytics?.kpis?.totalCollected || 0).toLocaleString()}
                                    </Typography>
                                    <Chip
                                        label={`${analytics?.kpis?.collectionRate || 0}% Realized`}
                                        size="small"
                                        sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 800, fontSize: '11px', height: '22px' }}
                                    />
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Outstanding Balance */}
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{ borderRadius: '14px', border: '1px solid #fecaca', bgcolor: '#fef2f2', minHeight: '138px' }}>
                                <CardContent sx={{ p: 2.5 }}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                        <Typography variant="caption" sx={{ color: '#991b1b', fontWeight: 800 }}>PENDING DUES</Typography>
                                        <Box sx={{ width: 38, height: 38, borderRadius: '10px', bgcolor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <FontAwesomeIcon icon={faClock} />
                                        </Box>
                                    </Box>
                                    <Typography variant="h4" fontWeight="900" color="#dc2626" mb={0.5}>
                                        ₹{(analytics?.kpis?.totalBalance || 0).toLocaleString()}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#991b1b', fontWeight: 700 }}>
                                        {analytics?.kpis?.totalDefaultersCount || 0} Students with Dues
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Payment Modes */}
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{ borderRadius: '14px', border: '1px solid #e0f2fe', bgcolor: '#ffffff', minHeight: '138px' }}>
                                <CardContent sx={{ p: 2.5 }}>
                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800 }}>PAYMENT CHANNELS</Typography>
                                    <Box display="flex" gap={1} flexWrap="wrap" mt={1}>
                                        <Chip label="UPI / GPay" size="small" sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 700 }} />
                                        <Chip label="Cash" size="small" sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 700 }} />
                                        <Chip label="Bank/NEFT" size="small" sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 700 }} />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Tabs Navigation */}
                    <Paper sx={{ mb: 3, borderRadius: '12px', border: '1px solid #e0f2fe' }}>
                        <Tabs
                            value={activeTab}
                            onChange={(e, val) => setActiveTab(val)}
                            sx={{
                                '& .MuiTab-root': { fontWeight: 800, textTransform: 'none', py: 1.5 },
                                '& .Mui-selected': { color: '#0284c7' }
                            }}
                        >
                            <Tab label={`Payment Transactions Ledger (${transactions.length})`} />
                            <Tab label={`Pending Dues & Defaulters (${analytics?.defaulters?.length || 0})`} />
                        </Tabs>
                    </Paper>

                    {/* Filter & Search Bar */}
                    <Paper sx={{ p: 2, mb: 3, borderRadius: '12px', border: '1px solid #e0f2fe' }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} md={activeTab === 0 ? 8 : 12}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Search by student name, GR no, receipt number, course..."
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
                            {activeTab === 0 && (
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        select
                                        size="small"
                                        label="Filter by Payment Mode"
                                        value={modeFilter}
                                        onChange={(e) => setModeFilter(e.target.value)}
                                    >
                                        <MenuItem value="ALL">All Payment Modes</MenuItem>
                                        {PAYMENT_MODES.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                                    </TextField>
                                </Grid>
                            )}
                        </Grid>
                    </Paper>

                    {/* Tab 0: Transactions Ledger */}
                    {activeTab === 0 && (
                        loading ? (
                            <Box display="flex" justifyContent="center" py={6}>
                                <CircularProgress sx={{ color: '#0284c7' }} />
                            </Box>
                        ) : filteredTransactions.length === 0 ? (
                            <Paper sx={{ p: 5, textAlign: 'center', borderRadius: '12px', border: '1px solid #e0f2fe' }}>
                                <Typography color="textSecondary">No fee transactions found.</Typography>
                            </Paper>
                        ) : (
                            <Paper sx={{ borderRadius: '14px', border: '1px solid #e0f2fe', overflow: 'hidden' }}>
                                <TableContainer>
                                    <Table>
                                        <TableHead sx={{ backgroundColor: '#f0f9ff' }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Receipt #</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Student Details</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Course & Batch</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Payment Mode & Ref</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Amount Paid</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Remaining Balance</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: '#0369a1', textAlign: 'right' }}>Receipt</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filteredTransactions.map((tx) => (
                                                <TableRow key={tx._id} hover>
                                                    <TableCell>
                                                        <Chip label={tx.receiptNo} size="small" sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 800 }} />
                                                        <Typography variant="caption" color="textSecondary" display="block" mt={0.3}>{tx.paymentDate}</Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight="800" color="#0f172a">{tx.studentName}</Typography>
                                                        <Typography variant="caption" color="textSecondary">GR: {tx.grno}</Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight="600">{tx.courseName}</Typography>
                                                        <Typography variant="caption" color="textSecondary">{tx.batchName}</Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip label={tx.paymentMode} size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: '11px' }} />
                                                        {tx.transactionRef && (
                                                            <Typography variant="caption" color="textSecondary" display="block">Ref: {tx.transactionRef}</Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight="900" color="#16a34a">
                                                            ₹{tx.amountPaid.toLocaleString()}
                                                        </Typography>
                                                        {tx.discount > 0 && (
                                                            <Typography variant="caption" color="#64748b" display="block">Disc: ₹{tx.discount}</Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight="700" color={tx.remainingBalance > 0 ? '#ef4444' : '#16a34a'}>
                                                            ₹{tx.remainingBalance.toLocaleString()}
                                                        </Typography>
                                                        <Chip
                                                            label={tx.remainingBalance === 0 ? 'Fully Paid' : 'Partial'}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: tx.remainingBalance === 0 ? '#dcfce7' : '#fee2e2',
                                                                color: tx.remainingBalance === 0 ? '#166534' : '#991b1b',
                                                                fontSize: '10px',
                                                                height: '20px'
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ textAlign: 'right' }}>
                                                        <Tooltip title="View & Print Official Receipt">
                                                            <Button
                                                                size="small"
                                                                variant="outlined"
                                                                startIcon={<FontAwesomeIcon icon={faPrint} />}
                                                                onClick={() => setReceiptModal({ open: true, transaction: tx, student: null })}
                                                                sx={{ borderColor: '#0284c7', color: '#0284c7', textTransform: 'none', fontWeight: 800, fontSize: '11px', borderRadius: '8px' }}
                                                            >
                                                                Receipt
                                                            </Button>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                        )
                    )}

                    {/* Tab 1: Pending Dues & Defaulters */}
                    {activeTab === 1 && (
                        filteredDefaulters.length === 0 ? (
                            <Paper sx={{ p: 5, textAlign: 'center', borderRadius: '12px', border: '1px solid #e0f2fe' }}>
                                <Typography color="#16a34a" fontWeight="700">🎉 Excellent! All students have cleared their course fees.</Typography>
                            </Paper>
                        ) : (
                            <Paper sx={{ borderRadius: '14px', border: '1px solid #e0f2fe', overflow: 'hidden' }}>
                                <TableContainer>
                                    <Table>
                                        <TableHead sx={{ backgroundColor: '#f0f9ff' }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Student Name & GR</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Enrolled Course</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Total Fees</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Amount Paid</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Pending Balance</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: '#0369a1', textAlign: 'right' }}>Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filteredDefaulters.map((d) => (
                                                <TableRow key={d.id} hover>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight="800" color="#0f172a">{d.name}</Typography>
                                                        <Typography variant="caption" color="textSecondary">GR: {d.grno} • Ph: {d.phone}</Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight="600">{d.courseName}</Typography>
                                                    </TableCell>
                                                    <TableCell>₹{d.totalFees.toLocaleString()}</TableCell>
                                                    <TableCell sx={{ color: '#16a34a', fontWeight: 700 }}>₹{d.paidFees.toLocaleString()}</TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight="900" color="#dc2626">
                                                            ₹{d.balanceFees.toLocaleString()}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ textAlign: 'right' }}>
                                                        <Box display="flex" justifyContent="flex-end" gap={1}>
                                                            <Tooltip title="Shoot Due Reminder SMS to Parents">
                                                                <Button
                                                                    size="small"
                                                                    variant="outlined"
                                                                    startIcon={<FontAwesomeIcon icon={faBell} />}
                                                                    onClick={() => handleSendReminder(d.id, d.name)}
                                                                    sx={{ borderColor: '#f97316', color: '#f97316', textTransform: 'none', fontWeight: 700, borderRadius: '8px', fontSize: '11px' }}
                                                                >
                                                                    Remind SMS
                                                                </Button>
                                                            </Tooltip>
                                                            <Button
                                                                size="small"
                                                                variant="contained"
                                                                onClick={() => {
                                                                    const stuObj = students.find(s => s._id === d.id);
                                                                    handleOpenCollect(stuObj);
                                                                }}
                                                                sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, textTransform: 'none', fontWeight: 800, borderRadius: '8px', fontSize: '11px' }}
                                                            >
                                                                Collect Due
                                                            </Button>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                        )
                    )}

                    {/* Dialog: Collect Fee Payment */}
                    <Dialog open={openCollectDialog} onClose={() => setOpenCollectDialog(false)} maxWidth="sm" fullWidth>
                        <form onSubmit={handleSaveFeePayment}>
                            <DialogTitle sx={{ fontWeight: 800, bgcolor: '#10b981', color: '#fff' }}>
                                Collect Student Fee Payment
                            </DialogTitle>
                            <DialogContent sx={{ p: 3, mt: 1 }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <TextField
                                            label="Select Student"
                                            select
                                            fullWidth
                                            required
                                            value={collectForm.studentId}
                                            onChange={(e) => handleStudentSelectChange(e.target.value)}
                                        >
                                            {students.map(s => (
                                                <MenuItem key={s._id} value={s._id}>
                                                    {s.fname} {s.lname} (GR: {s.grno} • Bal: ₹{s.balanceFees !== undefined ? s.balanceFees : s.totalFees - s.paidFees})
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>

                                    {selectedStudentForPay && (
                                        <Grid item xs={12}>
                                            <Paper sx={{ p: 1.5, bgcolor: '#f0f9ff', borderRadius: '10px', border: '1px solid #bae6fd', display: 'flex', justifyContent: 'space-between' }}>
                                                <Box>
                                                    <Typography variant="caption" color="textSecondary">Course Fee Summary:</Typography>
                                                    <Typography variant="body2" fontWeight="800">
                                                        Total: ₹{selectedStudentForPay.totalFees || 0} • Paid: ₹{selectedStudentForPay.paidFees || 0}
                                                    </Typography>
                                                </Box>
                                                <Box textAlign="right">
                                                    <Typography variant="caption" color="textSecondary">Outstanding Due:</Typography>
                                                    <Typography variant="body2" fontWeight="900" color="#dc2626">
                                                        ₹{selectedStudentForPay.balanceFees !== undefined ? selectedStudentForPay.balanceFees : selectedStudentForPay.totalFees - selectedStudentForPay.paidFees}
                                                    </Typography>
                                                </Box>
                                            </Paper>
                                        </Grid>
                                    )}

                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="Amount Paid (₹)"
                                            type="number"
                                            fullWidth
                                            required
                                            value={collectForm.amountPaid}
                                            onChange={(e) => setCollectForm({ ...collectForm, amountPaid: e.target.value })}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="Payment Channel"
                                            select
                                            fullWidth
                                            value={collectForm.paymentMode}
                                            onChange={(e) => setCollectForm({ ...collectForm, paymentMode: e.target.value })}
                                        >
                                            {PAYMENT_MODES.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="Transaction Ref / Cheque No"
                                            fullWidth
                                            value={collectForm.transactionRef}
                                            onChange={(e) => setCollectForm({ ...collectForm, transactionRef: e.target.value })}
                                            placeholder="UPI Ref / Cheque 6-digit"
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="Discount / Concession (₹)"
                                            type="number"
                                            fullWidth
                                            value={collectForm.discount}
                                            onChange={(e) => setCollectForm({ ...collectForm, discount: e.target.value })}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            label="Remarks / Note"
                                            fullWidth
                                            value={collectForm.remarks}
                                            onChange={(e) => setCollectForm({ ...collectForm, remarks: e.target.value })}
                                        />
                                    </Grid>
                                </Grid>
                            </DialogContent>
                            <DialogActions sx={{ p: 2.5, borderTop: '1px solid #e0f2fe' }}>
                                <Button onClick={() => setOpenCollectDialog(false)}>Cancel</Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={submitting}
                                    sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, fontWeight: 800 }}
                                >
                                    {submitting ? 'Recording...' : 'Collect & Issue Receipt'}
                                </Button>
                            </DialogActions>
                        </form>
                    </Dialog>

                    {/* Dialog: Official Printable Fee Receipt */}
                    <Dialog open={receiptModal.open} onClose={() => setReceiptModal({ open: false, transaction: null, student: null })} maxWidth="sm" fullWidth>
                        <DialogTitle sx={{ fontWeight: 800, bgcolor: '#0284c7', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>ClassTech Official Fee Receipt</span>
                            <Button
                                size="small"
                                variant="contained"
                                startIcon={<FontAwesomeIcon icon={faPrint} />}
                                onClick={handlePrintReceipt}
                                sx={{ bgcolor: '#ffffff', color: '#0284c7', fontWeight: 800, '&:hover': { bgcolor: '#f0f9ff' } }}
                            >
                                Print
                            </Button>
                        </DialogTitle>
                        <DialogContent sx={{ p: 4, mt: 1 }}>
                            {receiptModal.transaction && (
                                <Box sx={{ border: '2px solid #0284c7', borderRadius: '12px', p: 3, bgcolor: '#ffffff' }}>
                                    {/* Receipt Header */}
                                    <Box display="flex" justifyContent="space-between" alignItems="center" borderBottom="2px solid #e0f2fe" pb={2} mb={2}>
                                        <Box>
                                            <Typography variant="h6" fontWeight="900" color="#0284c7">
                                                ClassTech Educational Campus
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary" display="block">
                                                Smart SaaS Institute Network • Official Payment Voucher
                                            </Typography>
                                        </Box>
                                        <Box textAlign="right">
                                            <Typography variant="subtitle2" fontWeight="800" color="#0f172a">
                                                {receiptModal.transaction.receiptNo}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                Date: {receiptModal.transaction.paymentDate}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {/* Student Info */}
                                    <Grid container spacing={1.5} sx={{ mb: 2 }}>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="textSecondary">Student Name:</Typography>
                                            <Typography variant="body2" fontWeight="800">{receiptModal.transaction.studentName}</Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="textSecondary">GR Number:</Typography>
                                            <Typography variant="body2" fontWeight="800">{receiptModal.transaction.grno}</Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="textSecondary">Enrolled Course:</Typography>
                                            <Typography variant="body2" fontWeight="700">{receiptModal.transaction.courseName}</Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="textSecondary">Payment Channel:</Typography>
                                            <Typography variant="body2" fontWeight="700">{receiptModal.transaction.paymentMode}</Typography>
                                        </Grid>
                                    </Grid>

                                    <Divider sx={{ my: 2 }} />

                                    {/* Financial Breakdown Table */}
                                    <Box display="flex" justifyContent="space-between" py={0.8}>
                                        <Typography variant="body2" fontWeight="600">Installment Number:</Typography>
                                        <Typography variant="body2" fontWeight="800">#{receiptModal.transaction.installmentNo || 1}</Typography>
                                    </Box>
                                    <Box display="flex" justifyContent="space-between" py={0.8} bgcolor="#f0fdf4" px={1} borderRadius="6px">
                                        <Typography variant="body2" fontWeight="800" color="#166534">Amount Received:</Typography>
                                        <Typography variant="body1" fontWeight="900" color="#16a34a">
                                            ₹{receiptModal.transaction.amountPaid.toLocaleString()}
                                        </Typography>
                                    </Box>
                                    <Box display="flex" justifyContent="space-between" py={0.8} px={1}>
                                        <Typography variant="body2" color="textSecondary">Remaining Balance Due:</Typography>
                                        <Typography variant="body2" fontWeight="800" color={receiptModal.transaction.remainingBalance > 0 ? '#dc2626' : '#16a34a'}>
                                            ₹{receiptModal.transaction.remainingBalance.toLocaleString()}
                                        </Typography>
                                    </Box>

                                    <Divider sx={{ my: 2 }} />

                                    {/* Signatures & Stamp */}
                                    <Box display="flex" justifyContent="space-between" alignItems="flex-end" pt={3}>
                                        <Box>
                                            <Typography variant="caption" color="textSecondary" display="block">Received By: {receiptModal.transaction.collectedBy || 'Accounts Desk'}</Typography>
                                            <Typography variant="caption" color="textSecondary">Computer Generated Valid Receipt</Typography>
                                        </Box>
                                        <Box textAlign="center" borderTop="1px dashed #94a3b8" pt={0.5} width="140px">
                                            <Typography variant="caption" fontWeight="700" color="#64748b">Authorized Signatory</Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            )}
                        </DialogContent>
                        <DialogActions sx={{ p: 2 }}>
                            <Button onClick={() => setReceiptModal({ open: false, transaction: null, student: null })}>Close</Button>
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

export default FeeManagement;
