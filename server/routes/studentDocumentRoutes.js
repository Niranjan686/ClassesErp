const express = require('express');
const router = express.Router();
const StudentDocument = require('../models/StudentDocument');
const Student = require('../models/Students');
const { authenticateAdmin, authenticateStudent } = require('../middleware/auth');

/**
 * List Documents (Admin)
 */
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const query = { instituteId: req.instituteId };
    if (req.query.studentId) query.studentId = req.query.studentId;
    if (req.query.category && req.query.category !== 'ALL') query.documentCategory = req.query.category;
    if (req.query.status && req.query.status !== 'ALL') query.verificationStatus = req.query.status;

    const docs = await StudentDocument.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: docs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Register / Upload Document
 */
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { studentId, documentCategory, documentTitle, fileName, fileUrl, fileSize, expiryDate } = req.body;
    const student = await Student.findOne({ _id: studentId, instituteId: req.instituteId });

    if (!student) return res.status(404).json({ success: false, message: 'Student record not found' });

    const doc = new StudentDocument({
      instituteId: req.instituteId,
      entityType: 'Student',
      studentId: student._id,
      personName: `${student.fname} ${student.lname}`,
      identifier: student.grno,
      documentCategory,
      documentTitle,
      fileName,
      fileUrl,
      fileSize: fileSize || '1.2 MB',
      expiryDate,
      verificationStatus: 'Pending Review',
    });

    const saved = await doc.save();
    res.status(201).json({ success: true, message: 'Document registered successfully', data: saved });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * Verify or Reject Document
 */
router.patch('/:id/verify', authenticateAdmin, async (req, res) => {
  try {
    const { verificationStatus, verificationNotes } = req.body;
    const doc = await StudentDocument.findOne({ _id: req.params.id, instituteId: req.instituteId });
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    doc.verificationStatus = verificationStatus || 'Verified';
    doc.verificationNotes = verificationNotes || '';
    doc.verifiedBy = req.user ? req.user.name : 'Document Verifier';
    doc.verifiedAt = new Date();
    await doc.save();

    res.json({ success: true, message: `Document marked as ${doc.verificationStatus}`, data: doc });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * Outstanding / Missing Documents Report for Batch
 */
router.get('/missing-checklist/:batchId', authenticateAdmin, async (req, res) => {
  try {
    const students = await Student.find({ instituteId: req.instituteId, batchId: req.params.batchId, status: 'Active' });
    const studentIds = students.map(s => s._id);

    const uploadedDocs = await StudentDocument.find({
      instituteId: req.instituteId,
      studentId: { $in: studentIds },
    });

    const mandatoryCategories = [
      'Identity Proof (Aadhaar / Passport)',
      'Birth Certificate',
      'Previous Academic Marksheet'
    ];

    const checklist = students.map(s => {
      const docsForStudent = uploadedDocs.filter(d => d.studentId.toString() === s._id.toString());
      const presentCategories = new Set(docsForStudent.map(d => d.documentCategory));
      const missing = mandatoryCategories.filter(cat => !presentCategories.has(cat));

      return {
        studentId: s._id,
        name: `${s.fname} ${s.lname}`,
        grno: s.grno,
        mobileNo: s.mobileNo,
        submittedCount: docsForStudent.length,
        verifiedCount: docsForStudent.filter(d => d.verificationStatus === 'Verified').length,
        missingMandatoryDocuments: missing,
        isCompliant: missing.length === 0,
      };
    });

    res.json({
      success: true,
      totalStudents: checklist.length,
      compliantStudents: checklist.filter(c => c.isCompliant).length,
      nonCompliantStudents: checklist.filter(c => !c.isCompliant).length,
      data: checklist,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Student Self View
 */
router.get('/my-documents', authenticateStudent, async (req, res) => {
  try {
    const docs = await StudentDocument.find({
      instituteId: req.instituteId,
      studentId: req.student._id,
    }).sort({ createdAt: -1 });

    res.json({ success: true, data: docs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
