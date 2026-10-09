import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Grid, Paper, Card, CardContent, Button, Chip, TextField,
    MenuItem, CircularProgress, Alert, Snackbar, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent,
    DialogActions, IconButton, Tooltip, Avatar, Tabs, Tab, Divider
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faGraduationCap, faPlus, faPenToSquare, faPrint, faPaperPlane,
    faTrophy, faCheckCircle, faClock, faUserCheck, faChartLine,
    faFileLines, faAward, faUsers
} from '@fortawesome/free-solid-svg-icons';
import AdminLayout from '../Common/AdminLayout';
import api from '../../api';

const EXAM_TYPES = [
    'Unit Test',
    'Practical Assessment',
    'Mid-Term Exam',
    'Final Certification Exam',
    'Weekly Quiz',
    'Mock Test'
];

const MarksEntry = () => {
    const [exams, setExams] = useState([]);
    const [courses, setCourses] = useState([]);
    const [batches, setBatches] = useState([]);
    const [selectedExam, setSelectedExam] = useState(null);
    const [roster, setRoster] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingMarks, setSavingMarks] = useState(false);

    // Dialogs
    const [openAddExamDialog, setOpenAddExamDialog] = useState(false);
    const [reportCardModal, setReportCardModal] = useState({ open: false, studentId: null, reportData: null });
    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
    const [submittingExam, setSubmittingExam] = useState(false);

    // Create Exam Form
    const [examForm, setExamForm] = useState({
        title: '',
        examType: 'Unit Test',
        courseId: '',
        batchId: '',
        subject: 'Core Practical & Theory',
        examDate: new Date().toISOString().split('T')[0],
        maxTheoryMarks: 70,
        maxPracticalMarks: 30,
        passingMarks: 40,
        evaluatorName: 'Prof. Anjali Deshmukh',
        description: 'Semester practical & theory assessment'
    });

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [exRes, crsRes, batRes] = await Promise.all([
                api.get('/exams'),
                api.get('/courses'),
                api.get('/batches')
            ]);
            const examsList = Array.isArray(exRes.data) ? exRes.data : (exRes.data?.data || []);
            const coursesList = Array.isArray(crsRes.data) ? crsRes.data : (crsRes.data?.data || []);
            const batchesList = Array.isArray(batRes.data) ? batRes.data : (batRes.data?.data || []);

            setExams(examsList);
            setCourses(coursesList);
            setBatches(batchesList);

            if (examsList.length > 0) {
                loadExamRoster(examsList[0]);
            }
        } catch (err) {
            setToast({ open: true, message: 'Failed to load assessments', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    const loadExamRoster = async (exam) => {
        setSelectedExam(exam);
        try {
            const res = await api.get(`/exams/${exam._id}/roster`);
            setRoster(res.data.roster);
        } catch (err) {
            setToast({ open: true, message: 'Failed to load student roster for exam', severity: 'error' });
        }
    };

    const handleCreateExam = async (e) => {
        e.preventDefault();
        if (!examForm.title || !examForm.courseId || !examForm.batchId) {
            setToast({ open: true, message: 'Please fill all required exam fields', severity: 'error' });
            return;
        }

        try {
            setSubmittingExam(true);
            const res = await api.post('/exams', examForm);
            setToast({ open: true, message: res.data.message, severity: 'success' });
            setOpenAddExamDialog(false);
            const exRes = await api.get('/exams');
            setExams(exRes.data);
            if (res.data.exam) {
                loadExamRoster(res.data.exam);
            }
        } catch (err) {
            setToast({ open: true, message: err.response?.data?.message || 'Error creating exam', severity: 'error' });
        } finally {
            setSubmittingExam(false);
        }
    };

    const handleMarkChange = (index, field, value) => {
        const updated = [...roster];
        updated[index][field] = value;

        if (field === 'theoryMarksObtained' || field === 'practicalMarksObtained' || field === 'attendanceStatus') {
            const isAbsent = updated[index].attendanceStatus === 'Absent';
            const theory = isAbsent ? 0 : Number(updated[index].theoryMarksObtained) || 0;
            const practical = isAbsent ? 0 : Number(updated[index].practicalMarksObtained) || 0;
            const total = theory + practical;
            const max = selectedExam ? selectedExam.totalMaxMarks : 100;
            const pass = selectedExam ? selectedExam.passingMarks : 40;

            const pct = max > 0 ? Math.round((total / max) * 100) : 0;
            let grade = 'Fail';
            let resultStatus = total >= pass ? 'Passed' : 'Failed';

            if (isAbsent) {
                grade = 'Absent';
                resultStatus = 'Absent';
            } else if (pct >= 85) grade = 'A+ (Distinction)';
            else if (pct >= 70) grade = 'A (First Class)';
            else if (pct >= 55) grade = 'B (Second Class)';
            else if (pct >= 40) grade = 'C (Pass Class)';

            updated[index].totalMarksObtained = total;
            updated[index].percentage = pct;
            updated[index].grade = grade;
            updated[index].resultStatus = resultStatus;
        }

        setRoster(updated);
    };

    const handleSaveRosterMarks = async () => {
        if (!selectedExam) return;
        try {
            setSavingMarks(true);
            const res = await api.post(`/exams/${selectedExam._id}/marks`, {
                marksList: roster
            });
            setToast({ open: true, message: res.data.message, severity: 'success' });
            const exRes = await api.get('/exams');
            setExams(exRes.data);
        } catch (err) {
            setToast({ open: true, message: err.response?.data?.message || 'Failed to save marks', severity: 'error' });
        } finally {
            setSavingMarks(false);
        }
    };

    const handleBroadcastResults = async () => {
        if (!selectedExam) return;
        try {
            const res = await api.post(`/exams/${selectedExam._id}/broadcast-results`);
            setToast({ open: true, message: res.data.message, severity: 'success' });
        } catch (err) {
            setToast({ open: true, message: err.response?.data?.message || 'Failed to dispatch result SMS', severity: 'error' });
        }
    };

    const handleViewReportCard = async (studentId) => {
        try {
            const res = await api.get(`/exams/student/${studentId}/report-card`);
            setReportCardModal({
                open: true,
                studentId,
                reportData: res.data
            });
        } catch (err) {
            setToast({ open: true, message: 'Could not load student report card', severity: 'error' });
        }
    };

    const handlePrintReportCard = () => {
        window.print();
    };

    return (
        <AdminLayout>
            {/* Header Banner */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                <Box>
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <Typography variant="h5" fontWeight="900" color="#0f172a">
                            Examinations & Marks Assessment
                        </Typography>
                                <Chip label="Academic Assessment" sx={{ bgcolor: '#e0f2fe', color: '#0284c7', fontWeight: 800 }} />
                            </Box>
                            <Typography variant="body2" color="textSecondary" sx={{ mt: 0.3 }}>
                                Schedule tests, enter theory & practical scores, auto-compute grades, and issue printable report cards
                            </Typography>
                        </Box>

                        <Button
                            variant="contained"
                            startIcon={<FontAwesomeIcon icon={faPlus} />}
                            onClick={() => {
                                setExamForm({
                                    title: '',
                                    examType: 'Unit Test',
                                    courseId: courses[0]?._id || '',
                                    batchId: batches[0]?._id || '',
                                    subject: 'Core Practical & Theory',
                                    examDate: new Date().toISOString().split('T')[0],
                                    maxTheoryMarks: 70,
                                    maxPracticalMarks: 30,
                                    passingMarks: 40,
                                    evaluatorName: 'Prof. Anjali Deshmukh',
                                    description: 'Semester assessment'
                                });
                                setOpenAddExamDialog(true);
                            }}
                            sx={{ bgcolor: '#0284c7', '&:hover': { bgcolor: '#0369a1' }, fontWeight: 800, textTransform: 'none', px: 2.5, borderRadius: '10px' }}
                        >
                            Schedule New Assessment
                        </Button>
                    </Box>

                    {/* Active Exam Selector Cards */}
                    <Typography variant="subtitle2" fontWeight="800" color="#0f172a" mb={1.5}>
                        Select Scheduled Assessment Exam ({exams.length}):
                    </Typography>

                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        {exams.map((ex) => {
                            const isSelected = selectedExam?._id === ex._id;
                            return (
                                <Grid item xs={12} sm={6} md={4} key={ex._id}>
                                    <Paper
                                        onClick={() => loadExamRoster(ex)}
                                        sx={{
                                            p: 2,
                                            borderRadius: '14px',
                                            border: isSelected ? '2px solid #0284c7' : '1px solid #e0f2fe',
                                            bgcolor: isSelected ? '#eff6ff' : '#ffffff',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            boxShadow: isSelected ? '0 4px 15px rgba(2, 132, 199, 0.15)' : 'none',
                                            '&:hover': { transform: 'translateY(-2px)' }
                                        }}
                                    >
                                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                                            <Typography variant="subtitle2" fontWeight="800" color="#0f172a">
                                                {ex.title}
                                            </Typography>
                                            <Chip
                                                label={ex.examType}
                                                size="small"
                                                sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 800, fontSize: '10.5px' }}
                                            />
                                        </Box>
                                        <Typography variant="caption" color="textSecondary" display="block">
                                            {ex.courseName} • {ex.batchName}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary" display="block">
                                            Date: {ex.examDate} • Max: {ex.totalMaxMarks} (Pass: {ex.passingMarks})
                                        </Typography>

                                        <Box display="flex" justifyContent="space-between" alignItems="center" mt={1.5} pt={1} borderTop="1px solid #e2e8f0">
                                            <Chip
                                                label={ex.isPublished ? `Published (${ex.gradedCount} Graded)` : 'Draft Marks'}
                                                size="small"
                                                sx={{
                                                    bgcolor: ex.isPublished ? '#dcfce7' : '#fef3c7',
                                                    color: ex.isPublished ? '#166534' : '#92400e',
                                                    fontWeight: 800,
                                                    fontSize: '10px'
                                                }}
                                            />
                                            <Typography variant="caption" fontWeight="700" color="#0284c7">
                                                {isSelected ? '● Active' : 'Click to Grade'}
                                            </Typography>
                                        </Box>
                                    </Paper>
                                </Grid>
                            );
                        })}
                    </Grid>

                    {/* Batch Mark Entry Spreadsheet */}
                    {selectedExam ? (
                        <Paper sx={{ p: 2.5, borderRadius: '14px', border: '1px solid #e0f2fe', bgcolor: '#ffffff', mb: 4 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={2}>
                                <Box>
                                    <Typography variant="h6" fontWeight="900" color="#0f172a">
                                        Roster Mark Entry Sheet: {selectedExam.title}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        Batch: {selectedExam.batchName} • Max Theory: {selectedExam.maxTheoryMarks} • Max Practical: {selectedExam.maxPracticalMarks} • Total: {selectedExam.totalMaxMarks}
                                    </Typography>
                                </Box>

                                <Box display="flex" gap={1.5}>
                                    <Button
                                        variant="outlined"
                                        startIcon={<FontAwesomeIcon icon={faPaperPlane} />}
                                        onClick={handleBroadcastResults}
                                        sx={{ borderColor: '#f97316', color: '#f97316', fontWeight: 800, textTransform: 'none', borderRadius: '8px' }}
                                    >
                                        SMS Scorecards
                                    </Button>
                                    <Button
                                        variant="contained"
                                        startIcon={<FontAwesomeIcon icon={faCheckCircle} />}
                                        onClick={handleSaveRosterMarks}
                                        disabled={savingMarks}
                                        sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, fontWeight: 800, textTransform: 'none', borderRadius: '8px' }}
                                    >
                                        {savingMarks ? 'Saving...' : 'Save & Publish Assessment Scores'}
                                    </Button>
                                </Box>
                            </Box>

                            {roster.length === 0 ? (
                                <Alert severity="info" sx={{ borderRadius: '10px' }}>
                                    No active students enrolled in this batch yet.
                                </Alert>
                            ) : (
                                <TableContainer>
                                    <Table>
                                        <TableHead sx={{ backgroundColor: '#f0f9ff' }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Roll / Student</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: '#0369a1', width: 140 }}>Attendance</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: '#0369a1', width: 130 }}>Theory ({selectedExam.maxTheoryMarks})</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: '#0369a1', width: 130 }}>Practical ({selectedExam.maxPracticalMarks})</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Total & %</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Grade & Result</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Remarks</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: '#0369a1', textAlign: 'right' }}>Report Card</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {roster.map((row, idx) => (
                                                <TableRow key={row.studentId} hover>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight="800" color="#0f172a">{row.studentName}</Typography>
                                                        <Typography variant="caption" color="textSecondary">GR: {row.grno} {row.rollno ? `• Roll: ${row.rollno}` : ''}</Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <TextField
                                                            select
                                                            size="small"
                                                            fullWidth
                                                            value={row.attendanceStatus}
                                                            onChange={(e) => handleMarkChange(idx, 'attendanceStatus', e.target.value)}
                                                        >
                                                            <MenuItem value="Present">Present</MenuItem>
                                                            <MenuItem value="Absent">Absent</MenuItem>
                                                            <MenuItem value="Exempted">Exempted</MenuItem>
                                                        </TextField>
                                                    </TableCell>
                                                    <TableCell>
                                                        <TextField
                                                            type="number"
                                                            size="small"
                                                            disabled={row.attendanceStatus === 'Absent'}
                                                            value={row.theoryMarksObtained}
                                                            onChange={(e) => handleMarkChange(idx, 'theoryMarksObtained', e.target.value)}
                                                            inputProps={{ min: 0, max: selectedExam.maxTheoryMarks }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <TextField
                                                            type="number"
                                                            size="small"
                                                            disabled={row.attendanceStatus === 'Absent'}
                                                            value={row.practicalMarksObtained}
                                                            onChange={(e) => handleMarkChange(idx, 'practicalMarksObtained', e.target.value)}
                                                            inputProps={{ min: 0, max: selectedExam.maxPracticalMarks }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight="900" color="#0f172a">
                                                            {row.totalMarksObtained} / {selectedExam.totalMaxMarks}
                                                        </Typography>
                                                        <Typography variant="caption" color="#0284c7" fontWeight="700">
                                                            {row.percentage}%
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={row.grade}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: row.resultStatus === 'Passed' ? '#dcfce7' : '#fee2e2',
                                                                color: row.resultStatus === 'Passed' ? '#166534' : '#991b1b',
                                                                fontWeight: 800,
                                                                fontSize: '11px'
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <TextField
                                                            size="small"
                                                            value={row.remarks}
                                                            onChange={(e) => handleMarkChange(idx, 'remarks', e.target.value)}
                                                            placeholder="Remarks"
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ textAlign: 'right' }}>
                                                        <Tooltip title="View Certificate Report Card">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleViewReportCard(row.studentId)}
                                                                sx={{ color: '#0284c7' }}
                                                            >
                                                                <FontAwesomeIcon icon={faAward} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Paper>
                    ) : (
                        <Paper sx={{ p: 5, textAlign: 'center', borderRadius: '14px', border: '1px solid #e0f2fe' }}>
                            <Typography color="textSecondary">Please select or create an assessment exam above.</Typography>
                        </Paper>
                    )}

                    {/* Dialog: Schedule New Exam */}
                    <Dialog open={openAddExamDialog} onClose={() => setOpenAddExamDialog(false)} maxWidth="sm" fullWidth>
                        <form onSubmit={handleCreateExam}>
                            <DialogTitle sx={{ fontWeight: 800, bgcolor: '#0284c7', color: '#fff' }}>
                                Schedule New Assessment / Examination
                            </DialogTitle>
                            <DialogContent sx={{ p: 3, mt: 1 }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <TextField
                                            label="Exam Assessment Title"
                                            fullWidth
                                            required
                                            value={examForm.title}
                                            onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                                            placeholder="e.g. Unit Test 1 - MS-CIT Basics & Word"
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="Assessment Type"
                                            select
                                            fullWidth
                                            value={examForm.examType}
                                            onChange={(e) => setExamForm({ ...examForm, examType: e.target.value })}
                                        >
                                            {EXAM_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="Exam Date"
                                            type="date"
                                            fullWidth
                                            InputLabelProps={{ shrink: true }}
                                            value={examForm.examDate}
                                            onChange={(e) => setExamForm({ ...examForm, examDate: e.target.value })}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="Select Course"
                                            select
                                            fullWidth
                                            required
                                            value={examForm.courseId}
                                            onChange={(e) => setExamForm({ ...examForm, courseId: e.target.value })}
                                        >
                                            {courses.map(c => <MenuItem key={c._id} value={c._id}>{c.courseName}</MenuItem>)}
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="Select Batch Slot"
                                            select
                                            fullWidth
                                            required
                                            value={examForm.batchId}
                                            onChange={(e) => setExamForm({ ...examForm, batchId: e.target.value })}
                                        >
                                            {batches.map(b => (
                                                <MenuItem key={b._id} value={b._id}>
                                                    {b.batchName} ({b.timing})
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <TextField
                                            label="Max Theory Marks"
                                            type="number"
                                            fullWidth
                                            value={examForm.maxTheoryMarks}
                                            onChange={(e) => setExamForm({ ...examForm, maxTheoryMarks: e.target.value })}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <TextField
                                            label="Max Practical Marks"
                                            type="number"
                                            fullWidth
                                            value={examForm.maxPracticalMarks}
                                            onChange={(e) => setExamForm({ ...examForm, maxPracticalMarks: e.target.value })}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <TextField
                                            label="Passing Marks"
                                            type="number"
                                            fullWidth
                                            value={examForm.passingMarks}
                                            onChange={(e) => setExamForm({ ...examForm, passingMarks: e.target.value })}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            label="Evaluator Faculty Name"
                                            fullWidth
                                            value={examForm.evaluatorName}
                                            onChange={(e) => setExamForm({ ...examForm, evaluatorName: e.target.value })}
                                        />
                                    </Grid>
                                </Grid>
                            </DialogContent>
                            <DialogActions sx={{ p: 2.5, borderTop: '1px solid #e0f2fe' }}>
                                <Button onClick={() => setOpenAddExamDialog(false)}>Cancel</Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={submittingExam}
                                    sx={{ bgcolor: '#0284c7', '&:hover': { bgcolor: '#0369a1' }, fontWeight: 800 }}
                                >
                                    {submittingExam ? 'Scheduling...' : 'Schedule Assessment'}
                                </Button>
                            </DialogActions>
                        </form>
                    </Dialog>

                    {/* Dialog: Printable Student Report Card */}
                    <Dialog open={reportCardModal.open} onClose={() => setReportCardModal({ open: false, studentId: null, reportData: null })} maxWidth="md" fullWidth>
                        <DialogTitle sx={{ fontWeight: 800, bgcolor: '#0284c7', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Student Academic Report Card & Performance Marksheet</span>
                            <Button
                                size="small"
                                variant="contained"
                                startIcon={<FontAwesomeIcon icon={faPrint} />}
                                onClick={handlePrintReportCard}
                                sx={{ bgcolor: '#ffffff', color: '#0284c7', fontWeight: 800, '&:hover': { bgcolor: '#f0f9ff' } }}
                            >
                                Print Marksheet
                            </Button>
                        </DialogTitle>
                        <DialogContent sx={{ p: 4 }}>
                            {reportCardModal.reportData && (
                                <Box sx={{ border: '2px solid #0284c7', borderRadius: '14px', p: 3.5, bgcolor: '#ffffff' }}>
                                    {/* Certificate Header */}
                                    <Box textAlign="center" borderBottom="2px solid #e0f2fe" pb={2} mb={3}>
                                        <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px auto', fontSize: '20px' }}>
                                            <FontAwesomeIcon icon={faGraduationCap} />
                                        </Box>
                                        <Typography variant="h5" fontWeight="900" color="#0284c7">
                                            ClassTech Educational Campus
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary" textTransform="uppercase" letterSpacing="1px">
                                            Official Student Performance Scorecard & Cumulative Evaluation
                                        </Typography>
                                    </Box>

                                    {/* Student Info */}
                                    <Grid container spacing={2} sx={{ mb: 3 }}>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="textSecondary">Candidate Name:</Typography>
                                            <Typography variant="body1" fontWeight="900">{reportCardModal.reportData.student.name}</Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="textSecondary">GR Number / Roll:</Typography>
                                            <Typography variant="body1" fontWeight="800">
                                                {reportCardModal.reportData.student.grno} {reportCardModal.reportData.student.rollno ? `(${reportCardModal.reportData.student.rollno})` : ''}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="textSecondary">Enrolled Course:</Typography>
                                            <Typography variant="body2" fontWeight="700">{reportCardModal.reportData.student.courseName}</Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="textSecondary">Batch Schedule:</Typography>
                                            <Typography variant="body2" fontWeight="700">{reportCardModal.reportData.student.batchName} ({reportCardModal.reportData.student.timing})</Typography>
                                        </Grid>
                                    </Grid>

                                    {/* Marks Table */}
                                    <TableContainer sx={{ mb: 3, border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                        <Table size="small">
                                            <TableHead sx={{ bgcolor: '#f0f9ff' }}>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 800 }}>Assessment Test</TableCell>
                                                    <TableCell sx={{ fontWeight: 800 }}>Type</TableCell>
                                                    <TableCell sx={{ fontWeight: 800 }}>Theory Marks</TableCell>
                                                    <TableCell sx={{ fontWeight: 800 }}>Practical Marks</TableCell>
                                                    <TableCell sx={{ fontWeight: 800 }}>Total Marks</TableCell>
                                                    <TableCell sx={{ fontWeight: 800 }}>Grade</TableCell>
                                                    <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {reportCardModal.reportData.marksheet.map((m, mIdx) => (
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

                                    {/* Overall Performance Summary */}
                                    <Paper sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '10px', border: '1px solid #cbd5e1', mb: 3 }}>
                                        <Grid container spacing={2} textAlign="center">
                                            <Grid item xs={3}>
                                                <Typography variant="caption" color="textSecondary">Total Marks</Typography>
                                                <Typography variant="h6" fontWeight="900">{reportCardModal.reportData.summary.totalMarksEarned} / {reportCardModal.reportData.summary.totalMaxPossible}</Typography>
                                            </Grid>
                                            <Grid item xs={3}>
                                                <Typography variant="caption" color="textSecondary">Aggregate %</Typography>
                                                <Typography variant="h6" fontWeight="900" color="#0284c7">{reportCardModal.reportData.summary.overallPercentage}%</Typography>
                                            </Grid>
                                            <Grid item xs={3}>
                                                <Typography variant="caption" color="textSecondary">Overall Grade</Typography>
                                                <Typography variant="h6" fontWeight="900" color="#16a34a">{reportCardModal.reportData.summary.overallGrade}</Typography>
                                            </Grid>
                                            <Grid item xs={3}>
                                                <Typography variant="caption" color="textSecondary">Final Outcome</Typography>
                                                <Chip label={reportCardModal.reportData.summary.finalResult} sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 900, mt: 0.5 }} />
                                            </Grid>
                                        </Grid>
                                    </Paper>

                                    {/* Signatures */}
                                    <Box display="flex" justifyContent="space-between" alignItems="flex-end" pt={4}>
                                        <Box textAlign="center" borderTop="1px dashed #94a3b8" pt={0.5} width="160px">
                                            <Typography variant="caption" fontWeight="700" color="#64748b">Class Teacher / Trainer</Typography>
                                        </Box>
                                        <Box textAlign="center" borderTop="1px dashed #94a3b8" pt={0.5} width="160px">
                                            <Typography variant="caption" fontWeight="700" color="#64748b">Principal / Director Stamp</Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            )}
                        </DialogContent>
                        <DialogActions sx={{ p: 2 }}>
                            <Button onClick={() => setReportCardModal({ open: false, studentId: null, reportData: null })}>Close</Button>
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

export default MarksEntry;
