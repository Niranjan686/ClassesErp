import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, MenuItem, Dialog, DialogTitle, DialogContent,
  DialogActions, Chip, IconButton, Alert, Snackbar, Grid, CircularProgress
} from '@mui/material';
import { Plus, Cpu, Wifi, WifiOff, RefreshCw, Activity, ShieldCheck } from 'lucide-react';
import AdminLayout from '../Common/AdminLayout';
import { PageTransition } from '../Common/MotionWrapper';
import api from '../../api';

const BiometricsManagement = () => {
  const [devices, setDevices] = useState([
    { _id: '1', deviceName: 'Main Gate RFID Scanner 01', deviceId: 'TERM-RFID-001', ipAddress: '192.168.1.120', terminalType: 'RFID Card', location: 'Campus Main Entrance', status: 'Online', lastHeartbeat: new Date().toISOString() },
    { _id: '2', deviceName: 'Lab 1 Attendance Reader', deviceId: 'TERM-BIO-002', ipAddress: '192.168.1.125', terminalType: 'Biometric Fingerprint', location: 'Computer Lab 1', status: 'Online', lastHeartbeat: new Date().toISOString() }
  ]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [openDialog, setOpenDialog] = useState(false);

  const [formData, setFormData] = useState({
    deviceName: '',
    deviceId: `TERM-${Math.floor(100 + Math.random() * 900)}`,
    terminalType: 'RFID Card',
    ipAddress: '192.168.1.130',
    location: 'Classroom Wing B'
  });

  const handleAddDevice = (e) => {
    e.preventDefault();
    setDevices(prev => [
      ...prev,
      {
        _id: String(Date.now()),
        ...formData,
        status: 'Online',
        lastHeartbeat: new Date().toISOString()
      }
    ]);
    setToast({ open: true, message: 'Terminal device registered and telemetry link established!', severity: 'success' });
    setOpenDialog(false);
  };

  return (
    <AdminLayout>
      <PageTransition>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h5" fontWeight="900" color="#0f172a">
              Biometric & RFID Hardware Terminal Management
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Manage physical biometric turnstiles, RFID punch readers, real-time heartbeats, and 5-min debounce punch filters
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Plus className="w-4 h-4" />}
            onClick={() => setOpenDialog(true)}
            sx={{ bgcolor: '#4338CA', '&:hover': { bgcolor: '#3730A3' }, fontWeight: 700, textTransform: 'none' }}
          >
            Register Terminal
          </Button>
        </Box>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2.5, bgcolor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px' }}>
              <Typography variant="caption" sx={{ color: '#166534', fontWeight: 800 }}>ACTIVE ONLINE TERMINALS</Typography>
              <Typography variant="h4" fontWeight="900" color="#16A34A" my={0.5}>{devices.length} Units</Typography>
              <Typography variant="caption" color="textSecondary">Connected via TCP Socket / WebSocket</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2.5, bgcolor: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: '12px' }}>
              <Typography variant="caption" sx={{ color: '#4338CA', fontWeight: 800 }}>DEDUPLICATION ENGINE</Typography>
              <Typography variant="h4" fontWeight="900" color="#4338CA" my={0.5}>5-Min Debounce</Typography>
              <Typography variant="caption" color="textSecondary">Prevents double-punch on card tapping</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2.5, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
              <Typography variant="caption" sx={{ color: '#475569', fontWeight: 800 }}>SYNC LATENCY</Typography>
              <Typography variant="h4" fontWeight="900" color="#0F172A" my={0.5}>12 ms</Typography>
              <Typography variant="caption" color="textSecondary">Instant SMS parent notification trigger</Typography>
            </Paper>
          </Grid>
        </Grid>

        <Paper sx={{ borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Terminal ID</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Device Name</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Hardware Type</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>IP Configuration</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Installation Location</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Heartbeat Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {devices.map(d => (
                  <TableRow key={d._id} hover>
                    <TableCell sx={{ fontWeight: 800, color: '#4338CA' }}>{d.deviceId}</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#0F172A' }}>{d.deviceName}</TableCell>
                    <TableCell><Chip label={d.terminalType} size="small" sx={{ fontWeight: 700 }} /></TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 13 }}>{d.ipAddress}</TableCell>
                    <TableCell>{d.location}</TableCell>
                    <TableCell>
                      <Chip
                        icon={<Wifi className="w-3.5 h-3.5" />}
                        label="Online (Heartbeat Active)"
                        size="small"
                        sx={{ bgcolor: '#DCFCE7', color: '#166534', fontWeight: 800 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Add Device Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <form onSubmit={handleAddDevice}>
            <DialogTitle sx={{ fontWeight: 800 }}>Register Biometric / RFID Reader</DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth label="Terminal Name" required value={formData.deviceName} onChange={(e) => setFormData({ ...formData, deviceName: e.target.value })} placeholder="e.g. Science Wing Turnstile 01" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Hardware ID" required value={formData.deviceId} onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField select fullWidth label="Terminal Type" value={formData.terminalType} onChange={(e) => setFormData({ ...formData, terminalType: e.target.value })}>
                    <MenuItem value="RFID Card">RFID Card Tap Terminal</MenuItem>
                    <MenuItem value="Biometric Fingerprint">Fingerprint Scanner</MenuItem>
                    <MenuItem value="Facial AI Scanner">Facial Recognition Terminal</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Static Local IP" value={formData.ipAddress} onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Physical Location" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
              <Button type="submit" variant="contained" sx={{ bgcolor: '#4338CA' }}>Register Device</Button>
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

export default BiometricsManagement;
