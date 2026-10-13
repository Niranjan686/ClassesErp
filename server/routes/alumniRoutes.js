const express = require('express');
const router = express.Router();
const Alumni = require('../models/Alumni');
const Student = require('../models/Students');
const { authenticateAdmin } = require('../middleware/auth');

/**
 * List Alumni (Admin & Public Directory with privacy filter)
 */
router.get('/', async (req, res) => {
  try {
    const query = {};
    if (req.query.instituteId) query.instituteId = req.query.instituteId;
    if (req.query.graduationYear) query.graduationYear = Number(req.query.graduationYear);
    if (req.query.search) {
      const reg = new RegExp(req.query.search, 'i');
      query.$or = [{ name: reg }, { courseCompleted: reg }, { currentOrganization: reg }];
    }

    // If unauthenticated public request, only return public profiles and hide personal contact
    const isPublic = req.query.public === 'true';
    if (isPublic) {
      query.isProfilePublic = true;
    }

    let records = await Alumni.find(query).sort({ graduationYear: -1, name: 1 });

    if (isPublic) {
      records = records.map(r => ({
        _id: r._id,
        name: r.name,
        graduationYear: r.graduationYear,
        courseCompleted: r.courseCompleted,
        currentOrganization: r.currentOrganization,
        designation: r.designation,
        city: r.city,
      }));
    }

    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Register Alumni Record (Admin)
 */
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { studentId, name, graduationYear, courseCompleted, email, phone, currentOrganization, designation, city, isProfilePublic } = req.body;

    const alumni = new Alumni({
      instituteId: req.instituteId,
      studentId: studentId || undefined,
      name,
      graduationYear: Number(graduationYear) || new Date().getFullYear(),
      courseCompleted,
      email,
      phone,
      currentOrganization,
      designation,
      city: city || 'Mumbai',
      isProfilePublic: !!isProfilePublic,
    });

    const saved = await alumni.save();
    res.status(201).json({ success: true, message: 'Alumni record registered', data: saved });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * Update Alumni Profile
 */
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const updated = await Alumni.findOneAndUpdate(
      { _id: req.params.id, instituteId: req.instituteId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'Alumni record not found' });
    res.json({ success: true, message: 'Alumni profile updated', data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * Delete Alumni Record
 */
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    await Alumni.findOneAndDelete({ _id: req.params.id, instituteId: req.instituteId });
    res.json({ success: true, message: 'Alumni record deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Export Alumni Directory (Admin)
 */
router.get('/export/csv', authenticateAdmin, async (req, res) => {
  try {
    const list = await Alumni.find({ instituteId: req.instituteId }).sort({ graduationYear: -1 });

    const csvRows = [
      'Name,Graduation Year,Course,Organization,Designation,City,Email,Phone',
      ...list.map(a => `"${a.name}",${a.graduationYear},"${a.courseCompleted}","${a.currentOrganization || ''}","${a.designation || ''}","${a.city || ''}","${a.email || ''}","${a.phone || ''}"`)
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="alumni_directory.csv"');
    res.status(200).send(csvRows.join('\r\n'));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
