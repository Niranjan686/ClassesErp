const express = require('express');
const router = express.Router();
const { CalendarEvent, PTMSlot } = require('../models/CalendarEvent');
const Student = require('../models/Students');
const Staff = require('../models/Staff');
const { authenticateAdmin } = require('../middleware/auth');

/**
 * ---------------- CALENDAR EVENTS ----------------
 */
router.get('/events', async (req, res) => {
  try {
    const query = {};
    if (req.query.instituteId) query.instituteId = req.query.instituteId;
    if (req.query.eventType && req.query.eventType !== 'ALL') query.eventType = req.query.eventType;

    const events = await CalendarEvent.find(query).sort({ startDate: 1 });
    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/events', authenticateAdmin, async (req, res) => {
  try {
    const event = new CalendarEvent({
      ...req.body,
      instituteId: req.instituteId,
      createdBy: req.user ? req.user.name : 'School Admin',
    });
    const saved = await event.save();
    res.status(201).json({ success: true, message: 'Event scheduled successfully', data: saved });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/events/:id', authenticateAdmin, async (req, res) => {
  try {
    const updated = await CalendarEvent.findOneAndUpdate(
      { _id: req.params.id, instituteId: req.instituteId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, message: 'Event updated successfully', data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/events/:id', authenticateAdmin, async (req, res) => {
  try {
    await CalendarEvent.findOneAndDelete({ _id: req.params.id, instituteId: req.instituteId });
    res.json({ success: true, message: 'Event removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * ---------------- PARENT-TEACHER MEETINGS (PTM) ----------------
 */

// List PTM Slots
router.get('/ptm-slots', async (req, res) => {
  try {
    const query = {};
    if (req.query.instituteId) query.instituteId = req.query.instituteId;
    if (req.query.teacherId) query.teacherId = req.query.teacherId;
    if (req.query.date) query.date = req.query.date;

    const slots = await PTMSlot.find(query).sort({ date: 1, startTime: 1 });
    res.json({ success: true, data: slots });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Teacher creates available slot(s)
router.post('/ptm-slots', authenticateAdmin, async (req, res) => {
  try {
    const { teacherId, date, startTime, endTime, maxDurationMinutes = 15 } = req.body;
    const teacher = await Staff.findById(teacherId);

    const slot = new PTMSlot({
      instituteId: req.instituteId,
      teacherId,
      teacherName: teacher ? teacher.name : (req.body.teacherName || 'Faculty'),
      date,
      startTime,
      endTime,
      maxDurationMinutes,
      isBooked: false,
    });

    const saved = await slot.save();
    res.status(201).json({ success: true, message: 'PTM Slot created', data: saved });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Parent Books Slot (With double-booking prevention)
router.post('/ptm-slots/:id/book', async (req, res) => {
  try {
    const { studentId, parentName, parentContact, purpose } = req.body;
    const slot = await PTMSlot.findById(req.params.id);

    if (!slot) return res.status(404).json({ success: false, message: 'PTM slot not found' });
    if (slot.isBooked) {
      return res.status(409).json({ success: false, message: 'This slot is already booked. Please choose another time.' });
    }

    const student = await Student.findById(studentId);

    slot.isBooked = true;
    slot.booking = {
      studentId,
      studentName: student ? `${student.fname} ${student.lname}` : 'Student',
      grno: student ? student.grno : '',
      parentName: parentName || (student ? student.fatherName : 'Parent'),
      parentContact: parentContact || (student ? student.fatherMobileNo : ''),
      purpose: purpose || 'Academic Progress Discussion',
      status: 'Confirmed',
      bookedAt: new Date(),
    };

    await slot.save();
    res.json({ success: true, message: `Meeting confirmed with ${slot.teacherName} at ${slot.startTime}`, data: slot });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update Meeting Status or Add Notes
router.patch('/ptm-slots/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { status, meetingNotes } = req.body;
    const slot = await PTMSlot.findOne({ _id: req.params.id, instituteId: req.instituteId });
    if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });

    if (slot.booking) {
      if (status) slot.booking.status = status;
      if (meetingNotes) slot.booking.meetingNotes = meetingNotes;
      await slot.save();
    }

    res.json({ success: true, message: 'Meeting notes recorded', data: slot });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Cancel PTM Booking (Frees slot for others)
router.post('/ptm-slots/:id/cancel', async (req, res) => {
  try {
    const slot = await PTMSlot.findById(req.params.id);
    if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });

    slot.isBooked = false;
    slot.booking = undefined;
    await slot.save();

    res.json({ success: true, message: 'Meeting cancelled and slot is now available.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
