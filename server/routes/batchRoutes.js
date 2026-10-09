const express = require('express');
const router = express.Router();
const Batch = require('../models/Batch');
const Student = require('../models/Students');
const { authenticateAdmin } = require('../middleware/auth');

/**
 * Get all batches
 */
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const query = { instituteId: req.instituteId };
    if (req.query.courseId && req.query.courseId !== 'ALL') {
      query.courseId = req.query.courseId;
    }

    // If teacher role, only return assigned batches
    if (req.user.role === 'teacher' && req.user.assignedBatches && req.user.assignedBatches.length > 0) {
      query._id = { $in: req.user.assignedBatches };
    }

    const batches = await Batch.find(query)
      .populate('courseId', 'courseName courseCode totalFees duration')
      .sort({ createdAt: -1 });

    const enriched = await Promise.all(batches.map(async (b) => {
      const studentCount = await Student.countDocuments({ instituteId: req.instituteId, batchId: b._id, status: 'Active' });
      return {
        ...b.toObject(),
        enrolledCount: studentCount,
        availableSeats: Math.max(0, (b.maxCapacity || 30) - studentCount),
      };
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get active batches (alias for Attendance & Marksheet pickers)
 */
router.get('/active', authenticateAdmin, async (req, res) => {
  try {
    const query = { instituteId: req.instituteId };
    if (req.user.role === 'teacher' && req.user.assignedBatches && req.user.assignedBatches.length > 0) {
      query._id = { $in: req.user.assignedBatches };
    }

    const batches = await Batch.find(query)
      .populate('courseId', 'courseName courseCode')
      .sort({ batchName: 1 });

    res.json(batches);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Create Batch
 */
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const batch = new Batch({
      ...req.body,
      instituteId: req.instituteId,
    });
    const saved = await batch.save();
    res.status(201).json({ success: true, message: 'Batch created successfully', data: saved });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * Update Batch (Timetable & Capacity)
 */
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const updated = await Batch.findOneAndUpdate(
      { _id: req.params.id, instituteId: req.instituteId },
      req.body,
      { new: true, runValidators: true }
    ).populate('courseId');

    if (!updated) return res.status(404).json({ success: false, message: 'Batch not found' });
    res.json({ success: true, message: 'Batch updated successfully', data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * Delete Batch
 */
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    await Batch.findOneAndDelete({ _id: req.params.id, instituteId: req.instituteId });
    res.json({ success: true, message: 'Batch deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
