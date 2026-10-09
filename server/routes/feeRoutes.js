const express = require('express');
const router = express.Router();
const FeeTransaction = require('../models/FeeTransaction');
const Student = require('../models/Students');
const Institute = require('../models/Institute');
const { authenticateAdmin, authenticateStudent } = require('../middleware/auth');

/**
 * Get Fee Analytics (Admin)
 */
router.get('/analytics', authenticateAdmin, async (req, res) => {
  try {
    const students = await Student.find({ instituteId: req.instituteId });
    const transactions = await FeeTransaction.find({ instituteId: req.instituteId });

    const totalExpected = students.reduce((sum, s) => sum + (s.totalFees || 0), 0);
    const totalCollected = students.reduce((sum, s) => sum + (s.paidFees || 0), 0);
    const totalPending = students.reduce((sum, s) => sum + (s.balanceFees || 0), 0);
    const defaulters = students.filter(s => (s.balanceFees || 0) > 0);

    const todayStr = new Date().toISOString().split('T')[0];
    const todayCollected = transactions
      .filter(t => t.paymentDate === todayStr)
      .reduce((sum, t) => sum + (t.amountPaid || 0), 0);

    const startOfMonthStr = new Date().toISOString().substring(0, 7);
    const monthCollected = transactions
      .filter(t => (t.paymentDate || '').startsWith(startOfMonthStr))
      .reduce((sum, t) => sum + (t.amountPaid || 0), 0);

    res.json({
      success: true,
      data: {
        totalExpected,
        totalCollected,
        totalBalance: totalPending,
        totalPending,
        collectionRate: totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0,
        totalDefaultersCount: defaulters.length,
        todayCollected,
        monthCollected: monthCollected || totalCollected,
        totalTransactionsCount: transactions.length,
        kpis: {
          totalExpected,
          totalCollected,
          totalBalance: totalPending,
          totalPending,
          collectionRate: totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0,
          totalDefaultersCount: defaulters.length,
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get Fee Transactions (Admin)
 */
router.get('/transactions', authenticateAdmin, async (req, res) => {
  try {
    const { studentId, courseId, batchId, startDate, endDate, search } = req.query;
    let query = { instituteId: req.instituteId };

    if (studentId) query.studentId = studentId;
    if (courseId && courseId !== 'ALL') query.courseId = courseId;
    if (batchId && batchId !== 'ALL') query.batchId = batchId;

    if (startDate && endDate) {
      query.paymentDate = { $gte: startDate, $lte: endDate };
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { studentName: searchRegex },
        { receiptNo: searchRegex },
        { grno: searchRegex },
      ];
    }

    const transactions = await FeeTransaction.find(query).sort({ createdAt: -1 });

    // Summary KPIs
    const totalCollected = transactions.reduce((acc, t) => acc + (t.amountPaid || 0), 0);
    const todayStr = new Date().toISOString().split('T')[0];
    const todayCollected = transactions
      .filter(t => t.paymentDate === todayStr)
      .reduce((acc, t) => acc + (t.amountPaid || 0), 0);

    res.json({
      success: true,
      data: transactions,
      summary: {
        totalCollected,
        todayCollected,
        transactionCount: transactions.length,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Collect Fee / Record Payment (Admin)
 */
router.post('/collect', authenticateAdmin, async (req, res) => {
  try {
    const { studentId, amountPaid, paymentMode, transactionRef, discount, discountReason, remarks } = req.body;

    const student = await Student.findOne({ _id: studentId, instituteId: req.instituteId });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }

    const inst = await Institute.findById(req.instituteId);
    const prefix = inst?.receiptPrefix || 'REC';
    const txCount = await FeeTransaction.countDocuments({ instituteId: req.instituteId });
    const receiptNo = `${prefix}-${student.studentId || 'STU'}-${(txCount + 1).toString().padStart(4, '0')}`;

    const paidNum = Number(amountPaid) || 0;
    const discNum = Number(discount) || 0;

    student.paidFees = (student.paidFees || 0) + paidNum;
    if (discNum > 0) {
      student.discountAmount = (student.discountAmount || 0) + discNum;
      student.discountReason = discountReason || student.discountReason;
    }
    student.balanceFees = Math.max(0, (student.totalFees || 0) - (student.paidFees + student.discountAmount));
    await student.save();

    const tx = new FeeTransaction({
      instituteId: req.instituteId,
      receiptNo,
      studentId: student._id,
      studentName: `${student.fname} ${student.lname}`,
      grno: student.grno,
      courseId: student.courseId,
      batchId: student.batchId,
      amountPaid: paidNum,
      discount: discNum,
      discountReason,
      paymentMode: paymentMode || 'UPI',
      transactionRef: transactionRef || '',
      remainingBalance: student.balanceFees,
      paymentDate: new Date().toISOString().split('T')[0],
      collectedBy: req.user.name,
      remarks: remarks || 'Fee installment payment received',
      status: 'Paid',
    });

    await tx.save();

    res.status(201).json({
      success: true,
      message: `Payment of ₹${paidNum.toLocaleString()} recorded successfully! Receipt #${receiptNo} generated.`,
      data: tx,
      studentBalance: student.balanceFees,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Student Online Fee Payment (Razorpay Order creation & verification simulation)
 */
router.post('/student-pay', authenticateStudent, async (req, res) => {
  try {
    const student = req.student;
    const { amount, paymentMode = 'Razorpay' } = req.body;
    const payAmount = Number(amount);

    if (!payAmount || payAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment amount' });
    }

    const inst = await Institute.findById(req.instituteId);
    const prefix = inst?.receiptPrefix || 'REC';
    const txCount = await FeeTransaction.countDocuments({ instituteId: req.instituteId });
    const receiptNo = `${prefix}-${student.studentId || 'ONLINE'}-${(txCount + 1).toString().padStart(4, '0')}`;
    const orderId = `order_${Math.random().toString(36).substring(2, 12)}`;
    const paymentId = `pay_${Math.random().toString(36).substring(2, 12)}`;

    student.paidFees = (student.paidFees || 0) + payAmount;
    student.balanceFees = Math.max(0, (student.totalFees || 0) - (student.paidFees + (student.discountAmount || 0)));
    await student.save();

    const tx = new FeeTransaction({
      instituteId: req.instituteId,
      receiptNo,
      studentId: student._id,
      studentName: `${student.fname} ${student.lname}`,
      grno: student.grno,
      courseId: student.courseId,
      batchId: student.batchId,
      amountPaid: payAmount,
      paymentMode,
      transactionRef: paymentId,
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      remainingBalance: student.balanceFees,
      paymentDate: new Date().toISOString().split('T')[0],
      collectedBy: 'Online Payment Gateway (Razorpay)',
      remarks: 'Online student fee settlement',
      status: 'Paid',
    });

    await tx.save();

    res.json({
      success: true,
      message: `Online fee payment of ₹${payAmount.toLocaleString()} completed successfully!`,
      data: tx,
      remainingBalance: student.balanceFees,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get Student Fee Ledger (Student Portal)
 */
router.get('/my-ledger', authenticateStudent, async (req, res) => {
  try {
    const student = req.student;
    const transactions = await FeeTransaction.find({
      instituteId: req.instituteId,
      studentId: student._id,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        totalFees: student.totalFees,
        paidFees: student.paidFees,
        balanceFees: student.balanceFees,
        discountAmount: student.discountAmount || 0,
        transactions,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
