const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const { authenticateAdmin, authenticateStudent } = require('../middleware/auth');

/**
 * Get Study Notes (Admin)
 */
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const query = { instituteId: req.instituteId };
    if (req.query.courseId) query.courseId = req.query.courseId;
    if (req.query.subject) query.subject = req.query.subject;

    const notes = await Note.find(query)
      .populate('courseId', 'courseName courseCode')
      .populate('batches', 'batchName')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: notes });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch notes', error: err.message });
  }
});

/**
 * Upload / Create Note
 */
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { courseId, subject, chapter, title, description, fileType, fileUrl, fileSize, batches, allowDownload } = req.body;

    const note = new Note({
      instituteId: req.instituteId,
      courseId,
      subject,
      chapter,
      title,
      description,
      fileType: fileType || 'pdf',
      fileUrl: fileUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      fileSize: fileSize || '2.4 MB',
      batches: batches || [],
      allowDownload: allowDownload !== undefined ? allowDownload : true,
      uploadedBy: req.user._id,
      uploadedByName: req.user.name,
    });

    await note.save();
    res.status(201).json({ success: true, message: 'Study material published successfully', data: note });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create note', error: err.message });
  }
});

/**
 * Student Notes List (Filtered by student's batch & course)
 */
router.get('/student-view', authenticateStudent, async (req, res) => {
  try {
    const student = req.student;
    const query = {
      instituteId: req.instituteId,
      $or: [
        { courseId: student.courseId },
        { batches: student.batchId },
        { batches: { $size: 0 } }
      ]
    };

    const notes = await Note.find(query)
      .populate('courseId', 'courseName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: notes,
      watermark: {
        text: `${student.fname} ${student.lname} | ID: ${student.grno || student.studentId} | ${student.mobileNo}`,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch student notes', error: err.message });
  }
});

/**
 * Track Note View Event
 */
router.post('/:id/track-view', authenticateStudent, async (req, res) => {
  try {
    const student = req.student;
    const note = await Note.findOne({ _id: req.params.id, instituteId: req.instituteId });

    if (note) {
      note.viewCount = (note.viewCount || 0) + 1;
      note.views.push({ studentId: student._id, viewedAt: new Date() });
      await note.save();
    }

    res.json({ success: true, message: 'View tracked' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to track view' });
  }
});

/**
 * Delete Note
 */
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    await Note.findOneAndDelete({ _id: req.params.id, instituteId: req.instituteId });
    res.json({ success: true, message: 'Study note deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete' });
  }
});

module.exports = router;
