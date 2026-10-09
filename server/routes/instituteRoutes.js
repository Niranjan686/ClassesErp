const express = require('express');
const router = express.Router();
const Institute = require('../models/Institute');
const User = require('../models/user');
const Student = require('../models/Students');
const Batch = require('../models/Batch');
const Course = require('../models/Course');
const { authenticateAdmin } = require('../middleware/auth');

/**
 * Superadmin: Get All Institutes with Stats
 */
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Superadmin privileges required' });
    }

    const institutes = await Institute.find().sort({ createdAt: -1 });

    const instituteData = await Promise.all(
      institutes.map(async (inst) => {
        const studentCount = await Student.countDocuments({ instituteId: inst._id });
        const batchCount = await Batch.countDocuments({ instituteId: inst._id });
        const courseCount = await Course.countDocuments({ instituteId: inst._id });
        const adminUser = await User.findOne({ instituteId: inst._id, role: { $in: ['owner', 'admin'] } }).select('name email phone');

        return {
          ...inst.toObject(),
          stats: {
            students: studentCount,
            batches: batchCount,
            courses: courseCount,
          },
          owner: adminUser || null,
        };
      })
    );

    res.json({ success: true, data: instituteData });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch institutes', error: err.message });
  }
});

/**
 * Superadmin: Create New Institute & Onboard Owner
 */
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Superadmin privileges required' });
    }

    const { code, name, subdomain, logo, brandColor, phone, email, ownerName, ownerEmail, ownerPassword, plan, limits } = req.body;

    const existing = await Institute.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: `Institute code ${code} already exists.` });
    }

    const institute = new Institute({
      code: code.toUpperCase(),
      name,
      subdomain: subdomain || code.toLowerCase(),
      logo: logo || '',
      brandColor: brandColor || '#2563eb',
      phone,
      email,
      plan: plan || 'Pro',
      limits: limits || { maxStudents: 500, maxStorageGB: 50, liveClassesEnabled: true, smsQuota: 5000 },
      status: 'active',
    });

    await institute.save();

    // Create Owner User
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(ownerPassword || 'Demo@123', 10);
    const owner = new User({
      instituteId: institute._id,
      name: ownerName || 'Institute Director',
      email: (ownerEmail || email || `admin@${code.toLowerCase()}.com`).toLowerCase(),
      username: (ownerEmail || email || `admin@${code.toLowerCase()}.com`).toLowerCase(),
      phone: phone || '',
      password: hashedPassword,
      role: 'owner',
      permissions: ['*'],
      isActive: true,
    });
    await owner.save();

    res.status(201).json({
      success: true,
      message: 'Institute onboarded and owner credentials created successfully!',
      data: {
        institute,
        owner: {
          name: owner.name,
          email: owner.email,
          role: owner.role,
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create institute', error: err.message });
  }
});

/**
 * Superadmin: Toggle Institute Status (Active / Suspended)
 */
router.patch('/:id/status', authenticateAdmin, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Superadmin privileges required' });
    }

    const { status } = req.body;
    const institute = await Institute.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ success: true, message: `Institute status set to ${status}`, data: institute });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
});

/**
 * Update Current Institute Settings (for Institute Owner/Admin)
 */
router.put('/current', authenticateAdmin, async (req, res) => {
  try {
    const { name, logo, brandColor, phone, email, academicYear, workingDays, timings, currency, gstNumber, receiptPrefix } = req.body;

    const updated = await Institute.findByIdAndUpdate(
      req.instituteId,
      {
        name,
        logo,
        brandColor,
        phone,
        email,
        academicYear,
        workingDays,
        timings,
        currency,
        gstNumber,
        receiptPrefix,
      },
      { new: true }
    );

    res.json({ success: true, message: 'Institute settings updated successfully', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update institute settings', error: err.message });
  }
});

module.exports = router;
