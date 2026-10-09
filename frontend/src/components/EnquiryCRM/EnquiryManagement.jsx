import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Grid, Paper, Card, CardContent, Button, Chip, TextField,
    MenuItem, CircularProgress, Alert, Snackbar, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent,
    DialogActions, IconButton, Tooltip, Avatar, Tabs, Tab, FormControlLabel, Switch
} from '@mui/material';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlus, faSearch, faEdit, faTrash, faPhone, faEnvelope, faUserGraduate,
    faCalendarCheck, faRotateRight, faFileCsv, faPrint, faFilter, faChalkboardUser,
    faCheckCircle, faClock, faUserCheck, faBolt, faPaperPlane, faAddressCard, faGraduationCap
} from '@fortawesome/free-solid-svg-icons';
import AdminLayout from '../Common/AdminLayout';
import api from '../../api';

const COLORS = ['#0284c7', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

const QUALIFICATIONS = [
    '10th Standard',
    '12th Standard',
    'Undergraduate (Pursuing)',
    'Graduate (Completed)',
    'Post Graduate',
    'Working Professional',
    'Other'
];

const PREFERRED_TIMINGS = [
    'Morning (08:00 AM - 12:00 PM)',
    'Afternoon (12:00 PM - 04:00 PM)',
    'Evening (04:00 PM - 08:30 PM)',
    'Weekend Special Slot',
    'Flexible'
];

const LEAD_SOURCES = [
    'Walk-in Campus Visit',
    'Website Enquiry',
    'Social Media (Instagram/FB)',
    'Friend / Student Referral',
    'Pamphlet / Newspaper Banner',
    'Google Search'
];

const STATUS_LIST = [
    'ALL',
    'Pending',
    'Follow-up Required',
    'Demo Scheduled',
    'Admission Taken',
    'Lost / Cancelled'
];

const EnquiryManagement = () => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [enquiries, setEnquiries] = useState([]);
    const [courses, setCourses] = useState([]);
    const [batches, setBatches] = useState([]);
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);

    // Filters
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [courseFilter, setCourseFilter] = useState('ALL');
    const [sourceFilter, setSourceFilter] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    // Dialogs
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [editStatusDialog, setEditStatusDialog] = useState({ open: false, enquiry: null });
    const [convertDialog, setConvertDialog] = useState({ open: false, enquiry: null });
    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
    const [submitting, setSubmitting] = useState(false);

    // Add Form State
    const [formData, setFormData] = useState({
        candidateName: '',
        mobileNo: '',
        email: '',
        courseId: '',
        qualification: '12th Standard',
        preferredTiming: 'Morning (08:00 AM - 12:00 PM)',
        leadSource: 'Walk-in Campus Visit',
        followUpDate: new Date().toISOString().split('T')[0],
        followUpNotes: 'Interested in curriculum & batch timing. Called center.',
        isDemoRequested: false,
        demoDate: new Date().toISOString().split('T')[0],
        demoTiming: '10:00 AM - 11:30 AM',
        demoFaculty: 'Senior Faculty'
    });

    // Update Status State
    const [statusForm, setStatusForm] = useState({
        status: 'Follow-up Required',
        followUpDate: new Date().toISOString().split('T')[0],
        followUpNotes: '',
        demoStatus: 'None'
    });

    // Convert to Admission State
    const [convertForm, setConvertForm] = useState({
        batchId: '',
        paidFees: 2000,
        fatherName: '',
        fatherMobileNo: '',
        rfid: ''
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            let url = '/enquiries?';
            if (statusFilter !== 'ALL') url += `status=${statusFilter}&`;
            if (courseFilter !== 'ALL') url += `courseId=${courseFilter}&`;
            if (sourceFilter !== 'ALL') url += `source=${sourceFilter}&`;

            const [enqRes, insRes, crsRes, batRes] = await Promise.all([
                api.get(url),
                api.get('/enquiries/insights'),
                api.get('/courses'),
                api.get('/batches')
            ]);

            setEnquiries(enqRes.data);
            setInsights(insRes.data);
            setCourses(crsRes.data);
            setBatches(batRes.data);
        } catch (err) {
            setToast({ open: true, message: 'Failed to load inquiry CRM data', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [statusFilter, courseFilter, sourceFilter]);

    const handleOpenAdd = () => {
        setFormData({
            candidateName: '',
            mobileNo: '',
            email: '',
            courseId: courses[0]?._id || '',
            qualification: '12th Standard',
            preferredTiming: 'Morning (08:00 AM - 12:00 PM)',
            leadSource: 'Walk-in Campus Visit',
            followUpDate: new Date().toISOString().split('T')[0],
            followUpNotes: 'Candidate inquired at center. Follow-up scheduled.',
            isDemoRequested: false,
            demoDate: new Date().toISOString().split('T')[0],
            demoTiming: '10:00 AM - 11:30 AM',
            demoFaculty: 'Prof. Anjali Deshmukh'
        });
        setOpenAddDialog(true);
    };

    const handleCreateEnquiry = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const res = await api.post('/enquiries', formData);
            setToast({ open: true, message: res.data.message, severity: 'success' });
            setOpenAddDialog(false);
            fetchData();
        } catch (err) {
            setToast({ open: true, message: err.response?.data?.message || 'Failed to save enquiry', severity: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenEditStatus = (enquiry) => {
        setEditStatusDialog({ open: true, enquiry });
        setStatusForm({
            status: enquiry.status || 'Follow-up Required',
            followUpDate: enquiry.followUpDate || new Date().toISOString().split('T')[0],
            followUpNotes: enquiry.followUpNotes || '',
            demoStatus: enquiry.demoStatus || 'None'
        });
    };

    const handleUpdateStatus = async () => {
        if (!editStatusDialog.enquiry) return;
        try {
            setSubmitting(true);
            await api.put(`/enquiries/${editStatusDialog.enquiry._id}`, statusForm);
            setToast({ open: true, message: 'Lead status updated successfully!', severity: 'success' });
            setEditStatusDialog({ open: false, enquiry: null });
            fetchData();
        } catch (err) {
            setToast({ open: true, message: 'Failed to update lead status', severity: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenConvert = (enquiry) => {
        const defaultBatch = batches.find(b => b.courseId?._id === enquiry.courseId?._id || b.courseId === enquiry.courseId) || batches[0];
        setConvertDialog({ open: true, enquiry });
        setConvertForm({
            batchId: defaultBatch?._id || '',
            paidFees: 2000,
            fatherName: '',
            fatherMobileNo: enquiry.mobileNo,
            rfid: `RFID-${1000 + Math.floor(Math.random() * 900)}`
        });
    };

    const handleConfirmConversion = async () => {
        if (!convertDialog.enquiry) return;
        try {
            setSubmitting(true);
            const res = await api.post(`/enquiries/${convertDialog.enquiry._id}/convert-to-admission`, convertForm);
            setToast({ open: true, message: res.data.message, severity: 'success' });
            setConvertDialog({ open: false, enquiry: null });
            fetchData();
        } catch (err) {
            setToast({ open: true, message: err.response?.data?.message || 'Error converting lead to student', severity: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (enquiryId, name) => {
        if (!window.confirm(`Are you sure you want to delete lead for "${name}"?`)) return;
        try {
            await api.delete(`/enquiries/${enquiryId}`);
            setToast({ open: true, message: 'Lead removed', severity: 'success' });
            fetchData();
        } catch (err) {
            setToast({ open: true, message: 'Failed to remove lead', severity: 'error' });
        }
    };

    const handleExportCSV = () => {
        const headers = ['Candidate Name', 'Mobile', 'Email', 'Course', 'Qualification', 'Preferred Slot', 'Source', 'Status', 'Follow-up Date', 'Demo Status', 'Notes'];
        const rows = enquiries.map(e => [
            `"${e.candidateName}"`,
            e.mobileNo,
            e.email || '',
            `"${e.courseName}"`,
            e.qualification,
            `"${e.preferredTiming}"`,
            `"${e.leadSource}"`,
            e.status,
            e.followUpDate,
            e.demoStatus,
            `"${e.followUpNotes?.replace(/"/g, '""') || ''}"`
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Keerti_Enquiries_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredEnquiries = enquiries.filter(e => {
        const matchesSearch = e.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.mobileNo.includes(searchTerm) ||
            e.courseName.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    return (
        <AdminLayout>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                <Box>
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <Typography variant="h5" fontWeight="900" color="#0f172a">
                            Inquiry & Demo Lecture CRM
                        </Typography>
                            <Chip label="Lead Pipeline" sx={{ bgcolor: '#e0f2fe', color: '#0284c7', fontWeight: 800 }} />
                        </Box>
                        <Typography variant="body2" color="textSecondary">
                            Track prospective student admissions, demo bookings, counseling follow-ups, and conversion metrics
                        </Typography>
                    </Box>

                    <Box display="flex" gap={1.5} flexWrap="wrap">
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
                            startIcon={<FontAwesomeIcon icon={faPlus} />}
                            onClick={handleOpenAdd}
                            sx={{ bgcolor: '#0284c7', '&:hover': { bgcolor: '#0369a1' }, fontWeight: 800, textTransform: 'none', px: 2.5, borderRadius: '10px' }}
                        >
                            New Inquiry & Demo Booking
                        </Button>
                    </Box>
                </Box>

                {/* Top Insights & Analytics Bar */}
                <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
                    {/* Total Leads */}
                    <Grid item xs={6} sm={3}>
                        <Card sx={{ borderRadius: '14px', border: '1px solid #e0f2fe', bgcolor: '#ffffff' }}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800 }}>TOTAL INQUIRIES</Typography>
                                <Typography variant="h4" fontWeight="900" color="#0f172a" my={0.5}>{insights?.kpis?.totalInquiries || 0}</Typography>
                                <Typography variant="caption" sx={{ color: '#0284c7', fontWeight: 700 }}>Inbound Lead Pool</Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Pending & Follow-up */}
                    <Grid item xs={6} sm={3}>
                        <Card sx={{ borderRadius: '14px', border: '1px solid #bae6fd', bgcolor: '#f0f9ff' }}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Typography variant="caption" sx={{ color: '#0369a1', fontWeight: 800 }}>ACTIVE FOLLOW-UPS</Typography>
                                <Typography variant="h4" fontWeight="900" color="#0284c7" my={0.5}>
                                    {(insights?.kpis?.followUpsCount || 0) + (insights?.kpis?.pendingCount || 0)}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#0369a1', fontWeight: 700 }}>
                                    {insights?.kpis?.todayFollowUpsCount || 0} Due Today
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Demos Scheduled */}
                    <Grid item xs={6} sm={3}>
                        <Card sx={{ borderRadius: '14px', border: '1px solid #fde68a', bgcolor: '#fffbeb' }}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Typography variant="caption" sx={{ color: '#92400e', fontWeight: 800 }}>DEMOS SCHEDULED</Typography>
                                <Typography variant="h4" fontWeight="900" color="#d97706" my={0.5}>{insights?.kpis?.demosCount || 0}</Typography>
                                <Typography variant="caption" sx={{ color: '#92400e', fontWeight: 700 }}>Free Class Demos</Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Admissions Taken & Conversion % */}
                    <Grid item xs={6} sm={3}>
                        <Card sx={{ borderRadius: '14px', border: '1px solid #bbf7d0', bgcolor: '#f0fdf4' }}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Typography variant="caption" sx={{ color: '#166534', fontWeight: 800 }}>ADMISSIONS TAKEN</Typography>
                                <Typography variant="h4" fontWeight="900" color="#16a34a" my={0.5}>{insights?.kpis?.admissionsCount || 0}</Typography>
                                <Chip
                                    label={`${insights?.kpis?.conversionRate || 0}% Conversion Rate`}
                                    size="small"
                                    sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 800, fontSize: '11px', height: '22px' }}
                                />
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Today's Follow-up Reminder Banner */}
                {insights?.todayFollowUps?.length > 0 && (
                    <Paper sx={{ p: 2.5, mb: 3.5, borderRadius: '14px', border: '1px solid #bae6fd', bgcolor: '#eff6ff' }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                            <Box display="flex" alignItems="center" gap={1.5}>
                                <Box sx={{ width: 36, height: 36, borderRadius: '8px', bgcolor: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FontAwesomeIcon icon={faClock} />
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" fontWeight="800" color="#0f172a">
                                        ⚡ Action Required: {insights.todayFollowUps.length} Candidate Follow-Ups Scheduled for Today
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        Contact prospective students to confirm demo lectures or admission enrollments
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>

                        <Grid container spacing={1.5}>
                            {insights.todayFollowUps.map((lead) => (
                                <Grid item xs={12} sm={6} md={4} key={lead._id}>
                                    <Paper sx={{ p: 1.5, bgcolor: '#ffffff', borderRadius: '10px', border: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box>
                                            <Typography variant="body2" fontWeight="800" color="#0f172a">{lead.candidateName}</Typography>
                                            <Typography variant="caption" color="textSecondary">{lead.courseName} • Ph: {lead.mobileNo}</Typography>
                                        </Box>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => handleOpenEditStatus(lead)}
                                            sx={{ borderColor: '#0284c7', color: '#0284c7', textTransform: 'none', fontWeight: 700 }}
                                        >
                                            Update
                                        </Button>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>
                )}

                {/* Visual Analytics Graphs */}
                <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
                    {/* Course Demand Bar Chart */}
                    <Grid item xs={12} md={7}>
                        <Paper sx={{ p: 2.5, borderRadius: '14px', border: '1px solid #e0f2fe', height: '100%' }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Box>
                                    <Typography variant="h6" fontWeight="800" color="#0f172a">
                                        Course Demand & Conversion Pipeline
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        Inquiries received vs Admissions enrolled per course
                                    </Typography>
                                </Box>
                                <Chip label="Real-time Analytics" size="small" sx={{ bgcolor: '#e0f2fe', color: '#0284c7', fontWeight: 800 }} />
                            </Box>

                            <Box sx={{ height: 260 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={insights?.courseDemand || []} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                                        <XAxis dataKey="code" stroke="#94a3b8" />
                                        <YAxis stroke="#94a3b8" />
                                        <ChartTooltip />
                                        <Legend />
                                        <Bar dataKey="inquiries" name="Total Inquiries" fill="#0284c7" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="admissions" name="Admissions Taken" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Lead Source Breakdown Donut Chart */}
                    <Grid item xs={12} md={5}>
                        <Paper sx={{ p: 2.5, borderRadius: '14px', border: '1px solid #e0f2fe', height: '100%' }}>
                            <Box mb={1}>
                                <Typography variant="h6" fontWeight="800" color="#0f172a">
                                    Lead Acquisition Channels
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                    Where prospective students discover Keerti classes
                                </Typography>
                            </Box>

                            <Box sx={{ height: 260 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={insights?.sourceBreakdown || []}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={55}
                                            outerRadius={80}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {(insights?.sourceBreakdown || []).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <ChartTooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>

                {/* Status Tabs Filter */}
                <Paper sx={{ mb: 3, borderRadius: '12px', border: '1px solid #e0f2fe' }}>
                    <Tabs
                        value={STATUS_LIST.indexOf(statusFilter)}
                        onChange={(e, val) => setStatusFilter(STATUS_LIST[val])}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{
                            '& .MuiTab-root': { fontWeight: 800, textTransform: 'none', py: 1.5 },
                            '& .Mui-selected': { color: '#0284c7' }
                        }}
                    >
                        {STATUS_LIST.map((st) => (
                            <Tab key={st} label={st === 'ALL' ? `All Inquiries (${enquiries.length})` : st} />
                        ))}
                    </Tabs>
                </Paper>

                {/* Secondary Search & Filter Bar */}
                <Paper sx={{ p: 2, mb: 3, borderRadius: '12px', border: '1px solid #e0f2fe' }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Search by candidate name, mobile, course..."
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
                                {courses.map(c => <MenuItem key={c._id} value={c._id}>{c.courseName}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <TextField
                                fullWidth
                                select
                                size="small"
                                label="Lead Channel / Source"
                                value={sourceFilter}
                                onChange={(e) => setSourceFilter(e.target.value)}
                            >
                                <MenuItem value="ALL">All Sources</MenuItem>
                                {LEAD_SOURCES.map(src => <MenuItem key={src} value={src}>{src}</MenuItem>)}
                            </TextField>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Inquiries Table */}
                {loading ? (
                    <Box display="flex" justifyContent="center" py={6}>
                        <CircularProgress sx={{ color: '#0284c7' }} />
                    </Box>
                ) : filteredEnquiries.length === 0 ? (
                    <Paper sx={{ p: 5, textAlign: 'center', borderRadius: '12px', border: '1px solid #e0f2fe' }}>
                        <Typography color="textSecondary">No candidate inquiries found matching your filters.</Typography>
                    </Paper>
                ) : (
                    <Paper sx={{ borderRadius: '14px', border: '1px solid #e0f2fe', overflow: 'hidden' }}>
                        <TableContainer>
                            <Table>
                                <TableHead sx={{ backgroundColor: '#f0f9ff' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Candidate</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Interested Course</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Preferred Slot & Channel</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Follow-up Date & Notes</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Demo Status</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Lead Status</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1', textAlign: 'right' }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredEnquiries.map((lead) => {
                                        const isConverted = lead.status === 'Admission Taken';
                                        return (
                                            <TableRow key={lead._id} hover>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="800" color="#0f172a">{lead.candidateName}</Typography>
                                                    <Box display="flex" alignItems="center" gap={0.8} mt={0.3}>
                                                        <FontAwesomeIcon icon={faPhone} style={{ color: '#0284c7', fontSize: '11px' }} />
                                                        <Typography variant="caption" color="textSecondary">{lead.mobileNo}</Typography>
                                                    </Box>
                                                    <Typography variant="caption" color="textSecondary" display="block">{lead.qualification}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip label={lead.courseName} size="small" sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 700 }} />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="600">{lead.preferredTiming}</Typography>
                                                    <Chip label={lead.leadSource} size="small" variant="outlined" sx={{ fontSize: '10px', height: '20px', mt: 0.3 }} />
                                                </TableCell>
                                                <TableCell sx={{ maxWidth: 220 }}>
                                                    <Typography variant="body2" fontWeight="700" color="#0f172a">{lead.followUpDate}</Typography>
                                                    <Typography variant="caption" color="textSecondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                        {lead.followUpNotes}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    {lead.isDemoRequested ? (
                                                        <Chip
                                                            label={`Demo: ${lead.demoStatus}`}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: lead.demoStatus === 'Attended' ? '#dcfce7' : lead.demoStatus === 'Scheduled' ? '#fef3c7' : '#f1f5f9',
                                                                color: lead.demoStatus === 'Attended' ? '#166534' : lead.demoStatus === 'Scheduled' ? '#92400e' : '#475569',
                                                                fontWeight: 800
                                                            }}
                                                        />
                                                    ) : (
                                                        <Typography variant="caption" color="textSecondary">-</Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={lead.status}
                                                        size="small"
                                                        sx={{
                                                            bgcolor:
                                                                lead.status === 'Admission Taken' ? '#dcfce7' :
                                                                lead.status === 'Follow-up Required' ? '#e0f2fe' :
                                                                lead.status === 'Demo Scheduled' ? '#fef3c7' :
                                                                lead.status === 'Lost / Cancelled' ? '#fee2e2' : '#f1f5f9',
                                                            color:
                                                                lead.status === 'Admission Taken' ? '#166534' :
                                                                lead.status === 'Follow-up Required' ? '#0369a1' :
                                                                lead.status === 'Demo Scheduled' ? '#92400e' :
                                                                lead.status === 'Lost / Cancelled' ? '#991b1b' : '#334155',
                                                            fontWeight: 800
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ textAlign: 'right' }}>
                                                    <Box display="flex" justifyContent="flex-end" gap={0.8}>
                                                        {!isConverted && (
                                                            <Tooltip title="1-Click Enroll Student">
                                                                <Button
                                                                    size="small"
                                                                    variant="contained"
                                                                    startIcon={<FontAwesomeIcon icon={faUserGraduate} />}
                                                                    onClick={() => handleOpenConvert(lead)}
                                                                    sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, textTransform: 'none', fontWeight: 800, fontSize: '11px', py: 0.3 }}
                                                                >
                                                                    Admit
                                                                </Button>
                                                            </Tooltip>
                                                        )}
                                                        <Tooltip title="Update Status / Follow-up">
                                                            <IconButton size="small" onClick={() => handleOpenEditStatus(lead)} sx={{ color: '#0284c7' }}>
                                                                <FontAwesomeIcon icon={faEdit} />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Delete Lead">
                                                            <IconButton size="small" onClick={() => handleDelete(lead._id, lead.candidateName)} sx={{ color: '#ef4444' }}>
                                                                <FontAwesomeIcon icon={faTrash} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                )}

                {/* Dialog: Create New Inquiry & Demo */}
                <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="md" fullWidth>
                    <form onSubmit={handleCreateEnquiry}>
                        <DialogTitle sx={{ fontWeight: 800, bgcolor: '#0284c7', color: '#fff' }}>
                            Register New Inquiry & Demo Lecture Booking
                        </DialogTitle>
                        <DialogContent sx={{ p: 3, mt: 1 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Candidate Full Name"
                                        fullWidth
                                        required
                                        value={formData.candidateName}
                                        onChange={(e) => setFormData({ ...formData, candidateName: e.target.value })}
                                        placeholder="e.g. Ramesh Patil"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Mobile Number (For Confirmation SMS)"
                                        fullWidth
                                        required
                                        value={formData.mobileNo}
                                        onChange={(e) => setFormData({ ...formData, mobileNo: e.target.value })}
                                        placeholder="10 Digit Phone"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Email Address"
                                        type="email"
                                        fullWidth
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Interested Course"
                                        select
                                        fullWidth
                                        required
                                        value={formData.courseId}
                                        onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                                    >
                                        {courses.map(c => <MenuItem key={c._id} value={c._id}>{c.courseName}</MenuItem>)}
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        label="Educational Qualification"
                                        select
                                        fullWidth
                                        value={formData.qualification}
                                        onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                                    >
                                        {QUALIFICATIONS.map(q => <MenuItem key={q} value={q}>{q}</MenuItem>)}
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        label="Preferred Timing Slot"
                                        select
                                        fullWidth
                                        value={formData.preferredTiming}
                                        onChange={(e) => setFormData({ ...formData, preferredTiming: e.target.value })}
                                    >
                                        {PREFERRED_TIMINGS.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        label="Lead Acquisition Channel"
                                        select
                                        fullWidth
                                        value={formData.leadSource}
                                        onChange={(e) => setFormData({ ...formData, leadSource: e.target.value })}
                                    >
                                        {LEAD_SOURCES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Next Follow-up Date"
                                        type="date"
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                        value={formData.followUpDate}
                                        onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Counseling Notes"
                                        fullWidth
                                        value={formData.followUpNotes}
                                        onChange={(e) => setFormData({ ...formData, followUpNotes: e.target.value })}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <Paper sx={{ p: 2, bgcolor: '#f0f9ff', borderRadius: '10px', border: '1px solid #bae6fd' }}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={formData.isDemoRequested}
                                                    onChange={(e) => setFormData({ ...formData, isDemoRequested: e.target.checked })}
                                                    color="primary"
                                                />
                                            }
                                            label={<Typography fontWeight="800" color="#0369a1">Schedule FREE Classroom Demo Lecture</Typography>}
                                        />

                                        {formData.isDemoRequested && (
                                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                                <Grid item xs={12} sm={4}>
                                                    <TextField
                                                        label="Demo Date"
                                                        type="date"
                                                        fullWidth
                                                        size="small"
                                                        InputLabelProps={{ shrink: true }}
                                                        value={formData.demoDate}
                                                        onChange={(e) => setFormData({ ...formData, demoDate: e.target.value })}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} sm={4}>
                                                    <TextField
                                                        label="Demo Timing Slot"
                                                        fullWidth
                                                        size="small"
                                                        value={formData.demoTiming}
                                                        onChange={(e) => setFormData({ ...formData, demoTiming: e.target.value })}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} sm={4}>
                                                    <TextField
                                                        label="Assigned Faculty"
                                                        fullWidth
                                                        size="small"
                                                        value={formData.demoFaculty}
                                                        onChange={(e) => setFormData({ ...formData, demoFaculty: e.target.value })}
                                                    />
                                                </Grid>
                                            </Grid>
                                        )}
                                    </Paper>
                                </Grid>
                            </Grid>
                        </DialogContent>
                        <DialogActions sx={{ p: 2.5, borderTop: '1px solid #e0f2fe' }}>
                            <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={submitting}
                                sx={{ bgcolor: '#0284c7', '&:hover': { bgcolor: '#0369a1' }, fontWeight: 800 }}
                            >
                                {submitting ? 'Saving...' : 'Register Inquiry & Shoot Confirmation SMS'}
                            </Button>
                        </DialogActions>
                    </form>
                </Dialog>

                {/* Dialog: Update Status & Follow-up */}
                <Dialog open={editStatusDialog.open} onClose={() => setEditStatusDialog({ open: false, enquiry: null })} maxWidth="xs" fullWidth>
                    <DialogTitle sx={{ fontWeight: 800, bgcolor: '#0284c7', color: '#fff' }}>
                        Update Lead Status & Follow-Up
                    </DialogTitle>
                    <DialogContent sx={{ p: 2.5, mt: 1 }}>
                        <Typography variant="body2" color="textSecondary" mb={2}>
                            Candidate: <strong>{editStatusDialog.enquiry?.candidateName}</strong> ({editStatusDialog.enquiry?.courseName})
                        </Typography>

                        <TextField
                            label="Lead Pipeline Status"
                            select
                            fullWidth
                            size="small"
                            value={statusForm.status}
                            onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                            sx={{ mb: 2 }}
                        >
                            {STATUS_LIST.filter(s => s !== 'ALL').map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                        </TextField>

                        <TextField
                            label="Next Follow-Up Date"
                            type="date"
                            fullWidth
                            size="small"
                            InputLabelProps={{ shrink: true }}
                            value={statusForm.followUpDate}
                            onChange={(e) => setStatusForm({ ...statusForm, followUpDate: e.target.value })}
                            sx={{ mb: 2 }}
                        >
                        </TextField>

                        <TextField
                            label="Counselor Discussion Notes"
                            multiline
                            rows={3}
                            fullWidth
                            value={statusForm.followUpNotes}
                            onChange={(e) => setStatusForm({ ...statusForm, followUpNotes: e.target.value })}
                        />
                    </DialogContent>
                    <DialogActions sx={{ p: 2, borderTop: '1px solid #e0f2fe' }}>
                        <Button onClick={() => setEditStatusDialog({ open: false, enquiry: null })}>Cancel</Button>
                        <Button
                            variant="contained"
                            disabled={submitting}
                            onClick={handleUpdateStatus}
                            sx={{ bgcolor: '#0284c7', fontWeight: 800 }}
                        >
                            {submitting ? 'Updating...' : 'Save Status'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Dialog: 1-Click Convert to Admission */}
                <Dialog open={convertDialog.open} onClose={() => setConvertDialog({ open: false, enquiry: null })} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ fontWeight: 800, bgcolor: '#10b981', color: '#fff' }}>
                        Convert Lead to Enrolled Student
                    </DialogTitle>
                    <DialogContent sx={{ p: 3, mt: 1 }}>
                        <Typography variant="subtitle1" fontWeight="800" color="#0f172a" mb={0.5}>
                            Candidate: {convertDialog.enquiry?.candidateName}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" mb={2}>
                            Course: <strong>{convertDialog.enquiry?.courseName}</strong> • Phone: {convertDialog.enquiry?.mobileNo}
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Assign Batch Schedule"
                                    select
                                    fullWidth
                                    required
                                    value={convertForm.batchId}
                                    onChange={(e) => setConvertForm({ ...convertForm, batchId: e.target.value })}
                                >
                                    {batches.map(b => (
                                        <MenuItem key={b._id} value={b._id}>
                                            {b.batchName} ({b.timing})
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Initial Paid Fees (₹)"
                                    type="number"
                                    fullWidth
                                    required
                                    value={convertForm.paidFees}
                                    onChange={(e) => setConvertForm({ ...convertForm, paidFees: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Father / Guardian Name"
                                    fullWidth
                                    value={convertForm.fatherName}
                                    onChange={(e) => setConvertForm({ ...convertForm, fatherName: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Guardian Mobile No (for SMS)"
                                    fullWidth
                                    value={convertForm.fatherMobileNo}
                                    onChange={(e) => setConvertForm({ ...convertForm, fatherMobileNo: e.target.value })}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ p: 2.5, borderTop: '1px solid #e0f2fe' }}>
                        <Button onClick={() => setConvertDialog({ open: false, enquiry: null })}>Cancel</Button>
                        <Button
                            variant="contained"
                            disabled={submitting}
                            onClick={handleConfirmConversion}
                            sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, fontWeight: 800 }}
                        >
                            {submitting ? 'Enrolling...' : 'Confirm Admission & Provision Student Portal'}
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

export default EnquiryManagement;
