const express = require('express');
const router = express.Router();
const { Visitor, GatePass } = require('../models/GatePassVisitor');
const Student = require('../models/Students');
const Staff = require('../models/Staff');
const Institute = require('../models/Institute');
const { authenticateAdmin } = require('../middleware/auth');

/**
 * ---------------- ID CARD PAYLOADS ----------------
 */
router.get('/id-card/student/:studentId', async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId)
      .populate('courseId')
      .populate('batchId')
      .populate('instituteId');

    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    const inst = student.instituteId;

    const idCardData = {
      cardType: 'STUDENT',
      schoolBranding: {
        schoolName: inst ? inst.name : 'ClassTech Academy',
        schoolCode: inst ? inst.code : 'SCH-01',
        tagline: inst ? inst.tagline : 'Empowering Knowledge',
        address: inst ? inst.address : '',
        phone: inst ? inst.phone : '',
        logoUrl: inst ? inst.logoUrl : null,
      },
      holder: {
        id: student._id,
        studentId: student.studentId,
        grno: student.grno,
        rollno: student.rollno,
        name: `${student.fname} ${student.lname}`,
        photo: student.photo,
        courseName: student.courseId ? student.courseId.courseName : 'General',
        batchName: student.batchId ? student.batchId.batchName : 'General',
        academicYear: student.academicYear || '2026-2027',
        dob: student.dob ? new Date(student.dob).toISOString().split('T')[0] : '',
        bloodGroup: student.bloodGroup || 'O+',
        emergencyContact: student.fatherMobileNo || student.mobileNo,
        barcodeString: `STU:${student.grno}`,
        qrData: JSON.stringify({
          inst: inst ? inst.code : '',
          id: student.studentId,
          name: `${student.fname} ${student.lname}`,
          grno: student.grno,
        }),
      }
    };

    res.json({ success: true, data: idCardData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/id-card/staff/:staffId', async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.staffId).populate('instituteId');
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });
    const inst = staff.instituteId || await Institute.findById(staff.instituteId);

    const idCardData = {
      cardType: 'STAFF',
      schoolBranding: {
        schoolName: inst ? inst.name : 'ClassTech Academy',
        schoolCode: inst ? inst.code : 'SCH-01',
        address: inst ? inst.address : '',
        logoUrl: inst ? inst.logoUrl : null,
      },
      holder: {
        id: staff._id,
        staffId: staff.staffId,
        name: staff.name,
        designation: staff.designation,
        department: staff.department,
        phone: staff.phone,
        email: staff.email,
        joiningDate: staff.joiningDate ? new Date(staff.joiningDate).toISOString().split('T')[0] : '',
        barcodeString: `STF:${staff.staffId}`,
        qrData: JSON.stringify({
          inst: inst ? inst.code : '',
          staffId: staff.staffId,
          name: staff.name,
          designation: staff.designation,
        }),
      }
    };

    res.json({ success: true, data: idCardData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * ---------------- VISITOR MANAGEMENT ----------------
 */
router.get('/visitors', authenticateAdmin, async (req, res) => {
  try {
    const query = { instituteId: req.instituteId };
    if (req.query.status && req.query.status !== 'ALL') query.status = req.query.status;

    const list = await Visitor.find(query).sort({ inTime: -1 });
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/visitors/check-in', authenticateAdmin, async (req, res) => {
  try {
    const visitor = new Visitor({
      ...req.body,
      instituteId: req.instituteId,
      inTime: new Date(),
      status: 'Checked In',
      securityOfficerName: req.user ? req.user.name : 'Gate Security',
    });

    const saved = await visitor.save();
    res.status(201).json({ success: true, message: 'Visitor checked in successfully', data: saved });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.patch('/visitors/:id/check-out', authenticateAdmin, async (req, res) => {
  try {
    const visitor = await Visitor.findOneAndUpdate(
      { _id: req.params.id, instituteId: req.instituteId },
      { status: 'Checked Out', outTime: new Date() },
      { new: true }
    );
    if (!visitor) return res.status(404).json({ success: false, message: 'Visitor record not found' });
    res.json({ success: true, message: 'Visitor checked out', data: visitor });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * ---------------- GATE PASSES ----------------
 */
router.get('/passes', authenticateAdmin, async (req, res) => {
  try {
    const query = { instituteId: req.instituteId };
    if (req.query.status && req.query.status !== 'ALL') query.status = req.query.status;

    const passes = await GatePass.find(query).sort({ issuedAt: -1 });
    res.json({ success: true, data: passes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/passes', authenticateAdmin, async (req, res) => {
  try {
    const { studentId, reason, pickupPersonName, pickupPersonRelation, pickupPersonPhone } = req.body;
    const student = await Student.findOne({ _id: studentId, instituteId: req.instituteId }).populate('batchId');

    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const inst = await Institute.findById(req.instituteId);
    const prefix = inst ? inst.code : 'GP';
    const year = new Date().getFullYear();
    const count = await GatePass.countDocuments({ instituteId: req.instituteId });
    const gatePassNo = `${prefix}-GP-${year}-${(count + 1).toString().padStart(4, '0')}`;

    const pass = new GatePass({
      instituteId: req.instituteId,
      gatePassNo,
      studentId: student._id,
      studentName: `${student.fname} ${student.lname}`,
      grno: student.grno,
      batchName: student.batchId ? student.batchId.batchName : '',
      reason,
      pickupPersonName,
      pickupPersonRelation: pickupPersonRelation || 'Parent',
      pickupPersonPhone,
      approvedBy: req.user ? req.user.name : 'Authorized Admin',
      status: 'Approved',
      issuedAt: new Date(),
    });

    const saved = await pass.save();
    res.status(201).json({ success: true, message: 'Gate pass generated successfully', data: saved });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Gate Security marks actual student exit
router.patch('/passes/:id/record-exit', authenticateAdmin, async (req, res) => {
  try {
    const pass = await GatePass.findOne({ _id: req.params.id, instituteId: req.instituteId });
    if (!pass) return res.status(404).json({ success: false, message: 'Gate pass not found' });
    if (pass.status === 'Exited') {
      return res.status(400).json({ success: false, message: 'Student exit has already been verified.' });
    }

    pass.status = 'Exited';
    pass.actualExitTime = new Date();
    pass.gateGuardName = req.user ? req.user.name : 'Gate Security';
    await pass.save();

    res.json({ success: true, message: `Gate pass verified: Student ${pass.studentName} exited campus.`, data: pass });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
