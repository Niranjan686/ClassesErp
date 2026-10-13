const express = require('express');
const router = express.Router();
const Timetable = require('../models/Timetable');
const Batch = require('../models/Batch');
const Course = require('../models/Course');
const Staff = require('../models/Staff');
const Leave = require('../models/Leave');
const { authenticateAdmin } = require('../middleware/auth');

/**
 * Helper: Detect Timetable Conflicts (Teacher, Room, Batch)
 */
async function checkConflicts({ instituteId, day, startTime, endTime, teacherName, roomNo, batchId, excludeId = null }) {
  const conflicts = [];

  const baseQuery = {
    instituteId,
    day,
    _id: { $ne: excludeId },
    $or: [
      { startTime: { $lte: startTime }, endTime: { $gt: startTime } },
      { startTime: { $lt: endTime }, endTime: { $gte: endTime } },
      { startTime: { $gte: startTime }, endTime: { $lte: endTime } },
    ]
  };

  // 1. Teacher conflict
  if (teacherName) {
    const teacherConflict = await Timetable.findOne({ ...baseQuery, teacherName }).populate('batchId', 'batchName');
    if (teacherConflict) {
      conflicts.push(`Teacher "${teacherName}" is already scheduled in batch "${teacherConflict.batchId ? teacherConflict.batchId.batchName : 'Other'}" (${teacherConflict.startTime} - ${teacherConflict.endTime}).`);
    }
  }

  // 2. Room conflict
  if (roomNo && roomNo !== 'Online') {
    const roomConflict = await Timetable.findOne({ ...baseQuery, roomNo }).populate('batchId', 'batchName');
    if (roomConflict) {
      conflicts.push(`Room "${roomNo}" is already occupied by batch "${roomConflict.batchId ? roomConflict.batchId.batchName : 'Other'}" (${roomConflict.startTime} - ${roomConflict.endTime}).`);
    }
  }

  // 3. Batch conflict (period overlap in same batch)
  if (batchId) {
    const batchConflict = await Timetable.findOne({ ...baseQuery, batchId });
    if (batchConflict) {
      conflicts.push(`Batch already has subject "${batchConflict.subject}" scheduled from ${batchConflict.startTime} to ${batchConflict.endTime}.`);
    }
  }

  return conflicts;
}

/**
 * 1. Get weekly timetable for a Batch
 */
router.get('/batch/:batchId', async (req, res) => {
  try {
    const { isStudentView, targetDate } = req.query;
    const query = { batchId: req.params.batchId };
    if (isStudentView === 'true') {
      query.isPublished = true;
    }

    const periods = await Timetable.find(query)
      .populate('courseId', 'courseName courseCode')
      .populate('batchId', 'batchName batchCode')
      .populate('teacherId', 'name designation phone email')
      .sort({ day: 1, periodNumber: 1 });

    const dateStr = targetDate || new Date().toISOString().split('T')[0];

    // If target date provided, overlay active substitutions
    const formatted = periods.map(p => {
      const pObj = p.toObject();
      const activeSub = (pObj.substitutions || []).find(s => s.date === dateStr && s.status === 'Approved');
      if (activeSub) {
        pObj.effectiveTeacherName = activeSub.substituteTeacherName;
        pObj.isSubstituted = true;
        pObj.substitutionReason = activeSub.reason;
      } else {
        pObj.effectiveTeacherName = pObj.teacherName;
        pObj.isSubstituted = false;
      }
      return pObj;
    });

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 2. Get schedule for a Teacher
 */
router.get('/teacher/:teacherName', authenticateAdmin, async (req, res) => {
  try {
    const periods = await Timetable.find({
      instituteId: req.instituteId,
      teacherName: new RegExp(`^${req.params.teacherName}$`, 'i'),
    })
      .populate('batchId', 'batchName batchCode roomNo')
      .sort({ day: 1, periodNumber: 1 });

    res.json({ success: true, data: periods });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 3. Create Period Schedule with Conflict Detection
 */
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const {
      courseId,
      batchId,
      day,
      periodNumber,
      periodName,
      startTime,
      endTime,
      subject,
      teacherId,
      teacherName,
      roomNo,
      isBreak,
      isPublished,
      forceBypassConflicts,
    } = req.body;

    if (!batchId || !day || !periodNumber || !startTime || !endTime || !subject) {
      return res.status(400).json({ success: false, message: 'Missing required timetable fields.' });
    }

    // Run conflict detection unless explicitly bypassed
    if (!forceBypassConflicts && !isBreak) {
      const conflicts = await checkConflicts({
        instituteId: req.instituteId,
        day,
        startTime,
        endTime,
        teacherName,
        roomNo,
        batchId,
      });

      if (conflicts.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Timetable conflict detected!',
          conflicts,
          canBypass: true,
        });
      }
    }

    const slot = new Timetable({
      instituteId: req.instituteId,
      courseId,
      batchId,
      day,
      periodNumber,
      periodName: periodName || `Period ${periodNumber}`,
      startTime,
      endTime,
      subject,
      teacherId,
      teacherName: teacherName || 'Senior Faculty',
      roomNo: roomNo || 'Classroom 1',
      isBreak: !!isBreak,
      isPublished: isPublished !== undefined ? isPublished : true,
    });

    const saved = await slot.save();
    res.status(201).json({ success: true, message: 'Timetable slot created successfully', data: saved });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 4. Update Timetable Slot
 */
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { day, startTime, endTime, teacherName, roomNo, batchId, forceBypassConflicts } = req.body;

    if (!forceBypassConflicts) {
      const conflicts = await checkConflicts({
        instituteId: req.instituteId,
        day,
        startTime,
        endTime,
        teacherName,
        roomNo,
        batchId,
        excludeId: req.params.id,
      });

      if (conflicts.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Timetable conflict detected!',
          conflicts,
          canBypass: true,
        });
      }
    }

    const updated = await Timetable.findOneAndUpdate(
      { _id: req.params.id, instituteId: req.instituteId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: 'Slot not found' });
    res.json({ success: true, message: 'Timetable slot updated successfully', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 5. Delete Timetable Slot
 */
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    await Timetable.findOneAndDelete({ _id: req.params.id, instituteId: req.instituteId });
    res.json({ success: true, message: 'Timetable slot removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 6. Publish / Unpublish Timetable for Batch
 */
router.patch('/publish-batch/:batchId', authenticateAdmin, async (req, res) => {
  try {
    const { isPublished } = req.body;
    await Timetable.updateMany(
      { instituteId: req.instituteId, batchId: req.params.batchId },
      { isPublished: !!isPublished }
    );
    res.json({ success: true, message: `Batch timetable ${isPublished ? 'published' : 'hidden'}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 7. Substitute Teacher Finder: Suggest available teachers for a period
 */
router.get('/available-substitutes', authenticateAdmin, async (req, res) => {
  try {
    const { day, startTime, endTime, date } = req.query;
    if (!day || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: 'day, startTime, and endTime are required' });
    }

    // 1. Get all active staff
    const allStaff = await Staff.find({ instituteId: req.instituteId, status: 'Active' });

    // 2. Find teachers busy during that slot
    const busySlots = await Timetable.find({
      instituteId: req.instituteId,
      day,
      $or: [
        { startTime: { $lte: startTime }, endTime: { $gt: startTime } },
        { startTime: { $lt: endTime }, endTime: { $gte: endTime } },
      ]
    });
    const busyTeacherNames = new Set(busySlots.map(b => b.teacherName.toLowerCase()));

    // 3. Find teachers on approved leave on that date
    let onLeaveStaffIds = new Set();
    if (date) {
      const leaves = await Leave.find({
        instituteId: req.instituteId,
        applicantType: 'Staff',
        status: 'Approved',
        startDate: { $lte: date },
        endDate: { $gte: date },
      });
      leaves.forEach(l => onLeaveStaffIds.add(l.applicantId.toString()));
    }

    // Filter available
    const available = allStaff.filter(s => {
      const isBusy = busyTeacherNames.has(s.name.toLowerCase());
      const isOnLeave = onLeaveStaffIds.has(s._id.toString());
      return !isBusy && !isOnLeave;
    });

    res.json({
      success: true,
      data: available.map(s => ({
        _id: s._id,
        name: s.name,
        designation: s.designation,
        department: s.department,
        phone: s.phone,
      })),
      totalAvailable: available.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 8. Assign / Propose Substitute Teacher
 */
router.post('/:id/substitute', authenticateAdmin, async (req, res) => {
  try {
    const { date, substituteTeacherId, substituteTeacherName, reason } = req.body;
    const slot = await Timetable.findOne({ _id: req.params.id, instituteId: req.instituteId });

    if (!slot) return res.status(404).json({ success: false, message: 'Timetable slot not found' });

    slot.substitutions.push({
      date: date || new Date().toISOString().split('T')[0],
      originalTeacherId: slot.teacherId,
      originalTeacherName: slot.teacherName,
      substituteTeacherId,
      substituteTeacherName,
      reason: reason || 'Teacher on leave',
      status: 'Approved',
      approvedBy: req.user ? req.user.name : 'Principal',
      approvedAt: new Date(),
    });

    await slot.save();
    res.json({ success: true, message: `Substitute assigned: ${substituteTeacherName}`, data: slot });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
