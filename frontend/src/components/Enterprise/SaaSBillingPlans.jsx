import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Grid, CircularProgress, Alert, Snackbar, Card, CardContent
} from '@mui/material';
import { CreditCard, Check, Zap, Shield, Sparkles, TrendingUp } from 'lucide-react';
import AdminLayout from '../Common/AdminLayout';
import { PageTransition } from '../Common/MotionWrapper';
import api from '../../api';

const SaaSBillingPlans = () => {
  const [plans, setPlans] = useState([]);
  const [mrrData, setMrrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pRes, mRes] = await Promise.all([
        api.get('/saas/plans'),
        api.get('/saas/mrr-arr')
      ]);
      setPlans(Array.isArray(pRes.data) ? pRes.data : (pRes.data?.data || []));
      setMrrData(mRes.data?.data || mRes.data || null);
    } catch (err) {
      setToast({ open: true, message: 'Failed to load SaaS billing plans', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <PageTransition>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h5" fontWeight="900" color="#0f172a">
              SaaS Multi-Tenant Subscription & Billing Plans
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Manage institution SaaS subscription tiers, 14-day trial activations, student capacity quotas, and ARR/MRR metrics
            </Typography>
          </Box>
        </Box>

        {/* ARR & MRR SaaS Metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 3, bgcolor: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: '14px' }}>
              <Typography variant="caption" sx={{ color: '#4338CA', fontWeight: 800 }}>MONTHLY RECURRING REVENUE (MRR)</Typography>
              <Typography variant="h4" fontWeight="900" color="#3730A3" my={1}>
                ₹{(mrrData?.mrr || 45000).toLocaleString()}
              </Typography>
              <Typography variant="caption" color="textSecondary">Active recurring SaaS tenant billing</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 3, bgcolor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '14px' }}>
              <Typography variant="caption" sx={{ color: '#166534', fontWeight: 800 }}>ANNUAL RUN RATE (ARR)</Typography>
              <Typography variant="h4" fontWeight="900" color="#16A34A" my={1}>
                ₹{(mrrData?.arr || 540000).toLocaleString()}
              </Typography>
              <Typography variant="caption" color="textSecondary">Projected annual institutional contract value</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 3, bgcolor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '14px' }}>
              <Typography variant="caption" sx={{ color: '#92400E', fontWeight: 800 }}>ONBOARDING TRIAL PERIOD</Typography>
              <Typography variant="h4" fontWeight="900" color="#B45309" my={1}>14 Days Free</Typography>
              <Typography variant="caption" color="textSecondary">Full multi-tenant feature access enabled</Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Tier Comparison Cards */}
        <Typography variant="h6" fontWeight="800" color="#0F172A" mb={2}>
          Institutional Subscription Tiers
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: '16px', border: '1px solid #E2E8F0', height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Chip label="Starter Academy" size="small" sx={{ bgcolor: '#F1F5F9', fontWeight: 800, mb: 2 }} />
                <Typography variant="h4" fontWeight="900" color="#0F172A">₹2,499<span className="text-sm font-normal text-slate-500">/month</span></Typography>
                <Typography variant="body2" color="textSecondary" my={2}>
                  Ideal for growing single-branch coaching institutes and tutoring centers.
                </Typography>
                <div className="space-y-2 text-sm text-slate-700">
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /><span>Up to 250 Active Students</span></div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /><span>Batch Attendance & Fee Ledger</span></div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /><span>Student Mobile App Access</span></div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /><span>PDF & CSV Analytics Reports</span></div>
                </div>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: '16px', border: '2px solid #4338CA', position: 'relative', height: '100%', bgcolor: '#FAF5FF' }}>
              <div className="absolute top-3 right-3">
                <Chip label="Most Popular" size="small" sx={{ bgcolor: '#4338CA', color: '#FFFFFF', fontWeight: 800 }} />
              </div>
              <CardContent sx={{ p: 3 }}>
                <Chip label="Growth Campus" size="small" sx={{ bgcolor: '#EEF2FF', color: '#4338CA', fontWeight: 800, mb: 2 }} />
                <Typography variant="h4" fontWeight="900" color="#0F172A">₹5,999<span className="text-sm font-normal text-slate-500">/month</span></Typography>
                <Typography variant="body2" color="textSecondary" my={2}>
                  For full-fledged schools, CBSE/ICSE colleges, and multi-batch academies.
                </Typography>
                <div className="space-y-2 text-sm text-slate-700">
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /><span>Up to 1,500 Active Students</span></div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /><span>Biometric RFID Turnstile Integration</span></div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /><span>Timetable & Substitute Management</span></div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /><span>Library & Fleet Transport Engine</span></div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /><span>AI Predictive Risk & Insights</span></div>
                </div>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: '16px', border: '1px solid #E2E8F0', height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Chip label="Enterprise Group" size="small" sx={{ bgcolor: '#F1F5F9', fontWeight: 800, mb: 2 }} />
                <Typography variant="h4" fontWeight="900" color="#0F172A">₹14,999<span className="text-sm font-normal text-slate-500">/month</span></Typography>
                <Typography variant="body2" color="textSecondary" my={2}>
                  For school groups, multi-campus university chains, and franchise headquarters.
                </Typography>
                <div className="space-y-2 text-sm text-slate-700">
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /><span>Unlimited Students & Campuses</span></div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /><span>Custom Domain & Brand Whitelabel</span></div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /><span>Full Payroll, Leave & Cashbook</span></div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /><span>Chunked Large File Vault (100GB+)</span></div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /><span>24/7 Dedicated SLA Support</span></div>
                </div>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast({ ...toast, open: false })}>
          <Alert severity={toast.severity} onClose={() => setToast({ ...toast, open: false })}>{toast.message}</Alert>
        </Snackbar>
      </PageTransition>
    </AdminLayout>
  );
};

export default SaaSBillingPlans;
