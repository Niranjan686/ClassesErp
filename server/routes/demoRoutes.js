const express = require('express');
const router = express.Router();
const Demo = require('../models/Demo');
const Enquiry = require('../models/Enquiry');
const { authenticateAdmin } = require('../middleware/auth');

/**
 * Get all Demo classes (Admin)
 */
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const query = { instituteId: req.instituteId };
    if (req.query.status) query.status = req.query.status;
    if (req.query.date) query.demoDate = req.query.date;

    const demos = await Demo.find(query)
      .populate('courseId', 'courseName')
      .populate('batchId', 'batchName')
      .populate('teacherId', 'name')
      .sort({ demoDate: 1, demoTime: 1 });

    res.json({ success: true, data: demos });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch demo classes', error: err.message });
  }
});

/**
 * Schedule a Demo Class
 */
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { leadId, studentName, phone, email, courseId, courseName, batchId, teacherId, teacherName, demoDate, demoTime, mode, meetingLink, counsellorNotes } = req.body;

    // Check for double booking
    if (teacherId && demoDate && demoTime) {
      const conflict = await Demo.findOne({
        instituteId: req.instituteId,
        teacherId,
        demoDate,
        demoTime,
        status: { $in: ['Scheduled', 'Attended'] }
      });
      if (conflict) {
        return res.status(400).json({
          success: false,
          message: `Teacher ${teacherName || 'selected'} is already booked for another demo at ${demoTime} on ${demoDate}. Please select another slot.`
        });
      }
    }

    const demo = new Demo({
      instituteId: req.instituteId,
      leadId,
      studentName,
      phone,
      email,
      courseId,
      courseName,
      batchId,
      teacherId,
      teacherName: teacherName || 'Faculty Instructor',
      demoDate,
      demoTime,
      mode: mode || 'offline',
      meetingLink: meetingLink || (mode === 'online' ? `https://meet.jit.si/demo-${Math.random().toString(36).substring(2, 8)}` : ''),
      counsellorNotes,
      status: 'Scheduled',
    });

    await demo.save();

    // If linked to lead, update lead status
    if (leadId) {
      await Enquiry.findByIdAndUpdate(leadId, {
        status: 'Demo Scheduled',
        demoId: demo._id,
        demoDate,
        demoTiming: demoTime,
        demoFaculty: teacherName,
        demoStatus: 'Scheduled',
      });
    }

    res.status(201).json({ success: true, message: 'Demo class scheduled successfully', data: demo });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to schedule demo', error: err.message });
  }
});

/**
 * Update Demo Outcome & Feedback
 */
router.patch('/:id/outcome', authenticateAdmin, async (req, res) => {
  try {
    const { status, rating, feedback } = req.body;
    const demo = await Demo.findOne({ _id: req.params.id, instituteId: req.instituteId });

    if (!demo) {
      return res.status(404).json({ success: false, message: 'Demo class not found' });
    }

    demo.status = status || demo.status;
    if (rating !== undefined) demo.rating = rating;
    if (feedback !== undefined) demo.feedback = feedback;
    await demo.save();

    // Update lead pipeline stage if attached
    if (demo.leadId) {
      const leadStatus = status === 'Attended' ? 'Demo Attended' : (status === 'No-Show' ? 'Contacted' : 'Demo Scheduled');
      await Enquiry.findByIdAndUpdate(demo.leadId, {
        status: leadStatus,
        demoStatus: status,
        demoFeedback: feedback,
      });
    }

    res.json({ success: true, message: 'Demo status updated successfully', data: demo });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update demo outcome', error: err.message });
  }
});

/**
 * Delete Demo
 */
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    await Demo.findOneAndDelete({ _id: req.params.id, instituteId: req.instituteId });
    res.json({ success: true, message: 'Demo schedule deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete demo' });
  }
});

module.exports = router;
