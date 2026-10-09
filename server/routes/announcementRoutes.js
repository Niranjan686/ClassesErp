const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const { authenticateAdmin, authenticateStudent } = require('../middleware/auth');

/**
 * Get Announcements for Admin
 */
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const list = await Announcement.find({ instituteId: req.instituteId })
      .sort({ isPinned: -1, createdAt: -1 });
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch announcements' });
  }
});

/**
 * Create Announcement
 */
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { title, message, category, priority, targetType, targetId, isPinned } = req.body;

    const notice = new Announcement({
      instituteId: req.instituteId,
      title,
      message,
      category: category || 'General',
      priority: priority || 'Medium',
      targetType: targetType || 'all',
      targetId,
      isPinned: !!isPinned,
      authorName: req.user.name,
    });

    await notice.save();

    // Broadcast notice in real-time via Socket.IO
    if (req.app.get('io')) {
      req.app.get('io').to(`inst_${req.instituteId}`).emit('new_announcement', notice);
    }

    res.status(201).json({ success: true, message: 'Notice published successfully', data: notice });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to publish notice', error: err.message });
  }
});

/**
 * Student Notices Feed
 */
router.get('/student-view', authenticateStudent, async (req, res) => {
  try {
    const student = req.student;
    const list = await Announcement.find({
      instituteId: req.instituteId,
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
