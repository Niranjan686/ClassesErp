const express = require('express');
const router = express.Router();
const Staff = require('../models/Staff');
const Institute = require('../models/Institute');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');
const { authenticateAdmin } = require('../middleware/auth');

/**
 * Get all staff members (tenant scoped)
 */
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const query = req.instituteId ? { instituteId: req.instituteId } : {};
    if (req.query.status && req.query.status !== 'ALL') {
      query.status = req.query.status;
    }
    if (req.query.department && req.query.department !== 'ALL') {
      query.department = req.query.department;
    }
    if (req.query.search) {
      const reg = new RegExp(req.query.search, 'i');
      query.$or = [{ name: reg }, { email: reg }, { phone: reg }, { staffId: reg }];
    }

    const staffList = await Staff.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: staffList });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get single staff member by ID
 */
router.get('/:id', authenticateAdmin, async (req, res) => {
  try {
    const query = { _id: req.params.id };
    if (req.instituteId) query.instituteId = req.instituteId;

    const member = await Staff.findOne(query);
    if (!member) return res.status(404).json({ success: false, message: 'Staff member not found' });
    res.json({ success: true, data: member });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Create new staff member
 */
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const instId = req.instituteId || req.body.instituteId;
    const inst = await Institute.findById(instId);
    const prefix = inst ? inst.code : 'STF';

    let staffId = req.body.staffId;
    if (!staffId) {
      const count = await Staff.countDocuments({ instituteId: instId });
      staffId = `${prefix}-STF-${(count + 1).toString().padStart(3, '0')}`;
    }

    const newStaff = new Staff({
      ...req.body,
      instituteId: instId,
      staffId,
    });

    const saved = await newStaff.save();
    res.status(201).json({ success: true, message: 'Staff member created successfully', data: saved });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * Update staff member
 */
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const query = { _id: req.params.id };
    if (req.instituteId) query.instituteId = req.instituteId;

    const updated = await Staff.findOneAndUpdate(query, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Staff member not found' });
    res.json({ success: true, message: 'Staff member updated successfully', data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * Delete staff member
 */
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const query = { _id: req.params.id };
    if (req.instituteId) query.instituteId = req.instituteId;

    const removed = await Staff.findOneAndDelete(query);
    if (!removed) return res.status(404).json({ success: false, message: 'Staff member not found' });
    res.json({ success: true, message: 'Staff member removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get monthly payroll records
 */
router.get('/payroll/records', authenticateAdmin, async (req, res) => {
  try {
    const month = req.query.month || new Date().toISOString().substring(0, 7);
    const query = { month };
    if (req.instituteId) query.instituteId = req.instituteId;

    const records = await Payroll.find(query).populate('staffId', 'name phone email designation');
    res.json({ success: true, data: records, month });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Generate monthly payroll slips for all active staff
 */
router.post('/payroll/generate', authenticateAdmin, async (req, res) => {
  try {
    const instId = req.instituteId || req.body.instituteId;
    const month = req.body.month || new Date().toISOString().substring(0, 7);
    const totalWorkingDays = Number(req.body.totalWorkingDays) || 26;

    const staffMembers = await Staff.find({ instituteId: instId, status: 'Active' });
    const generatedSlips = [];

    for (const member of staffMembers) {
      const baseSalary = member.salary || 0;
      const dailyRate = Math.round(baseSalary / totalWorkingDays);

      // Check approved leaves for this staff in this month
      const leaves = await Leave.find({
        instituteId: instId,
        applicantId: member._id,
        applicantType: 'Staff',
        status: 'Approved',
        startDate: { $regex: `^${month}` }
      });

      const totalLeaveDays = leaves.reduce((sum, l) => sum + (l.totalDays || 1), 0);
      const leaveDeduction = totalLeaveDays * dailyRate;
      const grossPay = baseSalary;
      const netPay = Math.max(0, grossPay - leaveDeduction);

      const slipData = {
        instituteId: instId,
        staffId: member._id,
        staffName: member.name,
        staffCode: member.staffId,
        designation: member.designation,
        month,
        baseSalary,
        totalWorkingDays,
        presentDays: Math.max(0, totalWorkingDays - totalLeaveDays),
        leaveDays: totalLeaveDays,
        dailyRate,
        allowances: [],
        deductions: leaveDeduction > 0 ? [{ title: 'Unpaid Leave Deduction', amount: leaveDeduction }] : [],
        grossPay,
        netPay,
        paymentStatus: 'Pending',
      };

      const slip = await Payroll.findOneAndUpdate(
        { instituteId: instId, staffId: member._id, month },
        slipData,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      generatedSlips.push(slip);
    }

    res.json({
      success: true,
      message: `Generated ${generatedSlips.length} payroll slips for ${month}`,
      data: generatedSlips
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Mark payroll slip as Paid
 */
router.put('/payroll/:id/pay', authenticateAdmin, async (req, res) => {
  try {
    const { paymentMode = 'Bank Transfer', transactionReference = '', remarks = '' } = req.body;
    const query = { _id: req.params.id };
    if (req.instituteId) query.instituteId = req.instituteId;

    const slip = await Payroll.findOneAndUpdate(
      query,
      {
        paymentStatus: 'Paid',
        paymentDate: new Date(),
        paymentMode,
        transactionReference,
        remarks,
      },
      { new: true }
    );

    if (!slip) return res.status(404).json({ success: false, message: 'Payroll record not found' });
    res.json({ success: true, message: 'Payroll slip marked as Paid', data: slip });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
