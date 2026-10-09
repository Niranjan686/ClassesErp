const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Batch = require('../models/Batch');
const Student = require('../models/Students');
const { authenticateAdmin } = require('../middleware/auth');

/**
 * Get all courses (Admin)
 */
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const courses = await Course.find({ instituteId: req.instituteId }).sort({ courseName: 1 });
    
    // Enrich with batch count & enrolled students count
    const enriched = await Promise.all(courses.map(async (c) => {
      const batchCount = await Batch.countDocuments({ instituteId: req.instituteId, courseId: c._id });
      const studentCount = await Student.countDocuments({ instituteId: req.instituteId, courseId: c._id, status: 'Active' });
      return {
        ...c.toObject(),
        linkedBatchesCount: batchCount,
        enrolledStudentsCount: studentCount,
      };
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Create Course
 */
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const course = new Course({
      ...req.body,
      instituteId: req.instituteId,
    });
    const saved = await course.save();
    res.status(201).json({ success: true, message: 'Course created successfully', data: saved });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * Update Course
 */
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const updated = await Course.findOneAndUpdate(
      { _id: req.params.id, instituteId: req.instituteId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, message: 'Course updated successfully', data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * Delete Course
 */
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    await Course.findOneAndDelete({ _id: req.params.id, instituteId: req.instituteId });
    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
