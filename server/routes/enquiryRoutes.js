const express = require('express');
const router = express.Router();
const Enquiry = require('../models/Enquiry');
const AdmissionApplication = require('../models/AdmissionApplication');
const Student = require('../models/Students');
const Institute = require('../models/Institute');
const FeeTransaction = require('../models/FeeTransaction');
const Course = require('../models/Course');
const Batch = require('../models/Batch');
const bcrypt = require('bcryptjs');
const { authenticateAdmin } = require('../middleware/auth');

/**
 * Public Enquiry Form Submission (Embeddable Link per Institute)
 */
router.post('/public-submit', async (req, res) => {
  try {
    const { instituteCode, candidateName, mobileNo, email, courseId, courseName, qualification, preferredTiming, leadSource, notes } = req.body;

    const institute = await Institute.findOne({
      $or: [{ code: (instituteCode || '').toUpperCase() }, { subdomain: (instituteCode || '').toLowerCase() }]
    });

    if (!institute) {
      return res.status(404).json({ success: false, message: 'Invalid institute code for public enquiry' });
    }

    const enquiry = new Enquiry({
      instituteId: institute._id,
      candidateName,
      mobileNo,
      email,
      courseId,
      courseName: courseName || 'General Course',
      qualification,
      preferredTiming,
      leadSource: leadSource || 'Website',
      status: 'New',
      followUpNotes: notes || 'Online admission enquiry submitted via website form.',
    });

    await enquiry.save();

    res.status(201).json({
      success: true,
      message: 'Thank you for your enquiry! Our academic counselor will contact you shortly.',
      data: enquiry,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get all enquiries (Admin)
 */
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const query = { instituteId: req.instituteId };
    if (req.query.status && req.query.status !== 'ALL') {
      query.status = req.query.status;
    }

    const leads = await Enquiry.find(query)
      .populate('courseId', 'courseName courseCode totalFees')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: leads });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Create Lead manually (Admin)
 */
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const enquiry = new Enquiry({
      ...req.body,
      instituteId: req.instituteId,
      counselorName: req.user.name,
    });
    const saved = await enquiry.save();
    res.status(201).json({ success: true, message: 'Lead added to pipeline', data: saved });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * Update Kanban Stage
 */
router.patch('/:id/stage', authenticateAdmin, async (req, res) => {
  try {
    const { status, lostReason } = req.body;
    const updateData = { status };
    if (lostReason) updateData.lostReason = lostReason;

    const updated = await Enquiry.findOneAndUpdate(
      { _id: req.params.id, instituteId: req.instituteId },
      updateData,
      { new: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, message: `Lead moved to ${status}`, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * Add Follow-up Note to Lead
 */
router.post('/:id/follow-up', authenticateAdmin, async (req, res) => {
  try {
    const { note, followUpDate } = req.body;
    const enquiry = await Enquiry.findOne({ _id: req.params.id, instituteId: req.instituteId });
    if (!enquiry) return res.status(404).json({ success: false, message: 'Lead not found' });

    enquiry.followUps.push({
      date: new Date().toISOString().split('T')[0],
      note,
      counsellorName: req.user.name,
    });

    if (followUpDate) enquiry.followUpDate = followUpDate;
    enquiry.followUpNotes = note;
    await enquiry.save();

    res.json({ success: true, message: 'Follow-up logged successfully', data: enquiry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Quick Insights & Lead Counts
 */
router.get('/insights', authenticateAdmin, async (req, res) => {
  try {
    const total = await Enquiry.countDocuments({ instituteId: req.instituteId });
    const converted = await Enquiry.countDocuments({ instituteId: req.instituteId, status: { $in: ['Converted', 'Admission Taken'] } });
    const pending = await Enquiry.countDocuments({ instituteId: req.instituteId, status: { $in: ['New', 'Contacted', 'Pending', 'Follow-up Required'] } });
    const demo = await Enquiry.countDocuments({ instituteId: req.instituteId, status: 'Demo Scheduled' });
    const lost = await Enquiry.countDocuments({ instituteId: req.instituteId, status: { $in: ['Lost', 'Lost / Cancelled'] } });
    const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(1) : '0';

    res.json({
      total,
      converted,
      pending,
      demo,
      lost,
      conversionRate: `${conversionRate}%`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 1-Click Convert Lead to Enrolled Student (alias convert-to-admission)
 */
router.post(['/:id/convert-to-admission', '/:id/convert-to-student'], authenticateAdmin, async (req, res) => {
  try {
    const { batchId, totalFees, paidFees, paymentMode } = req.body;
    const lead = await Enquiry.findOne({ _id: req.params.id, instituteId: req.instituteId });

    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    if (lead.status === 'Converted' || lead.status === 'Admission Taken') {
      return res.status(400).json({ success: false, message: 'Lead is already converted to a student.' });
    }

    const inst = await Institute.findById(req.instituteId);
    const prefix = inst ? inst.code : 'DEMO01';
    const year = new Date().getFullYear();
    const count = await Student.countDocuments({ instituteId: req.instituteId });
    const nextNum = (count + 1).toString().padStart(4, '0');
    const studentId = `${prefix}-${year}-${nextNum}`;
    const grno = `${prefix}-GR-${nextNum}`;

    const names = (lead.candidateName || 'New Student').trim().split(' ');
    const fname = names[0];
    const lname = names.slice(1).join(' ') || 'Student';

    const effectivePaid = Number(paidFees) || 0;
    const effectiveTotal = Number(totalFees) || 15000;
    const balance = Math.max(0, effectiveTotal - effectivePaid);

    const student = new Student({
      instituteId: req.instituteId,
      studentId,
      grno,
      fname,
      lname,
      mobileNo: lead.mobileNo,
      email: lead.email,
      courseId: lead.courseId,
      batchId: batchId || lead.batchId,
      totalFees: effectiveTotal,
      paidFees: effectivePaid,
      balanceFees: balance,
      referralSource: lead.leadSource,
      leadId: lead._id,
      status: 'Active',
    });

    await student.save();

    lead.status = 'Admission Taken';
    lead.convertedStudentId = student._id;
    lead.admissionDate = new Date();
    await lead.save();

    if (effectivePaid > 0) {
      const tx = new FeeTransaction({
        instituteId: req.instituteId,
        receiptNo: `REC-${student.studentId}-01`,
        studentId: student._id,
        studentName: `${student.fname} ${student.lname}`,
        grno: student.grno,
        courseId: student.courseId,
        batchId: student.batchId,
        amount: effectivePaid,
        amountPaid: effectivePaid,
        paymentMode: paymentMode || 'Cash',
        remainingBalance: balance,
        paymentDate: new Date().toISOString().split('T')[0],
        collectedBy: req.user ? req.user.name : 'Admissions Office',
        remarks: 'Admission Fee Collection',
        status: 'Paid',
      });
      await tx.save();
    }

    res.json({
      success: true,
      message: `Lead converted to student successfully! Student ID: ${studentId}`,
      data: student,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Update Enquiry (Admin)
 */
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const updated = await Enquiry.findOneAndUpdate(
      { _id: req.params.id, instituteId: req.instituteId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'Enquiry not found' });
    res.json({ success: true, message: 'Enquiry updated successfully', data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * Delete Enquiry (Admin)
 */
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const deleted = await Enquiry.findOneAndDelete({ _id: req.params.id, instituteId: req.instituteId });
    if (!deleted) return res.status(404).json({ success: false, message: 'Enquiry not found' });
    res.json({ success: true, message: 'Enquiry deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Admission Dashboard & Conversion Metrics
 */
router.get('/admission-dashboard', authenticateAdmin, async (req, res) => {
  try {
    const instId = req.instituteId;
    const totalEnquiries = await Enquiry.countDocuments({ instituteId: instId });
    const convertedEnquiries = await Enquiry.countDocuments({ instituteId: instId, status: 'Converted' });
    const totalApplications = await AdmissionApplication.countDocuments({ instituteId: instId });
    const approvedApplications = await AdmissionApplication.countDocuments({ instituteId: instId, status: 'Approved' });
    const enrolledApplications = await AdmissionApplication.countDocuments({ instituteId: instId, status: 'Converted to Student' });
    const rejectedApplications = await AdmissionApplication.countDocuments({ instituteId: instId, status: 'Rejected' });

    // Stage breakdown
    const stageCounts = await Enquiry.aggregate([
      { $match: { instituteId: instId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const conversionRate = totalEnquiries > 0 ? Math.round((convertedEnquiries / totalEnquiries) * 100) : 0;
    const applicationApprovalRate = totalApplications > 0 ? Math.round(((approvedApplications + enrolledApplications) / totalApplications) * 100) : 0;

    res.json({
      success: true,
      data: {
        totalEnquiries,
        convertedEnquiries,
        conversionRate: `${conversionRate}%`,
        totalApplications,
        approvedApplications,
        enrolledApplications,
        rejectedApplications,
        applicationApprovalRate: `${applicationApprovalRate}%`,
        stages: stageCounts,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Submit / Create Admission Application (with duplicate check)
 */
router.post('/applications', authenticateAdmin, async (req, res) => {
  try {
    const {
      candidateName,
      gender,
      dob,
      mobileNo,
      email,
      fatherName,
      fatherMobileNo,
      motherName,
      address,
      courseId,
      appliedClass,
      academicYear,
      enquiryId,
      documents = [],
      applicationFeeAmount = 500,
    } = req.body;

    if (!candidateName || !mobileNo) {
      return res.status(400).json({ success: false, message: 'Candidate name and mobile number are required.' });
    }

    // Duplicate detection: check if student or active application already exists
    const existingStudent = await Student.findOne({ instituteId: req.instituteId, mobileNo });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: `Student with mobile number ${mobileNo} is already enrolled (${existingStudent.fname} ${existingStudent.lname}, ID: ${existingStudent.studentId}). Duplicate application prevented.`
      });
    }

    const existingApp = await AdmissionApplication.findOne({
      instituteId: req.instituteId,
      mobileNo,
      status: { $in: ['Submitted', 'Under Review', 'Approved'] }
    });
    if (existingApp) {
      return res.status(400).json({
        success: false,
        message: `An active application (${existingApp.applicationNo}) already exists for mobile ${mobileNo}.`
      });
    }

    const inst = await Institute.findById(req.instituteId);
    const prefix = inst ? inst.code : 'APP';
    const year = new Date().getFullYear();
    const appCount = await AdmissionApplication.countDocuments({ instituteId: req.instituteId });
    const applicationNo = `${prefix}-APP-${year}-${(appCount + 1).toString().padStart(4, '0')}`;

    let courseName = '';
    if (courseId) {
      const c = await Course.findById(courseId);
      if (c) courseName = c.courseName;
    }

    const application = new AdmissionApplication({
      instituteId: req.instituteId,
      applicationNo,
      enquiryId,
      candidateName,
      gender,
      dob,
      mobileNo,
      email,
      fatherName,
      fatherMobileNo,
      motherName,
      address,
      courseId,
      courseName,
      appliedClass,
      academicYear: academicYear || `${year}-${year + 1}`,
      documents,
      applicationFeeAmount,
      status: 'Submitted',
    });

    const saved = await application.save();

    // Link enquiry if applicable
    if (enquiryId) {
      await Enquiry.findByIdAndUpdate(enquiryId, {
        status: 'Application Submitted',
        followUpNotes: `Admission application ${applicationNo} submitted.`,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Admission application submitted successfully',
      data: saved,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * List Admission Applications
 */
router.get('/applications', authenticateAdmin, async (req, res) => {
  try {
    const query = { instituteId: req.instituteId };
    if (req.query.status && req.query.status !== 'ALL') {
      query.status = req.query.status;
    }
    if (req.query.courseId) {
      query.courseId = req.query.courseId;
    }

    const apps = await AdmissionApplication.find(query)
      .populate('courseId', 'courseName courseCode totalFees')
      .populate('convertedStudentId', 'studentId grno fname lname')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: apps });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get Single Admission Application
 */
router.get('/applications/:id', authenticateAdmin, async (req, res) => {
  try {
    const app = await AdmissionApplication.findOne({ _id: req.params.id, instituteId: req.instituteId })
      .populate('courseId')
      .populate('enquiryId')
      .populate('convertedStudentId');

    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
    res.json({ success: true, data: app });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Update Application Review Status (e.g. Schedule Interview, Approve, Reject)
 */
router.patch('/applications/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { status, entranceTestDate, entranceTestScore, interviewNotes, rejectionReason } = req.body;
    const app = await AdmissionApplication.findOne({ _id: req.params.id, instituteId: req.instituteId });
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });

    if (status) app.status = status;
    if (entranceTestDate) app.entranceTestDate = entranceTestDate;
    if (entranceTestScore !== undefined) app.entranceTestScore = entranceTestScore;
    if (interviewNotes) app.interviewNotes = interviewNotes;
    if (rejectionReason) app.rejectionReason = rejectionReason;

    app.reviewedBy = req.user ? req.user.name : 'Admissions Officer';
    app.reviewedAt = new Date();

    await app.save();
    res.json({ success: true, message: `Application status updated to ${app.status}`, data: app });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * Verify / Reject Application Document
 */
router.post('/applications/:id/verify-document', authenticateAdmin, async (req, res) => {
  try {
    const { docIndex, verificationStatus, verificationNotes } = req.body;
    const app = await AdmissionApplication.findOne({ _id: req.params.id, instituteId: req.instituteId });
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });

    if (app.documents[docIndex]) {
      app.documents[docIndex].verificationStatus = verificationStatus || 'Verified';
      if (verificationNotes) app.documents[docIndex].verificationNotes = verificationNotes;
      await app.save();
      return res.json({ success: true, message: 'Document verification updated', data: app });
    }

    res.status(400).json({ success: false, message: 'Invalid document index' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Convert Approved Application into Enrolled Student (without duplicate creation)
 */
router.post('/applications/:id/convert-to-student', authenticateAdmin, async (req, res) => {
  try {
    const { batchId, totalFees, paidFees, paymentMode = 'Cash' } = req.body;
    const app = await AdmissionApplication.findOne({ _id: req.params.id, instituteId: req.instituteId });

    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
    if (app.status === 'Converted to Student') {
      return res.status(400).json({ success: false, message: 'Application is already converted to a student.' });
    }

    // Check duplicate student by mobile number
    const existingStudent = await Student.findOne({ instituteId: req.instituteId, mobileNo: app.mobileNo });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: `Student with mobile ${app.mobileNo} already exists in records (${existingStudent.studentId}). Duplicate prevented.`
      });
    }

    const inst = await Institute.findById(req.instituteId);
    const prefix = inst ? inst.code : 'DEMO01';
    const year = new Date().getFullYear();
    const count = await Student.countDocuments({ instituteId: req.instituteId });
    const nextNum = (count + 1).toString().padStart(4, '0');
    const studentId = `${prefix}-${year}-${nextNum}`;
    const grno = `${prefix}-GR-${nextNum}`;

    const names = (app.candidateName || 'New Student').split(' ');
    const fname = names[0];
    const lname = names.slice(1).join(' ') || 'Student';

    const course = app.courseId ? await Course.findById(app.courseId) : null;
    const effectiveTotalFees = Number(totalFees) || (course ? course.totalFees : 15000);
    const effectivePaidFees = Number(paidFees) || 0;
    const balanceFees = Math.max(0, effectiveTotalFees - effectivePaidFees);

    const defaultPasswordHash = await bcrypt.hash('Demo@123', 10);

    const newStudent = new Student({
      instituteId: req.instituteId,
      studentId,
      grno,
      rollno: count + 1,
      fname,
      lname,
      gender: app.gender || 'Male',
      dob: app.dob,
      mobileNo: app.mobileNo,
      email: app.email || `${studentId.toLowerCase()}@school.local`,
      fatherName: app.fatherName,
      fatherMobileNo: app.fatherMobileNo,
      motherName: app.motherName,
      address: app.address,
      courseId: app.courseId,
      batchId,
      academicYear: app.academicYear || `${year}-${year + 1}`,
      totalFees: effectiveTotalFees,
      paidFees: effectivePaidFees,
      balanceFees,
      password: defaultPasswordHash,
      status: 'Active',
      admissionDate: new Date(),
    });

    const savedStudent = await newStudent.save();

    // Mark application as converted
    app.status = 'Converted to Student';
    app.convertedStudentId = savedStudent._id;
    app.admissionDate = new Date();
    await app.save();

    // If enquiry exists, mark enquiry as converted
    if (app.enquiryId) {
      await Enquiry.findByIdAndUpdate(app.enquiryId, {
        status: 'Converted',
        convertedStudentId: savedStudent._id,
        admissionDate: new Date(),
      });
    }

    // Auto-create fee receipt if initial payment made
    if (effectivePaidFees > 0) {
      const tx = new FeeTransaction({
        instituteId: req.instituteId,
        receiptNo: `REC-${savedStudent.studentId}-01`,
        studentId: savedStudent._id,
        studentName: `${savedStudent.fname} ${savedStudent.lname}`,
        grno: savedStudent.grno,
        courseId: savedStudent.courseId,
        batchId: savedStudent.batchId,
        amountPaid: effectivePaidFees,
        paymentMode,
        remainingBalance: balanceFees,
        paymentDate: new Date().toISOString().split('T')[0],
        collectedBy: req.user ? req.user.name : 'Admissions Office',
        remarks: 'Admission Fee Payment',
      });
      await tx.save();
    }

    res.status(201).json({
      success: true,
      message: `Applicant enrolled successfully as Student! ID: ${studentId}`,
      data: savedStudent,
      credentials: {
        studentId,
        temporaryPassword: 'Demo@123',
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
