const express = require('express');
const router = express.Router();
const LiveClass = require('../models/LiveClass');
const Attendance = require('../models/Attendance');
const Student = require('../models/Students');
const { authenticateAdmin, authenticateStudent } = require('../middleware/auth');

/**
 * Get Live Classes for Admin (scoped by institute)
 */
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const query = { instituteId: req.instituteId };
    if (req.query.batchId) query.batchId = req.query.batchId;
    if (req.query.status) query.status = req.query.status;

    const classes = await LiveClass.find(query)
      .populate('batchId', 'batchName batchCode timing')
      .populate('courseId', 'courseName')
      .sort({ scheduledDate: -1, startTime: -1 });

    res.json({ success: true, data: classes });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch live classes', error: err.message });
  }
});

/**
 * Schedule New Live Class
 */
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { batchId, courseId, title, subject, scheduledDate, startTime, endTime, durationMinutes, provider, meetingLink } = req.body;

    const roomId = `class-${(title || 'session').toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.random().toString(36).substring(2, 7)}`;
    
    const liveClass = new LiveClass({
      instituteId: req.instituteId,
      batchId,
      courseId,
      title,
      subject,
      teacherId: req.user._id,
      teacherName: req.user.name,
      scheduledDate,
      startTime,
      endTime,
      durationMinutes: durationMinutes || 60,
      provider: provider || 'jitsi',
      meetingRoomId: roomId,
      meetingLink: provider === 'zoom' || provider === 'gmeet' ? meetingLink : `https://meet.jit.si/${roomId}`,
      status: 'Scheduled',
    });

    await liveClass.save();

    // Broadcast live status via socket if IO attached
    if (req.app.get('io')) {
      req.app.get('io').to(`inst_${req.instituteId}`).emit('live_class_scheduled', liveClass);
    }

    res.status(201).json({ success: true, message: 'Live class scheduled successfully', data: liveClass });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to schedule live class', error: err.message });
  }
});

/**
 * Toggle Live Status (Start / End class)
 */
router.patch('/:id/toggle-live', authenticateAdmin, async (req, res) => {
  try {
    const { isLive } = req.body;
    const liveClass = await LiveClass.findOne({ _id: req.params.id, instituteId: req.instituteId });

    if (!liveClass) {
      return res.status(404).json({ success: false, message: 'Live class not found' });
    }

    liveClass.isLive = isLive;
    liveClass.status = isLive ? 'Live' : 'Completed';
    await liveClass.save();

    // Broadcast live status update
    if (req.app.get('io')) {
      req.app.get('io').to(`inst_${req.instituteId}`).emit('live_class_status_change', {
        id: liveClass._id,
        title: liveClass.title,
        batchId: liveClass.batchId,
        isLive: liveClass.isLive,
        status: liveClass.status,
      });
    }

    res.json({ success: true, message: `Live class is now ${isLive ? 'LIVE' : 'COMPLETED'}`, data: liveClass });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to toggle live state', error: err.message });
  }
});

/**
 * Record Student Join Event & Auto-Attendance
 */
router.post('/:id/join', authenticateStudent, async (req, res) => {
  try {
    const student = req.student;
    const liveClass = await LiveClass.findOne({ _id: req.params.id, instituteId: req.instituteId });

    if (!liveClass) {
      return res.status(404).json({ success: false, message: 'Live class not found' });
    }

    // Add attendee record if not already recorded
    const existingIndex = liveClass.attendees.findIndex(a => a.studentId.toString() === student._id.toString());
    if (existingIndex === -1) {
      liveClass.attendees.push({
        studentId: student._id,
        studentName: `${student.fname} ${student.lname}`,
        joinTime: new Date(),
        durationMinutes: 45, // default estimated
      });
      await liveClass.save();
    }

    res.json({
      success: true,
      message: 'Joined live class successfully',
      data: {
        meetingRoomId: liveClass.meetingRoomId,
        meetingLink: liveClass.meetingLink,
        provider: liveClass.provider,
        title: liveClass.title,
        teacherName: liveClass.teacherName,
        studentDisplayName: `${student.fname} ${student.lname} (${student.grno || student.studentId})`
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to join live class', error: err.message });
  }
});

/**
 * Delete Live Class
 */
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    await LiveClass.findOneAndDelete({ _id: req.params.id, instituteId: req.instituteId });
    res.json({ success: true, message: 'Live class deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete' });
  }
});

module.exports = router;
