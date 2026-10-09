const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Student = require('../models/Students');
const Attendance = require('../models/Attendance');
const Course = require('../models/Course');
const Batch = require('../models/Batch');
const FeeTransaction = require('../models/FeeTransaction');
const Marks = require('../models/Marks');
const Homework = require('../models/Homework');
const Complaint = require('../models/Complaint');
const Institute = require('../models/Institute');
const User = require('../models/user');
const { authenticateAdmin } = require('../middleware/auth');
const { sendStudentWelcome } = require('../utils/notifyService');

/**
 * Generate Next Student ID / GR No for the Institute
 */
router.get('/next-id', authenticateAdmin, async (req, res) => {
  try {
    const inst = await Institute.findById(req.instituteId);
    const prefix = inst ? inst.code : 'DEMO01';
    const year = new Date().getFullYear();
    const count = await Student.countDocuments({ instituteId: req.instituteId });
    const nextNum = (count + 1).toString().padStart(4, '0');
    const studentId = `${prefix}-${year}-${nextNum}`;
    const nextGrno = `${prefix}-GR-${nextNum}`;

    res.json({ success: true, studentId, nextGrno });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get all students for the institute with search, filter, and pagination
 */
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const { search, courseId, batchId, status, page = 1, limit = 100 } = req.query;
    let query = { instituteId: req.instituteId };

    if (status && status !== 'ALL') query.status = status;
    if (courseId && courseId !== 'ALL') query.courseId = courseId;
    if (batchId && batchId !== 'ALL') query.batchId = batchId;

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { fname: searchRegex },
        { lname: searchRegex },
        { grno: searchRegex },
        { studentId: searchRegex },
        { mobileNo: searchRegex },
        { email: searchRegex },
        { rfid: searchRegex }
      ];
    }

    const students = await Student.find(query)
      .populate('courseId', 'courseName courseCode duration totalFees')
      .populate('batchId', 'batchName batchCode timing days roomNo instructor')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Student.countDocuments(query);

    res.json({
      success: true,
      data: students,
      meta: { page: Number(page), limit: Number(limit), total }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Student 360° Profile View
 */
router.get('/:id/360', authenticateAdmin, async (req, res) => {
  try {
    const student = await Student.findOne({ _id: req.params.id, instituteId: req.instituteId })
      .populate('courseId')
      .populate('batchId')
      .populate('instituteId');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }

    // 1. Attendance stats & history
    const attendanceDocs = await Attendance.find({
      instituteId: req.instituteId,
      'records.studentId': student._id
    }).sort({ date: -1 }).limit(30);

    let totalSessions = attendanceDocs.length;
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let leaveCount = 0;

    const history = attendanceDocs.map(doc => {
      const rec = doc.records.find(r => r.studentId.toString() === student._id.toString());
      const status = rec ? rec.status : 'Absent';
      if (status === 'Present') presentCount++;
      else if (status === 'Absent') absentCount++;
      else if (status === 'Late') lateCount++;
      else if (status === 'Leave') leaveCount++;
      return { date: doc.date, status, mode: rec?.mode || 'Manual', remarks: rec?.remarks || '' };
    });

    const attendancePct = totalSessions > 0 ? Math.round(((presentCount + lateCount) / totalSessions) * 100) : 100;

    // 2. Fee transactions ledger
    const transactions = await FeeTransaction.find({
      instituteId: req.instituteId,
      studentId: student._id
    }).sort({ paymentDate: -1 });

    // 3. Exam marks & report card
    const testMarks = await Marks.find({
      instituteId: req.instituteId,
      studentId: student._id
    }).populate('examId').sort({ createdAt: -1 });

    // 4. Homework submissions
    const homeworks = await Homework.find({
      instituteId: req.instituteId,
      batchId: student.batchId,
    }).sort({ dueDate: -1 }).limit(10);

    const submissions = homeworks.map(hw => {
      const sub = hw.submissions.find(s => s.studentId.toString() === student._id.toString());
      return {
        title: hw.title,
        subject: hw.subject,
        dueDate: hw.dueDate,
        isSubmitted: !!sub,
        grade: sub?.grade || 'Pending',
        feedback: sub?.feedback || '',
      };
    });

    // 5. Grievance tickets
    const complaints = await Complaint.find({
      instituteId: req.instituteId,
      studentId: student._id
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        student,
        attendance: {
          percentage: attendancePct,
          totalSessions,
          presentCount,
          absentCount,
          lateCount,
          leaveCount,
          recentLogs: history,
        },
        feeLedger: {
          totalFees: student.totalFees,
          paidFees: student.paidFees,
          balanceFees: student.balanceFees,
          discountAmount: student.discountAmount,
          transactions,
        },
        tests: testMarks,
        homework: submissions,
        complaints,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Register New Student
 */
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const body = { ...req.body, instituteId: req.instituteId };

    // Auto generate Student ID if not supplied
    if (!body.studentId) {
      const inst = await Institute.findById(req.instituteId);
      const prefix = inst ? inst.code : 'DEMO01';
      const year = new Date().getFullYear();
      const count = await Student.countDocuments({ instituteId: req.instituteId });
      const nextNum = (count + 1).toString().padStart(4, '0');
      body.studentId = `${prefix}-${year}-${nextNum}`;
      if (!body.grno) body.grno = `${prefix}-GR-${nextNum}`;
    }

    if (body.totalFees !== undefined && body.paidFees !== undefined) {
      body.balanceFees = Math.max(0, Number(body.totalFees) - (Number(body.paidFees) + (Number(body.discountAmount) || 0)));
    }

    // Default password Demo@123
    const tempPassword = body.plainPassword || 'Demo@123';
    body.password = await bcrypt.hash(tempPassword, 10);

    const student = new Student(body);
    const savedStudent = await student.save();

    // Auto-create initial fee transaction if paidFees > 0
    if (Number(body.paidFees) > 0) {
      const tx = new FeeTransaction({
        instituteId: req.instituteId,
        receiptNo: `REC-${savedStudent.studentId}-01`,
        studentId: savedStudent._id,
        studentName: `${savedStudent.fname} ${savedStudent.lname}`,
        grno: savedStudent.grno,
        courseId: savedStudent.courseId,
        batchId: savedStudent.batchId,
        amountPaid: Number(body.paidFees),
        paymentMode: body.paymentMode || 'UPI',
        remainingBalance: savedStudent.balanceFees,
        paymentDate: new Date().toISOString().split('T')[0],
        collectedBy: req.user.name,
      });
      await tx.save();
    }

    const populated = await Student.findById(savedStudent._id)
      .populate('courseId', 'courseName courseCode')
      .populate('batchId', 'batchName batchCode timing');

    res.status(201).json({
      success: true,
      message: 'Student enrolled successfully!',
      data: populated,
      loginCredentials: {
        studentId: savedStudent.studentId,
        temporaryPassword: tempPassword,
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * Update Student Record
 */
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.totalFees !== undefined && body.paidFees !== undefined) {
      body.balanceFees = Math.max(0, Number(body.totalFees) - (Number(body.paidFees) + (Number(body.discountAmount) || 0)));
    }

    const updated = await Student.findOneAndUpdate(
      { _id: req.params.id, instituteId: req.instituteId },
      body,
      { new: true, runValidators: true }
    ).populate('courseId').populate('batchId');

    if (!updated) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, message: 'Student profile updated', data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * Delete Student
 */
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    await Student.findOneAndDelete({ _id: req.params.id, instituteId: req.instituteId });
    res.json({ success: true, message: 'Student removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
