const express = require('express');
const router = express.Router();
const Enquiry = require('../models/Enquiry');
const Student = require('../models/Students');
const Institute = require('../models/Institute');
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
 * 1-Click Convert Lead to Enrolled Student
 */
router.post('/:id/convert-to-student', authenticateAdmin, async (req, res) => {
  try {
    const { batchId, totalFees, paidFees, paymentMode } = req.body;
    const lead = await Enquiry.findOne({ _id: req.params.id, instituteId: req.instituteId });

    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    if (lead.status === 'Converted') {
      return res.status(400).json({ success: false, message: 'Lead is already converted to a student.' });
    }

    const inst = await Institute.findById(req.instituteId);
    const prefix = inst ? inst.code : 'DEMO01';
    const year = new Date().getFullYear();
    const count = await Student.countDocuments({ instituteId: req.instituteId });
    const nextNum = (count + 1).toString().padStart(4, '0');
    const studentId = `${prefix}-${year}-${nextNum}`;
    const grno = `${prefix}-GR-${nextNum}`;

    const names = (lead.candidateName || 'New Student').split(' ');
    const fname = names[0];
    const lname = names.slice(1).join(' ') || 'Student';

    const student = new Student({
      instituteId: req.instituteId,
      studentId,
      grno,
      fname,
      lname,
      mobileNo: lead.mobileNo,
      email: lead.email,
      courseId: lead.courseId,
      batchId,
      totalFees: Number(totalFees) || 15000,
      paidFees: Number(paidFees) || 0,
      balanceFees: Math.max(0, (Number(totalFees) || 15000) - (Number(paidFees) || 0)),
      referralSource: lead.leadSource,
      leadId: lead._id,
      status: 'Active',
    });

    await student.save();

    lead.status = 'Converted';
    lead.convertedStudentId = student._id;
    lead.admissionDate = new Date();
    await lead.save();

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
 * Delete Lead
 */
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    await Enquiry.findOneAndDelete({ _id: req.params.id, instituteId: req.instituteId });
    res.json({ success: true, message: 'Lead deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
