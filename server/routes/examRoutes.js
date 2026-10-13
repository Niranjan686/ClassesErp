const express = require('express');
const router = express.Router();
const Exam = require('../models/Exam');
const Marks = require('../models/Marks');
const Student = require('../models/Students');
const Institute = require('../models/Institute');
const Attendance = require('../models/Attendance');
const { authenticateAdmin, authenticateStudent } = require('../middleware/auth');

/**
 * Configurable Grading Scale Calculator
 */
function calculateGradeAndResult(percentage, passingMarks = 40, scale = 'STANDARD') {
  if (scale === 'CBSE') {
    if (percentage >= 91) return { grade: 'A1', gpa: 10, resultStatus: 'Passed' };
    if (percentage >= 81) return { grade: 'A2', gpa: 9, resultStatus: 'Passed' };
    if (percentage >= 71) return { grade: 'B1', gpa: 8, resultStatus: 'Passed' };
    if (percentage >= 61) return { grade: 'B2', gpa: 7, resultStatus: 'Passed' };
    if (percentage >= 51) return { grade: 'C1', gpa: 6, resultStatus: 'Passed' };
    if (percentage >= 41) return { grade: 'C2', gpa: 5, resultStatus: 'Passed' };
    if (percentage >= 33) return { grade: 'D', gpa: 4, resultStatus: 'Passed' };
    return { grade: 'E1', gpa: 0, resultStatus: 'Failed' };
  }

  // STANDARD Scale
  if (percentage >= 85) return { grade: 'A+ (Distinction)', gpa: 4.0, resultStatus: 'Passed' };
  if (percentage >= 70) return { grade: 'A (First Class)', gpa: 3.5, resultStatus: 'Passed' };
  if (percentage >= 60) return { grade: 'B (Second Class)', gpa: 3.0, resultStatus: 'Passed' };
  if (percentage >= passingMarks) return { grade: 'C (Pass Class)', gpa: 2.0, resultStatus: 'Passed' };
  return { grade: 'Fail', gpa: 0, resultStatus: 'Failed' };
}

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

    // Filter out unpublished exam results for student
    const published = marks.filter(m => m.examId && m.examId.isPublished);

    res.json({ success: true, data: published });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Broadcast Exam Results Alert (Admin)
 */
router.post('/:id/broadcast-results', authenticateAdmin, async (req, res) => {
  try {
    const exam = await Exam.findOne({ _id: req.params.id, instituteId: req.instituteId });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    const marksCount = await Marks.countDocuments({ examId: exam._id, instituteId: req.instituteId });
    res.json({
      success: true,
      message: `Results notification broadcast queued for ${marksCount} student(s) of ${exam.batchName || 'batch'}.`,
      broadcastCount: marksCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Generate Branded Official Report Card
 */
router.get(['/report-card/:studentId', '/student/:studentId/report-card'], async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId)
      .populate('courseId')
      .populate('batchId')
      .populate('instituteId');

    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const institute = student.instituteId || await Institute.findById(student.instituteId);

    // Get marks records
    const markQuery = {
      studentId: student._id,
    };
    if (req.query.examId) {
      markQuery.examId = req.query.examId;
    }

    const marksRecords = await Marks.find(markQuery).populate('examId').sort({ createdAt: 1 });

    // Filter unpublished exams if requester is student
    const isStudentView = req.query.viewAs === 'student';
    const visibleRecords = isStudentView
      ? marksRecords.filter(m => m.examId && m.examId.isPublished)
      : marksRecords;

    let aggregateObtained = 0;
    let aggregateMax = 0;
    const subjectWiseResults = visibleRecords.map(m => {
      const maxMarks = m.examId ? m.examId.totalMaxMarks || 100 : 100;
      const obtained = m.totalMarksObtained || 0;
      aggregateObtained += obtained;
      aggregateMax += maxMarks;

      return {
        examTitle: m.examId ? m.examId.title : 'Assessment',
        subject: m.examId ? m.examId.subject : 'Core Subject',
        examDate: m.examId ? m.examId.examDate : '',
        theoryMarks: m.theoryMarksObtained,
        practicalMarks: m.practicalMarksObtained,
        totalObtained: obtained,
        maxMarks,
        grade: m.grade,
        resultStatus: m.resultStatus,
        remarks: m.remarks,
      };
    });

    const overallPercentage = aggregateMax > 0 ? Math.round((aggregateObtained / aggregateMax) * 100) : 0;
    const grading = calculateGradeAndResult(overallPercentage);

    // Calculate attendance summary
    const attendanceDocs = await Attendance.find({
      'records.studentId': student._id
    });
    let totalClasses = attendanceDocs.length;
    let attendedClasses = 0;
    attendanceDocs.forEach(doc => {
      const rec = doc.records.find(r => r.studentId.toString() === student._id.toString());
      if (rec && (rec.status === 'Present' || rec.status === 'Late')) attendedClasses++;
    });
    const attendancePercentage = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 100;

    const reportCard = {
      schoolBranding: {
        schoolName: institute ? institute.name : 'ClassTech International Academy',
        schoolCode: institute ? institute.code : 'SCH-001',
        tagline: institute ? institute.tagline : 'Excellence in Education',
        address: institute ? institute.address : 'Academic Campus',
        phone: institute ? institute.phone : '',
        email: institute ? institute.email : '',
        logoUrl: institute ? institute.logoUrl : null,
      },
      studentInfo: {
        studentId: student.studentId,
        grno: student.grno,
        rollno: student.rollno,
        name: `${student.fname} ${student.lname}`,
        gender: student.gender,
        courseName: student.courseId ? student.courseId.courseName : 'General Course',
        batchName: student.batchId ? student.batchId.batchName : 'General Batch',
        academicYear: student.academicYear || '2026-2027',
      },
      assessmentSummary: {
        totalSubjects: subjectWiseResults.length,
        aggregateObtained,
        aggregateMax,
        overallPercentage,
        grade: grading.grade,
        gpa: grading.gpa,
        resultStatus: grading.resultStatus,
        attendancePercentage,
        attendedClasses,
        totalClasses,
        principalRemarks: overallPercentage >= 75 ? 'Outstanding academic accomplishment!' : 'Satisfactory progress. Continued dedication advised.',
        issuedDate: new Date().toISOString().split('T')[0],
      },
      subjectResults: subjectWiseResults,
    };

    res.json({ success: true, data: reportCard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Bulk Import Spreadsheet Marks with Validation
 */
router.post('/:id/import-marks', authenticateAdmin, async (req, res) => {
  try {
    const exam = await Exam.findOne({ _id: req.params.id, instituteId: req.instituteId });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    const { rows = [], gradingScale = 'STANDARD' } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No marks data rows provided.' });
    }

    const students = await Student.find({ instituteId: req.instituteId, batchId: exam.batchId });
    const studentGrMap = {};
    const studentRollMap = {};
    students.forEach(s => {
      studentGrMap[s.grno.toUpperCase()] = s;
      if (s.rollno) studentRollMap[s.rollno.toString()] = s;
    });

    const errors = [];
    const processed = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;
      const grno = (row.grno || '').trim().toUpperCase();
      const rollno = (row.rollno || '').toString().trim();

      const student = studentGrMap[grno] || studentRollMap[rollno];
      if (!student) {
        errors.push({ row: rowNum, error: `Student with GRNo "${grno}" or RollNo "${rollno}" not found in this batch.` });
        continue;
      }

      const theory = Number(row.theoryMarks || row.theory || 0);
      const practical = Number(row.practicalMarks || row.practical || 0);

      // Validate against max marks
      if (theory > exam.maxTheoryMarks) {
        errors.push({ row: rowNum, error: `Theory marks (${theory}) exceeds maximum allowed (${exam.maxTheoryMarks}) for ${student.fname}` });
        continue;
      }
      if (practical > exam.maxPracticalMarks) {
        errors.push({ row: rowNum, error: `Practical marks (${practical}) exceeds maximum allowed (${exam.maxPracticalMarks}) for ${student.fname}` });
        continue;
      }

      const totalObtained = theory + practical;
      const percentage = exam.totalMaxMarks > 0 ? Math.round((totalObtained / exam.totalMaxMarks) * 100) : 0;
      const grading = calculateGradeAndResult(percentage, exam.passingMarks, gradingScale);

      const markDoc = await Marks.findOneAndUpdate(
        { instituteId: req.instituteId, examId: exam._id, studentId: student._id },
        {
          instituteId: req.instituteId,
          examId: exam._id,
          studentId: student._id,
          studentName: `${student.fname} ${student.lname}`,
          grno: student.grno,
          rollno: student.rollno,
          courseId: exam.courseId,
          batchId: exam.batchId,
          attendanceStatus: row.attendanceStatus || 'Present',
          theoryMarksObtained: theory,
          practicalMarksObtained: practical,
          totalMarksObtained: totalObtained,
          percentage,
          grade: grading.grade,
          resultStatus: grading.resultStatus,
          remarks: row.remarks || 'Spreadsheet Import',
        },
        { upsert: true, new: true }
      );

      processed.push(markDoc);
    }

    res.json({
      success: true,
      message: `Marks imported: ${processed.length} saved, ${errors.length} errors.`,
      processedCount: processed.length,
      errors,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
