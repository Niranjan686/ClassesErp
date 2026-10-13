const express = require('express');
const router = express.Router();
const Certificate = require('../models/Certificate');
const Student = require('../models/Students');
const Institute = require('../models/Institute');
const { authenticateAdmin, authenticateStudent } = require('../middleware/auth');

/**
 * List Certificates (Admin)
 */
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const query = { instituteId: req.instituteId };
    if (req.query.certificateType && req.query.certificateType !== 'ALL') {
      query.certificateType = req.query.certificateType;
    }
    if (req.query.status && req.query.status !== 'ALL') {
      query.status = req.query.status;
    }
    if (req.query.studentId) {
      query.studentId = req.query.studentId;
    }

    const certs = await Certificate.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: certs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Issue New Certificate
 */
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { studentId, certificateType, purpose, signatoryName, signatoryDesignation, customContent } = req.body;

    if (!studentId || !certificateType || !purpose) {
      return res.status(400).json({ success: false, message: 'studentId, certificateType, and purpose are required.' });
    }

    const student = await Student.findOne({ _id: studentId, instituteId: req.instituteId })
      .populate('courseId')
      .populate('batchId');

    if (!student) return res.status(404).json({ success: false, message: 'Student record not found.' });

    const inst = await Institute.findById(req.instituteId);
    const prefix = inst ? inst.code : 'CERT';
    const year = new Date().getFullYear();
    const count = await Certificate.countDocuments({ instituteId: req.instituteId });
    const seq = (count + 1).toString().padStart(4, '0');
    const typeCode = certificateType.substring(0, 3).toUpperCase();
    const certificateNo = `${prefix}-${typeCode}-${year}-${seq}`;

    // Standardized Content Body
    const defaultBody = `This is to certify that ${student.fname} ${student.lname}, Son/Daughter of ${student.fatherName || 'Parent'}, bearing General Register No. ${student.grno} and Student ID ${student.studentId}, is/was a bonafide student of ${inst ? inst.name : 'ClassTech Academy'} enrolled in ${student.courseId ? student.courseId.courseName : 'the Academic Program'} during the academic session ${student.academicYear || `${year}-${year+1}`}. This certificate is officially granted for the purpose of ${purpose}.`;

    const certificate = new Certificate({
      instituteId: req.instituteId,
      certificateNo,
      certificateType,
      studentId: student._id,
      studentName: `${student.fname} ${student.lname}`,
      grno: student.grno,
      fatherName: student.fatherName,
      courseName: student.courseId ? student.courseId.courseName : '',
      batchName: student.batchId ? student.batchId.batchName : '',
      academicYear: student.academicYear || `${year}-${year+1}`,
      purpose,
      issueDate: new Date(),
      signatoryName: signatoryName || 'Head of Institution',
      signatoryDesignation: signatoryDesignation || 'Principal / Authorized Officer',
      issuedBy: req.user ? req.user.name : 'Registrar Office',
      contentBody: customContent || defaultBody,
      status: 'Issued',
    });

    const saved = await certificate.save();
    res.status(201).json({ success: true, message: 'Certificate generated successfully', data: saved });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get Certificate by ID (With Printable School Header)
 */
router.get('/:id', async (req, res) => {
  try {
    const cert = await Certificate.findById(req.params.id);
    if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found' });

    const institute = await Institute.findById(cert.instituteId);

    res.json({
      success: true,
      data: cert,
      schoolHeader: {
        schoolName: institute ? institute.name : 'ClassTech Institution',
        schoolCode: institute ? institute.code : '',
        address: institute ? institute.address : '',
        contact: institute ? institute.phone : '',
        logoUrl: institute ? institute.logoUrl : null,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Cancel / Revoke Certificate
 */
router.patch('/:id/cancel', authenticateAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const cert = await Certificate.findOne({ _id: req.params.id, instituteId: req.instituteId });
    if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found' });

    cert.status = 'Cancelled';
    cert.cancellationReason = reason || 'Revoked by authority';
    cert.cancelledBy = req.user ? req.user.name : 'Admin';
    cert.cancelledAt = new Date();
    await cert.save();

    res.json({ success: true, message: 'Certificate revoked successfully', data: cert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Student Self View Certificates
 */
router.get('/student/my-certificates', authenticateStudent, async (req, res) => {
  try {
    const certs = await Certificate.find({
      instituteId: req.instituteId,
      studentId: req.student._id,
      status: 'Issued',
    }).sort({ createdAt: -1 });

    res.json({ success: true, data: certs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
