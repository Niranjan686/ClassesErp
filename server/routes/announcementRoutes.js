const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const Institute = require('../models/Institute');
const Student = require('../models/Students');
const { authenticateAdmin, authenticateStudent } = require('../middleware/auth');

/**
 * Get Announcements for Admin (with search, category, type, and status filter)
 */
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const query = { instituteId: req.instituteId };
    if (req.query.status && req.query.status !== 'ALL') query.status = req.query.status;
    if (req.query.type && req.query.type !== 'ALL') query.type = req.query.type;
    if (req.query.category && req.query.category !== 'ALL') query.category = req.query.category;

    const list = await Announcement.find(query).sort({ isPinned: -1, createdAt: -1 });
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch announcements' });
  }
});

/**
 * Create Announcement / Circular
 */
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const {
      title,
      message,
      type = 'General Announcement',
      category = 'General',
      priority = 'Medium',
      status = 'Published',
      targetType = 'all',
      targetRole = 'All',
      targetId,
      isPinned,
      requiresAcknowledgement,
      attachments = [],
    } = req.body;

    const inst = await Institute.findById(req.instituteId);
    const prefix = inst ? inst.code : 'CIR';
    const year = new Date().getFullYear();
    const count = await Announcement.countDocuments({ instituteId: req.instituteId });
    const circularNumber = `${prefix}-CIR-${year}-${(count + 1).toString().padStart(3, '0')}`;

    const notice = new Announcement({
      instituteId: req.instituteId,
      circularNumber,
      type,
      title,
      message,
      category,
      priority,
      status,
      targetType,
      targetRole,
      targetId,
      isPinned: !!isPinned,
      requiresAcknowledgement: !!requiresAcknowledgement,
      attachments,
      authorName: req.user.name,
    });

    await notice.save();

    // Broadcast notice in real-time via Socket.IO
    if (req.app.get('io') && status === 'Published') {
      req.app.get('io').to(`inst_${req.instituteId}`).emit('new_announcement', notice);
    }

    res.status(201).json({ success: true, message: 'Notice / Circular saved successfully', data: notice });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to publish notice', error: err.message });
  }
});

/**
 * Acknowledge Notice (Student or Staff or Parent)
 */
router.post('/:id/acknowledge', async (req, res) => {
  try {
    const { userId, userType = 'Student', userName } = req.body;
    const notice = await Announcement.findById(req.params.id);
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });

    // Check if already acknowledged
    const alreadyAck = notice.acknowledgements.some(a => a.userId.toString() === userId.toString());
    if (alreadyAck) {
      return res.json({ success: true, message: 'Notice already acknowledged.', data: notice });
    }

    notice.acknowledgements.push({
      userId,
      userType,
      userName: userName || 'Acknowledged User',
      acknowledgedAt: new Date(),
    });

    await notice.save();
    res.json({ success: true, message: 'Acknowledgement recorded successfully', data: notice });
  } catch (err) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get Acknowledgement List for Notice (Admin)
 */
router.get('/:id/acknowledgements', authenticateAdmin, async (req, res) => {
  try {
    const notice = await Announcement.findOne({ _id: req.params.id, instituteId: req.instituteId });
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });

    res.json({
      success: true,
      circularNumber: notice.circularNumber,
      title: notice.title,
      totalAcknowledgements: notice.acknowledgements.length,
      data: notice.acknowledgements,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Student Notices Feed (Published only, filtered by audience)
 */
router.get('/student-view', authenticateStudent, async (req, res) => {
  try {
    const student = req.student;
    const list = await Announcement.find({
      instituteId: req.instituteId,
      status: 'Published',
      targetRole: { $in: ['All', 'Students Only'] },
      $or: [
        { targetType: 'all' },
        { targetType: 'course', targetId: student.courseId },
        { targetType: 'batch', targetId: student.batchId },
        { targetType: 'student', targetId: student._id },
      ]
    }).sort({ isPinned: -1, createdAt: -1 });

    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch student notices' });
  }
});

/**
 * Update Status (Draft / Published / Archived)
 */
router.patch('/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await Announcement.findOneAndUpdate(
      { _id: req.params.id, instituteId: req.instituteId },
      { status },
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'Notice not found' });
    res.json({ success: true, message: `Notice status updated to ${status}`, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Delete Announcement
 */
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    await Announcement.findOneAndDelete({ _id: req.params.id, instituteId: req.instituteId });
    res.json({ success: true, message: 'Notice deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete' });
  }
});

module.exports = router;
