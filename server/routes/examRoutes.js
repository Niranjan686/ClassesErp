const express = require('express');
const router = express.Router();
const Exam = require('../models/Exam');
const Marks = require('../models/Marks');
const Student = require('../models/Students');
const { authenticateAdmin, authenticateStudent } = require('../middleware/auth');

/**
 * Get all exams (Admin)
 */
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const query = { instituteId: req.instituteId };
    if (req.query.batchId) query.batchId = req.query.batchId;
    if (req.query.courseId) query.courseId = req.query.courseId;

    const exams = await Exam.find(query)
      .populate('batchId', 'batchName batchCode')
      .populate('courseId', 'courseName')
      .sort({ examDate: -1 });

    res.json({ success: true, data: exams });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Create Exam
 */
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const exam = new Exam({
      ...req.body,
      instituteId: req.instituteId,
      evaluatorName: req.user.name,
    });
    const saved = await exam.save();
    res.status(201).json({ success: true, message: 'Exam scheduled successfully', data: saved });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * Get Exam Marksheet & Roster (Admin)
 */
router.get('/:id/marksheet', authenticateAdmin, async (req, res) => {
  try {
    const exam = await Exam.findOne({ _id: req.params.id, instituteId: req.instituteId })
      .populate('batchId')
      .populate('courseId');

    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    const students = await Student.find({
      instituteId: req.instituteId,
      batchId: exam.batchId._id,
      status: 'Active',
    }).sort({ rollno: 1, fname: 1 });

    const existingMarks = await Marks.find({
      instituteId: req.instituteId,
      examId: exam._id,
    });

    const marksMap = {};
    existingMarks.forEach(m => {
      marksMap[m.studentId.toString()] = m;
    });

    const marksheet = students.map(s => {
      const mark = marksMap[s._id.toString()];
      return {
        studentId: s._id,
        studentName: `${s.fname} ${s.lname}`,
        grno: s.grno,
        rollno: s.rollno,
        attendanceStatus: mark ? mark.attendanceStatus : 'Present',
        theoryMarksObtained: mark ? mark.theoryMarksObtained : 0,
        practicalMarksObtained: mark ? mark.practicalMarksObtained : 0,
        totalMarksObtained: mark ? mark.totalMarksObtained : 0,
        percentage: mark ? mark.percentage : 0,
        grade: mark ? mark.grade : 'Pending',
        resultStatus: mark ? mark.resultStatus : 'Pending',
        rank: mark ? mark.rank : 0,
        remarks: mark ? mark.remarks : 'Good performance',
      };
    });

    res.json({
      success: true,
      exam,
      marksheet,
      roster: marksheet,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id/roster', authenticateAdmin, async (req, res) => {
  try {
    const exam = await Exam.findOne({ _id: req.params.id, instituteId: req.instituteId })
      .populate('batchId')
      .populate('courseId');

    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    const students = await Student.find({
      instituteId: req.instituteId,
      batchId: exam.batchId._id,
      status: 'Active',
    }).sort({ rollno: 1, fname: 1 });

    const existingMarks = await Marks.find({
      instituteId: req.instituteId,
      examId: exam._id,
    });

    const marksMap = {};
    existingMarks.forEach(m => {
      marksMap[m.studentId.toString()] = m;
    });

    const marksheet = students.map(s => {
      const mark = marksMap[s._id.toString()];
      return {
        studentId: s._id,
        studentName: `${s.fname} ${s.lname}`,
        grno: s.grno,
        rollno: s.rollno,
        attendanceStatus: mark ? mark.attendanceStatus : 'Present',
        theoryMarksObtained: mark ? mark.theoryMarksObtained : 0,
        practicalMarksObtained: mark ? mark.practicalMarksObtained : 0,
        totalMarksObtained: mark ? mark.totalMarksObtained : 0,
        percentage: mark ? mark.percentage : 0,
        grade: mark ? mark.grade : 'Pending',
        resultStatus: mark ? mark.resultStatus : 'Pending',
        rank: mark ? mark.rank : 0,
        remarks: mark ? mark.remarks : 'Good performance',
      };
    });

    res.json({
      success: true,
      exam,
      marksheet,
      roster: marksheet,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Save / Update Exam Marksheet Spreadsheet (Admin)
 */
router.post('/:id/save-marks', authenticateAdmin, async (req, res) => {
  try {
    const exam = await Exam.findOne({ _id: req.params.id, instituteId: req.instituteId });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    const { marksRecords } = req.body; // array of student mark objects

    // Calculate ranking by total marks
    const sorted = [...marksRecords].sort((a, b) => (b.totalMarksObtained || 0) - (a.totalMarksObtained || 0));
    sorted.forEach((record, idx) => {
      record.rank = idx + 1;
    });

    for (const item of sorted) {
      await Marks.findOneAndUpdate(
        {
          instituteId: req.instituteId,
          examId: exam._id,
          studentId: item.studentId,
        },
        {
          instituteId: req.instituteId,
          examId: exam._id,
          studentId: item.studentId,
          studentName: item.studentName,
          grno: item.grno,
          rollno: item.rollno,
          courseId: exam.courseId,
          batchId: exam.batchId,
          attendanceStatus: item.attendanceStatus || 'Present',
          theoryMarksObtained: item.theoryMarksObtained || 0,
          practicalMarksObtained: item.practicalMarksObtained || 0,
          totalMarksObtained: item.totalMarksObtained || 0,
          percentage: item.percentage || 0,
          grade: item.grade || 'A',
          resultStatus: item.resultStatus || 'Passed',
          rank: item.rank || 1,
          remarks: item.remarks || 'Evaluated',
        },
        { upsert: true, new: true }
      );
    }

    exam.isPublished = true;
    await exam.save();

    res.json({ success: true, message: 'Marksheet saved and results published successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Student Exams & Report Cards (Student Portal)
 */
router.get('/my-results', authenticateStudent, async (req, res) => {
  try {
    const student = req.student;
    const marks = await Marks.find({
      instituteId: req.instituteId,
      studentId: student._id,
    }).populate('examId').sort({ createdAt: -1 });

    res.json({ success: true, data: marks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
