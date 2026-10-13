const express = require('express');
const router = express.Router();
const { SaaSPlan, SaaSSubscription } = require('../models/SaaSSubscription');
const Institute = require('../models/Institute');
const Student = require('../models/Students');
const Staff = require('../models/Staff');
const { authenticateAdmin } = require('../middleware/auth');

/**
 * ---------------- SAAS PLANS ----------------
 */
router.get('/plans', async (req, res) => {
  try {
    const plans = await SaaSPlan.find({ isPublic: true }).sort({ monthlyPrice: 1 });
    res.json({ success: true, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/plans', authenticateAdmin, async (req, res) => {
  try {
    const plan = new SaaSPlan(req.body);
    const saved = await plan.save();
    res.status(201).json({ success: true, message: 'SaaS Plan created', data: saved });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * ---------------- TENANT SUBSCRIPTION ----------------
 */
router.get('/subscription/current', authenticateAdmin, async (req, res) => {
  try {
    let sub = await SaaSSubscription.findOne({ instituteId: req.instituteId }).populate('planId');

    // Auto-create trial subscription if none exists
    if (!sub) {
      let defaultPlan = await SaaSPlan.findOne({ code: 'PRO' }) || await SaaSPlan.findOne({});
      if (!defaultPlan) {
        defaultPlan = await SaaSPlan.create({
          name: 'ClassTech Pro Growth Tier',
          code: 'PRO',
          monthlyPrice: 4999,
          annualPrice: 49990,
          maxStudents: 1000,
          maxStaff: 100,
          storageLimitGB: 50,
          enabledModules: ['attendance', 'fees', 'lms', 'timetable', 'exams', 'transport', 'library', 'inventory', 'biometrics'],
        });
      }

      const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14-day trial
      sub = await SaaSSubscription.create({
        instituteId: req.instituteId,
        planId: defaultPlan._id,
        planCode: defaultPlan.code,
        billingCycle: 'Monthly',
        amount: defaultPlan.monthlyPrice,
        status: 'Trial',
        currentPeriodEnd: trialEnd,
      });
      sub = await sub.populate('planId');
    }

    // Compute actual resource usage
    const studentCount = await Student.countDocuments({ instituteId: req.instituteId, status: 'Active' });
    const staffCount = await Staff.countDocuments({ instituteId: req.instituteId, status: 'Active' });

    res.json({
      success: true,
      data: {
        subscription: sub,
        usage: {
          currentStudents: studentCount,
          maxStudents: sub.planId ? sub.planId.maxStudents : 1000,
          studentUsagePercent: Math.round((studentCount / (sub.planId ? sub.planId.maxStudents : 1000)) * 100),
          currentStaff: staffCount,
          maxStaff: sub.planId ? sub.planId.maxStaff : 100,
        },
        isExpired: sub.status === 'Expired',
        daysRemaining: Math.max(0, Math.ceil((new Date(sub.currentPeriodEnd) - new Date()) / (1000 * 60 * 60 * 24))),
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Upgrade / Renew Subscription
router.post('/subscription/upgrade', authenticateAdmin, async (req, res) => {
  try {
    const { planId, billingCycle = 'Monthly', paymentReference = 'MOCK_TXN_PLATFORM' } = req.body;
    const plan = await SaaSPlan.findById(planId);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    const months = billingCycle === 'Annual' ? 12 : 1;
    const price = billingCycle === 'Annual' ? plan.annualPrice : plan.monthlyPrice;
    const newEnd = new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000);

    const invoiceNo = `INV-SAAS-${Date.now().toString().slice(-6)}`;

    const updated = await SaaSSubscription.findOneAndUpdate(
      { instituteId: req.instituteId },
      {
        planId: plan._id,
        planCode: plan.code,
        billingCycle,
        amount: price,
        status: 'Active',
        currentPeriodEnd: newEnd,
        $push: {
          platformInvoices: {
            invoiceNo,
            amount: price,
            billingDate: new Date(),
            paymentStatus: 'Paid',
            paymentReference,
            paymentMethod: 'Platform Gateway',
          }
        }
      },
      { upsert: true, new: true }
    ).populate('planId');

    res.json({
      success: true,
      message: `Subscription activated on ${plan.name}! Next billing date: ${newEnd.toISOString().split('T')[0]}`,
      data: updated,
      invoice: {
        invoiceNo,
        amount: price,
        date: new Date(),
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * ---------------- SUPERADMIN PLATFORM METRICS ----------------
 */
router.get('/platform/metrics', authenticateAdmin, async (req, res) => {
  try {
    const totalTenants = await Institute.countDocuments();
    const activeSubscriptions = await SaaSSubscription.countDocuments({ status: 'Active' });
    const trialSubscriptions = await SaaSSubscription.countDocuments({ status: 'Trial' });
    const subscriptions = await SaaSSubscription.find({ status: 'Active' });

    const mrr = subscriptions.reduce((sum, s) => {
      return sum + (s.billingCycle === 'Annual' ? Math.round(s.amount / 12) : s.amount);
    }, 0);

    res.json({
      success: true,
      metrics: {
        totalTenants,
        activeSubscriptions,
        trialSubscriptions,
        monthlyRecurringRevenue: `₹${mrr.toLocaleString('en-IN')}`,
        annualRecurringRevenue: `₹${(mrr * 12).toLocaleString('en-IN')}`,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
