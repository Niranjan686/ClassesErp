import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Chip, IconButton,
    Grid, CircularProgress, Alert, Snackbar, Avatar
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlus, faSearch, faEdit, faTrash, faChalkboardUser, faPhone, faEnvelope
} from '@fortawesome/free-solid-svg-icons';
import AdminLayout from '../Common/AdminLayout';
import api from '../../api';

const StaffMaster = () => {
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

    const [formData, setFormData] = useState({
        staffName: '',
        staffId: '',
        designation: 'Senior Faculty',
        specialization: 'MS-CIT, Tally Prime',
        mobileNo: '',
        email: '',
        status: 'Active'
    });

    const fetchStaff = async () => {
        try {
            setLoading(true);
            const res = await api.get('/staff');
            setStaffList(res.data);
        } catch (err) {
            setToast({ open: true, message: 'Failed to load faculty directory', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    const handleOpenAdd = () => {
        setEditingStaff(null);
        setFormData({
            staffName: '',
            staffId: `KCC-ST${staffList.length + 1}`,
            designation: 'Instructor / Faculty',
            specialization: 'MS-CIT, Programming, Tally',
            mobileNo: '',
            email: '',
            status: 'Active'
        });
        setOpenDialog(true);
    };

    const handleOpenEdit = (st) => {
        setEditingStaff(st);
        setFormData({
            staffName: st.staffName,
            staffId: st.staffId,
            designation: st.designation,
            specialization: st.specialization || '',
            mobileNo: st.mobileNo,
            email: st.email || '',
            status: st.status || 'Active'
        });
        setOpenDialog(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingStaff) {
                await api.put(`/staff/${editingStaff._id}`, formData);
                setToast({ open: true, message: 'Faculty profile updated!', severity: 'success' });
            } else {
                await api.post('/staff', formData);
                setToast({ open: true, message: 'Faculty registered successfully!', severity: 'success' });
            }
            setOpenDialog(false);
            fetchStaff();
        } catch (err) {
            setToast({ open: true, message: err.response?.data?.message || 'Error saving staff profile', severity: 'error' });
        }
    };

    const handleDelete = async (staffId, staffName) => {
        if (!window.confirm(`Are you sure you want to delete staff member "${staffName}"?`)) return;
        try {
            await api.delete(`/staff/${staffId}`);
            setToast({ open: true, message: 'Staff deleted successfully!', severity: 'success' });
            fetchStaff();
        } catch (err) {
            setToast({ open: true, message: 'Failed to delete staff member', severity: 'error' });
        }
    };

    const filteredStaff = staffList.filter(s =>
        s.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.staffId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.specialization && s.specialization.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <AdminLayout>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                <Box>
                    <Typography variant="h5" fontWeight="900" color="#0f172a">
                        Faculty & Staff Directory
                    </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Manage computer lab instructors, center managers, and specialization subjects
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
                        Add Faculty Member
                    </Button>
                </Box>

                {/* Search */}
                <Paper sx={{ p: 2, mb: 3, borderRadius: '12px', border: '1px solid #e0f2fe' }}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Search by faculty name, ID, specialization..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </Paper>

                {/* Staff Table */}
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
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Staff ID</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Faculty Name</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Designation</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Specialization Subjects</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Contact Info</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1' }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#0369a1', textAlign: 'right' }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredStaff.map((st) => (
                                        <TableRow key={st._id} hover>
                                            <TableCell>
                                                <Chip label={st.staffId} size="small" sx={{ fontWeight: 800, bgcolor: '#e0f2fe', color: '#0284c7' }} />
                                            </TableCell>
                                            <TableCell>
                                                <Box display="flex" alignItems="center" gap={1.5}>
                                                    <Avatar sx={{ bgcolor: '#0284c7', width: 36, height: 36, fontSize: '13px', fontWeight: 'bold' }}>
                                                        {st.staffName[0]}
                                                    </Avatar>
                                                    <Typography variant="body2" fontWeight="800" color="#0f172a">{st.staffName}</Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight="600">{st.designation}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="textSecondary">{st.specialization || 'General IT'}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">{st.mobileNo}</Typography>
                                                <Typography variant="caption" color="textSecondary">{st.email}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={st.status}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: st.status === 'Active' ? '#dcfce7' : '#fee2e2',
                                                        color: st.status === 'Active' ? '#166534' : '#991b1b',
                                                        fontWeight: 800
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ textAlign: 'right' }}>
                                                <IconButton size="small" onClick={() => handleOpenEdit(st)} sx={{ color: '#0284c7' }}>
                                                    <FontAwesomeIcon icon={faEdit} />
                                                </IconButton>
                                                <IconButton size="small" onClick={() => handleDelete(st._id, st.staffName)} sx={{ color: '#ef4444' }}>
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                )}

                {/* Dialog */}
                <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                    <form onSubmit={handleSubmit}>
                        <DialogTitle sx={{ fontWeight: 800, bgcolor: '#0284c7', color: '#fff' }}>
                            {editingStaff ? 'Edit Faculty Member' : 'Register New Faculty'}
                        </DialogTitle>
                        <DialogContent sx={{ p: 3, mt: 1 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={8}>
                                    <TextField
                                        label="Full Name"
                                        fullWidth
                                        required
                                        value={formData.staffName}
                                        onChange={(e) => setFormData({ ...formData, staffName: e.target.value })}
                                        placeholder="e.g. Prof. Rajesh Sharma"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        label="Staff ID"
                                        fullWidth
                                        required
                                        value={formData.staffId}
                                        onChange={(e) => setFormData({ ...formData, staffId: e.target.value.toUpperCase() })}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Designation"
                                        fullWidth
                                        required
                                        value={formData.designation}
                                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Specialization Subjects"
                                        fullWidth
                                        value={formData.specialization}
                                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Mobile Number"
                                        fullWidth
                                        required
                                        value={formData.mobileNo}
                                        onChange={(e) => setFormData({ ...formData, mobileNo: e.target.value })}
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
                            </Grid>
                        </DialogContent>
                        <DialogActions sx={{ p: 2.5, borderTop: '1px solid #e0f2fe' }}>
                            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                            <Button
                                type="submit"
                                variant="contained"
                                sx={{ bgcolor: '#0284c7', '&:hover': { bgcolor: '#0369a1' }, fontWeight: 800 }}
                            >
                                {editingStaff ? 'Save Changes' : 'Register Faculty'}
                            </Button>
                        </DialogActions>
                    </form>
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

export default StaffMaster;
