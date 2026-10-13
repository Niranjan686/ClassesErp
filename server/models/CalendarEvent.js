const mongoose = require('mongoose');

// 1. Calendar Event Schema
const calendarEventSchema = new mongoose.Schema({
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true, index: true },
  title: { type: String, required: true, trim: true },
  eventType: {
    type: String,
    enum: ['Holiday', 'Exam Session', 'Sports & Cultural', 'Parent-Teacher Meeting (PTM)', 'Academic Deadline', 'Workshop & Seminar', 'General Announcement'],
    default: 'Holiday',
    index: true,
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  allDay: { type: Boolean, default: true },
  startTime: String,
  endTime: String,
  location: { type: String, default: 'School Campus' },
  targetAudience: {
    type: String,
    enum: ['All', 'Staff Only', 'Students & Parents', 'Specific Batch'],
    default: 'All',
  },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
  description: { type: String, default: '' },
  createdBy: String,
}, { timestamps: true });

calendarEventSchema.index({ instituteId: 1, startDate: 1 });

// 2. Parent-Teacher Meeting (PTM) Slot & Booking Schema
const ptmSlotSchema = new mongoose.Schema({
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true, index: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true, index: true },
  teacherName: { type: String, required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  startTime: { type: String, required: true }, // e.g. "10:00 AM"
  endTime: { type: String, required: true },   // e.g. "10:15 AM"
  maxDurationMinutes: { type: Number, default: 15 },
  isBooked: { type: Boolean, default: false, index: true },
  booking: {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    studentName: String,
    grno: String,
    parentName: String,
    parentContact: String,
    purpose: String,
    status: {
      type: String,
      enum: ['Confirmed', 'Completed', 'Cancelled', 'Rescheduled'],
      default: 'Confirmed',
    },
    meetingNotes: String,
    bookedAt: { type: Date, default: Date.now },
  },
}, { timestamps: true });

ptmSlotSchema.index({ instituteId: 1, teacherId: 1, date: 1, startTime: 1 }, { unique: true });

const CalendarEvent = mongoose.model('CalendarEvent', calendarEventSchema);
const PTMSlot = mongoose.model('PTMSlot', ptmSlotSchema);

module.exports = {
  CalendarEvent,
  PTMSlot,
};
