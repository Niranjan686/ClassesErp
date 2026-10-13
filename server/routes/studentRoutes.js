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
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// CSV Helper functions with formula injection protection
const sanitizeFormula = (val) => {
  if (typeof val !== 'string') return val;
  return val.replace(/^[=+\-@\t\r]+/, '').trim();
};

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] !== undefined ? values[idx].trim() : '';
    });
    rows.push(obj);
  }
  return rows;
}

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
 * Download CSV Template for Student Bulk Import
 */
router.get('/import-template', authenticateAdmin, async (req, res) => {
  try {
    const csvContent = [
      'First Name,Last Name,Mobile,Email,Gender,Course Code,Batch Code,Total Fees,Paid Fees,Father Name,Address,RFID',
      'Aarav,Patel,9820011223,aarav.p@gmail.com,Male,MSCIT,MSCIT-M1,5000,2000,Rajesh Patel,Malad West Mumbai,RFID-1001',
      'Diya,Sharma,9820022334,diya.s@gmail.com,Female,TALLY,TALLY-A1,8000,4000,Sunil Sharma,Kandivali East Mumbai,RFID-1002'
    ].join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="students_bulk_import_template.csv"');
    return res.status(200).send(csvContent);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Bulk Import Students via CSV file upload or JSON payload
 */
router.post('/bulk-import', authenticateAdmin, upload.single('file'), async (req, res) => {
  try {
    let rowsData = [];

    if (req.file && req.file.buffer) {
      const csvString = req.file.buffer.toString('utf-8');
      rowsData = parseCSV(csvString);
    } else if (Array.isArray(req.body.students)) {
      rowsData = req.body.students;
    } else if (req.body.csvData) {
      rowsData = parseCSV(req.body.csvData);
    } else {
      return res.status(400).json({ success: false, message: 'No file or student data provided. Upload a CSV file or provide csvData.' });
    }

    if (!rowsData || rowsData.length === 0) {
      return res.status(400).json({ success: false, message: 'CSV file or payload contains no valid data rows.' });
    }

    const inst = await Institute.findById(req.instituteId);
    const prefix = inst ? inst.code : 'DEMO01';
    const year = new Date().getFullYear();

    const courses = await Course.find({ instituteId: req.instituteId });
    const batches = await Batch.find({ instituteId: req.instituteId });

    const courseMap = {};
    courses.forEach(c => {
      courseMap[c.courseCode.toUpperCase()] = c;
    });

    const batchMap = {};
    batches.forEach(b => {
      batchMap[b.batchCode.toUpperCase()] = b;
    });

    let currentCount = await Student.countDocuments({ instituteId: req.instituteId });

    const errors = [];
    const createdStudents = [];
    const defaultPasswordHash = await bcrypt.hash('Demo@123', 10);

    for (let i = 0; i < rowsData.length; i++) {
      const row = rowsData[i];
      const rowNum = i + 1;

      // Extract and sanitize fields against formula injection
      const fname = sanitizeFormula(row.firstname || row.fname || row['first name'] || '');
      const lname = sanitizeFormula(row.lastname || row.lname || row['last name'] || '');
      const mobileNo = sanitizeFormula(row.mobile || row.mobileno || row['mobile no'] || row.phone || '');
      const email = sanitizeFormula(row.email || '');
      const rawGender = sanitizeFormula(row.gender || 'Male');
      const gender = ['Male', 'Female', 'Other'].includes(rawGender) ? rawGender : 'Male';
      const courseCode = sanitizeFormula(row.coursecode || row.course || '').toUpperCase();
      const batchCode = sanitizeFormula(row.batchcode || row.batch || '').toUpperCase();
      const totalFees = Number(sanitizeFormula(row.totalfees || row.totalfee || row.fee || row.fees || '0')) || 0;
      const paidFees = Number(sanitizeFormula(row.paidfees || row.paidfee || row.paid || '0')) || 0;
      const fatherName = sanitizeFormula(row.fathername || row.father || row['father name'] || '');
      const address = sanitizeFormula(row.address || '');
      const rfid = sanitizeFormula(row.rfid || '');

      if (!fname) {
        errors.push({ row: rowNum, error: 'First name is required' });
        continue;
      }
      if (!mobileNo) {
        errors.push({ row: rowNum, error: `Missing mobile number for ${fname}` });
        continue;
      }

      // Check existing mobile duplicate within institute
      const existingStudent = await Student.findOne({ instituteId: req.instituteId, mobileNo });
      if (existingStudent) {
        errors.push({ row: rowNum, error: `Mobile ${mobileNo} already registered (${existingStudent.fname} ${existingStudent.lname})` });
        continue;
      }

      currentCount++;
      const nextNum = currentCount.toString().padStart(4, '0');
      const studentId = `${prefix}-${year}-${nextNum}`;
      const grno = `${prefix}-GR-${nextNum}`;

      // Resolve course & batch
      const course = courseMap[courseCode] || courses[0];
      const batch = batchMap[batchCode] || (course ? batches.find(b => b.courseId.toString() === course._id.toString()) : batches[0]);

      const effectiveTotalFees = totalFees > 0 ? totalFees : (course ? course.totalFees : 0);
      const balanceFees = Math.max(0, effectiveTotalFees - paidFees);

      const newStudent = new Student({
        instituteId: req.instituteId,
        studentId,
        grno,
        rollno: currentCount,
        fname,
        lname: lname || 'Student',
        mobileNo,
        email: email || `${studentId.toLowerCase()}@school.local`,
        gender,
        fatherName,
        address,
        rfid,
        courseId: course ? course._id : undefined,
        batchId: batch ? batch._id : undefined,
        totalFees: effectiveTotalFees,
        paidFees,
        balanceFees,
        password: defaultPasswordHash,
        status: 'Active',
      });

      const saved = await newStudent.save();
      createdStudents.push({
        _id: saved._id,
        studentId: saved.studentId,
        name: `${saved.fname} ${saved.lname}`,
        grno: saved.grno,
        mobileNo: saved.mobileNo,
      });

      // Record initial fee transaction if paidFees > 0
      if (paidFees > 0) {
        const tx = new FeeTransaction({
          instituteId: req.instituteId,
          receiptNo: `REC-${saved.studentId}-01`,
          studentId: saved._id,
          studentName: `${saved.fname} ${saved.lname}`,
          grno: saved.grno,
          courseId: saved.courseId,
          batchId: saved.batchId,
          amountPaid: paidFees,
          paymentMode: 'Cash',
          remainingBalance: balanceFees,
          paymentDate: new Date().toISOString().split('T')[0],
          collectedBy: req.user ? req.user.name : 'Bulk Importer',
        });
        await tx.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: `Bulk import completed: ${createdStudents.length} imported, ${errors.length} failed.`,
      total: rowsData.length,
      importedCount: createdStudents.length,
      failedCount: errors.length,
      imported: createdStudents,
      errors,
    });
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
 * Preview Student Promotion to Next Academic Year
 */
router.post('/promote-preview', authenticateAdmin, async (req, res) => {
  try {
    const { sourceBatchId, targetCourseId, targetBatchId, newAcademicYear, passingCriteria = 40 } = req.body;
    if (!sourceBatchId || !newAcademicYear) {
      return res.status(400).json({ success: false, message: 'sourceBatchId and newAcademicYear are required.' });
    }

    const students = await Student.find({ instituteId: req.instituteId, batchId: sourceBatchId, status: 'Active' })
      .populate('courseId')
      .populate('batchId');

    const previewList = await Promise.all(students.map(async (stu) => {
      // Check average marks
      const marks = await Marks.find({ instituteId: req.instituteId, studentId: stu._id });
      let avgPercentage = 0;
      if (marks.length > 0) {
        const sum = marks.reduce((acc, m) => acc + (m.percentage || 0), 0);
        avgPercentage = Math.round(sum / marks.length);
      } else {
        avgPercentage = 75; // Default if no exam records yet
      }

      const isPromoted = avgPercentage >= Number(passingCriteria);

      return {
        studentId: stu._id,
        code: stu.studentId,
        grno: stu.grno,
        name: `${stu.fname} ${stu.lname}`,
        currentCourse: stu.courseId ? stu.courseId.courseName : '',
        currentBatch: stu.batchId ? stu.batchId.batchName : '',
        currentAcademicYear: stu.academicYear || '2026-2027',
        targetAcademicYear: newAcademicYear,
        targetCourseId: targetCourseId || stu.courseId,
        targetBatchId: targetBatchId || stu.batchId,
        averagePercentage: avgPercentage,
        recommendedStatus: isPromoted ? 'Promoted' : 'Retained',
        status: isPromoted ? 'Promoted' : 'Retained',
        remarks: isPromoted ? 'Eligible for promotion' : 'Requires improvement or retention',
      };
    }));

    res.json({
      success: true,
      data: previewList,
      totalStudents: previewList.length,
      promotedCount: previewList.filter(p => p.recommendedStatus === 'Promoted').length,
      retainedCount: previewList.filter(p => p.recommendedStatus === 'Retained').length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Execute Bulk Student Promotion (Without duplicate creation, preserving history)
 */
router.post('/promote-batch', authenticateAdmin, async (req, res) => {
  try {
    const { promotions = [] } = req.body;
    if (!Array.isArray(promotions) || promotions.length === 0) {
      return res.status(400).json({ success: false, message: 'Promotions array is required.' });
    }

    const updatedStudents = [];
    const errors = [];

    for (const p of promotions) {
      const student = await Student.findOne({ _id: p.studentId, instituteId: req.instituteId })
        .populate('courseId')
        .populate('batchId');

      if (!student) {
        errors.push({ studentId: p.studentId, error: 'Student not found in this institute' });
        continue;
      }

      // Check duplicate promotion prevention: already promoted to this academic year
      if (student.academicYear === p.newAcademicYear) {
        errors.push({ studentId: p.studentId, error: `Student already enrolled in academic year ${p.newAcademicYear}` });
        continue;
      }

      // 1. Archive previous academic status in academicHistory
      student.academicHistory.push({
        academicYear: student.academicYear || '2026-2027',
        courseId: student.courseId ? student.courseId._id : null,
        batchId: student.batchId ? student.batchId._id : null,
        courseName: student.courseId ? student.courseId.courseName : '',
        batchName: student.batchId ? student.batchId.batchName : '',
        progressionStatus: p.progressionStatus || 'Promoted',
        promotedDate: new Date(),
        remarks: p.remarks || 'Annual progression update',
      });

      // 2. Update to new academic year & batch
      student.academicYear = p.newAcademicYear;
      if (p.targetCourseId) student.courseId = p.targetCourseId;
      if (p.targetBatchId) student.batchId = p.targetBatchId;

      if (p.progressionStatus === 'Graduated') {
        student.status = 'Completed';
      } else if (p.progressionStatus === 'Withdrawn') {
        student.status = 'Dropped';
      } else {
        student.status = 'Active';
      }

      await student.save();
      updatedStudents.push({
        _id: student._id,
        studentId: student.studentId,
        name: `${student.fname} ${student.lname}`,
        newAcademicYear: student.academicYear,
        status: student.status,
        progressionStatus: p.progressionStatus,
      });
    }

    res.json({
      success: true,
      message: `Bulk progression completed: ${updatedStudents.length} updated, ${errors.length} skipped.`,
      updatedCount: updatedStudents.length,
      errorCount: errors.length,
      data: updatedStudents,
      errors,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
