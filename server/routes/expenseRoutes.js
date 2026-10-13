const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const FeeTransaction = require('../models/FeeTransaction');
const Institute = require('../models/Institute');
const { authenticateAdmin } = require('../middleware/auth');

/**
 * List Expenses
 */
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const query = { instituteId: req.instituteId };
    if (req.query.category && req.query.category !== 'ALL') query.category = req.query.category;
    if (req.query.paymentStatus && req.query.paymentStatus !== 'ALL') query.paymentStatus = req.query.paymentStatus;
    if (req.query.month) query.expenseDate = { $regex: `^${req.query.month}` };

    const expenses = await Expense.find(query).sort({ expenseDate: -1, createdAt: -1 });
    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

    res.json({ success: true, totalAmount, count: expenses.length, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Create Expense Voucher
 */
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { title, category, amount, expenseDate, payeeName, invoiceNumber, paymentMode, paymentStatus, remarks } = req.body;
    if (!title || !category || !amount || !payeeName) {
      return res.status(400).json({ success: false, message: 'title, category, amount, and payeeName are required.' });
    }

    const inst = await Institute.findById(req.instituteId);
    const prefix = inst ? inst.code : 'EXP';
    const year = new Date().getFullYear();
    const count = await Expense.countDocuments({ instituteId: req.instituteId });
    const voucherNo = `${prefix}-EXP-${year}-${(count + 1).toString().padStart(4, '0')}`;

    const expense = new Expense({
      instituteId: req.instituteId,
      voucherNo,
      title,
      category,
      amount: Number(amount),
      expenseDate: expenseDate || new Date().toISOString().split('T')[0],
      payeeName,
      invoiceNumber: invoiceNumber || '',
      paymentMode: paymentMode || 'Bank Transfer',
      paymentStatus: paymentStatus || 'Paid',
      approvedBy: req.user ? req.user.name : 'Finance Admin',
      remarks,
    });

    const saved = await expense.save();
    res.status(201).json({ success: true, message: 'Expense voucher recorded successfully', data: saved });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * Update Expense Voucher
 */
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const updated = await Expense.findOneAndUpdate(
      { _id: req.params.id, instituteId: req.instituteId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'Expense record not found' });
    res.json({ success: true, message: 'Expense updated successfully', data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * Delete Expense Voucher
 */
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    await Expense.findOneAndDelete({ _id: req.params.id, instituteId: req.instituteId });
    res.json({ success: true, message: 'Expense voucher deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Financial Cashbook & Income vs Expenses Summary
 */
router.get('/financial-summary', authenticateAdmin, async (req, res) => {
  try {
    const month = req.query.month || new Date().toISOString().substring(0, 7);

    // 1. Total Fee Income in Month
    const feeTransactions = await FeeTransaction.find({
      instituteId: req.instituteId,
      paymentDate: { $regex: `^${month}` }
    });
    const totalFeeIncome = feeTransactions.reduce((sum, tx) => sum + (tx.amountPaid || 0), 0);

    // 2. Total Expenses in Month
    const expenses = await Expense.find({
      instituteId: req.instituteId,
      expenseDate: { $regex: `^${month}` },
      paymentStatus: 'Paid',
    });
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    const netSurplus = totalFeeIncome - totalExpenses;

    // 3. Category Breakdown
    const categoryBreakdown = {};
    expenses.forEach(e => {
      categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + e.amount;
    });

    res.json({
      success: true,
      month,
      summary: {
        totalIncome: totalFeeIncome,
        totalExpenses,
        netSurplus,
        operatingMarginPercent: totalFeeIncome > 0 ? Math.round((netSurplus / totalFeeIncome) * 100) : 0,
      },
      categoryBreakdown,
      recentExpenses: expenses.slice(0, 10),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
