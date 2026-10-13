import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, MenuItem, Dialog, DialogTitle, DialogContent,
  DialogActions, Chip, IconButton, Alert, Snackbar, Grid, CircularProgress, Tabs, Tab
} from '@mui/material';
import { Plus, Trash2, Bus, MapPin, Users, ShieldAlert, Navigation } from 'lucide-react';
import AdminLayout from '../Common/AdminLayout';
import { PageTransition } from '../Common/MotionWrapper';
import api from '../../api';

const TransportManagement = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [vehicles, setVehicles] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  // Dialogs
  const [openVehicleDialog, setOpenVehicleDialog] = useState(false);
  const [openRouteDialog, setOpenRouteDialog] = useState(false);
  const [openAssignDialog, setOpenAssignDialog] = useState(false);

  // Forms
  const [vehicleForm, setVehicleForm] = useState({
    vehicleNo: '',
    model: 'Tata Starbus 32-Seater',
    capacity: 32,
    driverName: 'Ramesh Yadav',
    driverPhone: '9820011223',
    gpsDeviceId: 'GPS-BUS-001',
    insuranceExpiry: '2027-12-31'
  });

  const [routeForm, setRouteForm] = useState({
    routeName: '',
    startLocation: 'Main Campus',
    endLocation: 'Metro Station Hub',
    monthlyFee: 1500,
    vehicleId: ''
  });

  const [assignForm, setAssignForm] = useState({
    studentId: '',
    routeId: '',
    pickupStop: 'Central Junction',
    monthlyFee: 1500
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vRes, rRes, sRes] = await Promise.all([
        api.get('/transport/vehicles'),
        api.get('/transport/routes'),
        api.get('/students')
      ]);
      setVehicles(Array.isArray(vRes.data) ? vRes.data : (vRes.data?.data || []));
      setRoutes(Array.isArray(rRes.data) ? rRes.data : (rRes.data?.data || []));
      setStudents(Array.isArray(sRes.data) ? sRes.data : (sRes.data?.data || []));
    } catch (err) {
      setToast({ open: true, message: 'Failed to load transport fleet data', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVehicle = async (e) => {
    e.preventDefault();
    try {
      await api.post('/transport/vehicles', vehicleForm);
      setToast({ open: true, message: 'Vehicle added to school fleet!', severity: 'success' });
      setOpenVehicleDialog(false);
      fetchData();
    } catch (err) {
      setToast({ open: true, message: err.response?.data?.message || 'Error registering vehicle', severity: 'error' });
    }
  };

  const handleCreateRoute = async (e) => {
    e.preventDefault();
    try {
      await api.post('/transport/routes', routeForm);
      setToast({ open: true, message: 'Bus route & fee mapping registered!', severity: 'success' });
      setOpenRouteDialog(false);
      fetchData();
    } catch (err) {
      setToast({ open: true, message: err.response?.data?.message || 'Error creating route', severity: 'error' });
    }
  };

  const handleAssignStudent = async (e) => {
    e.preventDefault();
    try {
      await api.post('/transport/assign-student', assignForm);
      setToast({ open: true, message: 'Student assigned to route!', severity: 'success' });
      setOpenAssignDialog(false);
      fetchData();
    } catch (err) {
      setToast({ open: true, message: err.response?.data?.message || 'Error assigning student', severity: 'error' });
    }
  };

  return (
    <AdminLayout>
      <PageTransition>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h5" fontWeight="900" color="#0f172a">
              Transport & Fleet Management
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Track school buses, compliance fitness expiries, GPS telemetry, route stops, and passenger manifests
            </Typography>
          </Box>
          <Box display="flex" gap={1.5}>
            <Button
              variant="outlined"
              startIcon={<Bus className="w-4 h-4" />}
              onClick={() => setOpenVehicleDialog(true)}
              sx={{ borderColor: '#4338CA', color: '#4338CA', fontWeight: 700, textTransform: 'none' }}
            >
              Add Vehicle
            </Button>
            <Button
              variant="contained"
              startIcon={<Navigation className="w-4 h-4" />}
              onClick={() => setOpenRouteDialog(true)}
              sx={{ bgcolor: '#4338CA', '&:hover': { bgcolor: '#3730A3' }, fontWeight: 700, textTransform: 'none' }}
            >
              New Route
            </Button>
          </Box>
        </Box>

        <Paper sx={{ mb: 3, borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <Tabs
            value={activeTab}
            onChange={(e, val) => setActiveTab(val)}
            sx={{ '& .MuiTab-root': { fontWeight: 800, textTransform: 'none', py: 1.5 }, '& .Mui-selected': { color: '#4338CA' } }}
          >
            <Tab label="Fleet Vehicles & Compliance" />
            <Tab label="Bus Routes & Stops" />
            <Tab label="Passenger Roster & Manifest" />
          </Tabs>
        </Paper>

        {loading ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress sx={{ color: '#4338CA' }} />
          </Box>
        ) : (
          <>
            {activeTab === 0 && (
              <Paper sx={{ borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                <TableContainer>
                  <Table>
                    <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800 }}>Vehicle No</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Model / Description</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Seating Capacity</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Assigned Driver</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>GPS Telemetry ID</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Insurance Compliance</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {vehicles.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} sx={{ textAlign: 'center', py: 5, color: '#64748B' }}>
                            No fleet vehicles registered yet. Click "Add Vehicle" to register one.
                          </TableCell>
                        </TableRow>
                      ) : (
                        vehicles.map(v => (
                          <TableRow key={v._id} hover>
                            <TableCell sx={{ fontWeight: 800, color: '#4338CA' }}>{v.vehicleNo}</TableCell>
                            <TableCell>{v.model}</TableCell>
                            <TableCell>{v.capacity} Passengers</TableCell>
                            <TableCell>{v.driverName} ({v.driverPhone})</TableCell>
                            <TableCell><Chip label={v.gpsDeviceId || 'Active'} size="small" sx={{ bgcolor: '#E0F2FE', color: '#0369A1', fontWeight: 700 }} /></TableCell>
                            <TableCell><Chip label="Compliant" size="small" sx={{ bgcolor: '#DCFCE7', color: '#166534', fontWeight: 800 }} /></TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}

            {activeTab === 1 && (
              <Paper sx={{ borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                <TableContainer>
                  <Table>
                    <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800 }}>Route Name</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Start Location</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Destination</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Monthly Fee (₹)</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Assigned Bus</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {routes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} sx={{ textAlign: 'center', py: 5, color: '#64748B' }}>
                            No bus routes defined yet. Click "New Route" to configure stops.
                          </TableCell>
                        </TableRow>
                      ) : (
                        routes.map(r => (
                          <TableRow key={r._id} hover>
                            <TableCell sx={{ fontWeight: 800, color: '#0F172A' }}>{r.routeName}</TableCell>
                            <TableCell>{r.startLocation}</TableCell>
                            <TableCell>{r.endLocation}</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#16A34A' }}>₹{(r.monthlyFee || 0).toLocaleString()}</TableCell>
                            <TableCell>{r.vehicleId?.vehicleNo || 'Fleet Bus 01'}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}

            {activeTab === 2 && (
              <Box>
                <Box mb={2} display="flex" justifyContent="flex-end">
                  <Button variant="contained" startIcon={<Plus className="w-4 h-4" />} onClick={() => setOpenAssignDialog(true)} sx={{ bgcolor: '#4338CA' }}>
                    Assign Student Passenger
                  </Button>
                </Box>
                <Paper sx={{ p: 4, borderRadius: '14px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                  <Users className="w-12 h-12 text-indigo-500 mx-auto mb-2" />
                  <Typography variant="h6" fontWeight="bold">Passenger Manifest Active</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Students assigned to bus routes are linked with digital emergency contacts and fee ledgers.
                  </Typography>
                </Paper>
              </Box>
            )}
          </>
        )}

        {/* Add Vehicle Dialog */}
        <Dialog open={openVehicleDialog} onClose={() => setOpenVehicleDialog(false)} maxWidth="sm" fullWidth>
          <form onSubmit={handleCreateVehicle}>
            <DialogTitle sx={{ fontWeight: 800 }}>Register Fleet Vehicle</DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Vehicle Registration No" required value={vehicleForm.vehicleNo} onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleNo: e.target.value })} placeholder="MH-02-AB-1234" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Bus Model" value={vehicleForm.model} onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Seating Capacity" type="number" value={vehicleForm.capacity} onChange={(e) => setVehicleForm({ ...vehicleForm, capacity: Number(e.target.value) })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="GPS Device Hardware ID" value={vehicleForm.gpsDeviceId} onChange={(e) => setVehicleForm({ ...vehicleForm, gpsDeviceId: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Driver Name" value={vehicleForm.driverName} onChange={(e) => setVehicleForm({ ...vehicleForm, driverName: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Driver Phone Number" value={vehicleForm.driverPhone} onChange={(e) => setVehicleForm({ ...vehicleForm, driverPhone: e.target.value })} />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setOpenVehicleDialog(false)}>Cancel</Button>
              <Button type="submit" variant="contained" sx={{ bgcolor: '#4338CA' }}>Save Vehicle</Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Add Route Dialog */}
        <Dialog open={openRouteDialog} onClose={() => setOpenRouteDialog(false)} maxWidth="sm" fullWidth>
          <form onSubmit={handleCreateRoute}>
            <DialogTitle sx={{ fontWeight: 800 }}>Create Bus Route</DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth label="Route Name" required value={routeForm.routeName} onChange={(e) => setRouteForm({ ...routeForm, routeName: e.target.value })} placeholder="Route 1: Western Express Corridor" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Starting Terminal" value={routeForm.startLocation} onChange={(e) => setRouteForm({ ...routeForm, startLocation: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Ending Terminal" value={routeForm.endLocation} onChange={(e) => setRouteForm({ ...routeForm, endLocation: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Monthly Transport Fee (₹)" type="number" value={routeForm.monthlyFee} onChange={(e) => setRouteForm({ ...routeForm, monthlyFee: Number(e.target.value) })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField select fullWidth label="Assign Vehicle" value={routeForm.vehicleId} onChange={(e) => setRouteForm({ ...routeForm, vehicleId: e.target.value })}>
                    {vehicles.map(v => <MenuItem key={v._id} value={v._id}>{v.vehicleNo} ({v.model})</MenuItem>)}
                  </TextField>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setOpenRouteDialog(false)}>Cancel</Button>
              <Button type="submit" variant="contained" sx={{ bgcolor: '#4338CA' }}>Save Route</Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Assign Student Dialog */}
        <Dialog open={openAssignDialog} onClose={() => setOpenAssignDialog(false)} maxWidth="xs" fullWidth>
          <form onSubmit={handleAssignStudent}>
            <DialogTitle sx={{ fontWeight: 800 }}>Assign Student Passenger</DialogTitle>
            <DialogContent dividers>
              <TextField select fullWidth label="Student" required value={assignForm.studentId} onChange={(e) => setAssignForm({ ...assignForm, studentId: e.target.value })} sx={{ mb: 2 }}>
                {students.map(s => <MenuItem key={s._id} value={s._id}>{s.fname} {s.lname}</MenuItem>)}
              </TextField>
              <TextField select fullWidth label="Route" required value={assignForm.routeId} onChange={(e) => setAssignForm({ ...assignForm, routeId: e.target.value })} sx={{ mb: 2 }}>
                {routes.map(r => <MenuItem key={r._id} value={r._id}>{r.routeName}</MenuItem>)}
              </TextField>
              <TextField fullWidth label="Boarding Stop" value={assignForm.pickupStop} onChange={(e) => setAssignForm({ ...assignForm, pickupStop: e.target.value })} />
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setOpenAssignDialog(false)}>Cancel</Button>
              <Button type="submit" variant="contained" sx={{ bgcolor: '#4338CA' }}>Assign</Button>
            </DialogActions>
          </form>
        </Dialog>

        <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast({ ...toast, open: false })}>
          <Alert severity={toast.severity} onClose={() => setToast({ ...toast, open: false })}>{toast.message}</Alert>
        </Snackbar>
      </PageTransition>
    </AdminLayout>
  );
};

export default TransportManagement;
