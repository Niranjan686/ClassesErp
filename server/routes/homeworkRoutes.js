const express = require('express');
const router = express.Router();
const Homework = require('../models/Homework');
const { authenticateAdmin, authenticateStudent } = require('../middleware/auth');

/**
 * Get Assignments (Admin)
 */
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const query = { instituteId: req.instituteId };
    if (req.query.batchId) query.batchId = req.query.batchId;

    const items = await Homework.find(query)
      .populate('batchId', 'batchName batchCode')
      .populate('courseId', 'courseName')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch homework', error: err.message });
  }
});

/**
 * Create Assignment
 */
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { batchId, courseId, title, subject, description, dueDate, attachmentUrl } = req.body;

    const hw = new Homework({
      instituteId: req.instituteId,
      batchId,
      courseId,
      title,
      subject,
      description,
      dueDate,
      attachmentUrl: attachmentUrl || '',
      teacherName: req.user.name,
    });

    await hw.save();
    res.status(201).json({ success: true, message: 'Homework assignment published', data: hw });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create homework', error: err.message });
  }
});

/**
 * Grade Submission
 */
router.patch('/:id/submissions/:subId/grade', authenticateAdmin, async (req, res) => {
  try {
    const { grade, feedback } = req.body;
    const hw = await Homework.findOne({ _id: req.params.id, instituteId: req.instituteId });
    if (!hw) return res.status(404).json({ success: false, message: 'Assignment not found' });

    const sub = hw.submissions.id(req.params.subId);
    if (!sub) return res.status(404).json({ success: false, message: 'Submission not found' });

    sub.grade = grade;
    sub.feedback = feedback;
    sub.status = 'Graded';
    await hw.save();

    res.json({ success: true, message: 'Submission graded successfully', data: sub });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Grading failed', error: err.message });
  }
});

/**
 * Student Homework View
 */
router.get('/student-view', authenticateStudent, async (req, res) => {
  try {
    const student = req.student;
    const items = await Homework.find({
      instituteId: req.instituteId,
      batchId: student.batchId,
    }).sort({ dueDate: -1 });

    // Mark submission status for current student
    const studentItems = items.map(hw => {
      const mySub = hw.submissions.find(s => s.studentId.toString() === student._id.toString());
      return {
        ...hw.toObject(),
        mySubmission: mySub || null,
        isSubmitted: !!mySub,
      };
    });

    res.json({ success: true, data: studentItems });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch student homework', error: err.message });
  }
});

/**
 * Student Submit Homework
 */
router.post('/:id/submit', authenticateStudent, async (req, res) => {
  try {
    const student = req.student;
    const { submissionText, fileUrl } = req.body;
    const hw = await Homework.findOne({ _id: req.params.id, instituteId: req.instituteId });

    if (!hw) return res.status(404).json({ success: false, message: 'Homework not found' });

    const existingIndex = hw.submissions.findIndex(s => s.studentId.toString() === student._id.toString());
    if (existingIndex !== -1) {
      hw.submissions[existingIndex].submissionText = submissionText;
      hw.submissions[existingIndex].fileUrl = fileUrl || hw.submissions[existingIndex].fileUrl;
      hw.submissions[existingIndex].submittedAt = new Date();
    } else {
      hw.submissions.push({
        studentId: student._id,
        studentName: `${student.fname} ${student.lname}`,
        submissionText,
        fileUrl: fileUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        submittedAt: new Date(),
        status: 'Submitted',
      });
    }

    await hw.save();
    res.json({ success: true, message: 'Homework submitted successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Submission failed', error: err.message });
  }
});

/**
 * Delete Homework
 */
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    await Homework.findOneAndDelete({ _id: req.params.id, instituteId: req.instituteId });
    res.json({ success: true, message: 'Homework deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete' });
  }
});

module.exports = router;
