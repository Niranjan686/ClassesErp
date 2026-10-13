const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  instituteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute',
    required: true,
    index: true,
  },
  academicYear: {
    type: String,
    default: '2026-2027',
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true,
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true,
    index: true,
  },
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true,
  },
  periodNumber: {
    type: Number,
    required: true,
  },
  periodName: {
    type: String,
    default: 'Period 1',
  },
  startTime: {
    type: String,
    required: true, // "08:00 AM" or "08:00"
  },
  endTime: {
    type: String,
    required: true, // "08:45 AM" or "08:45"
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
  },
  teacherName: {
    type: String,
    required: true,
  },
  roomNo: {
    type: String,
    default: 'Room 101',
  },
  isBreak: {
    type: Boolean,
    default: false,
  },
  isPublished: {
    type: Boolean,
    default: true,
    index: true,
  },
  substitutions: [{
    date: { type: String, required: true }, // YYYY-MM-DD
    originalTeacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    originalTeacherName: String,
    substituteTeacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
    substituteTeacherName: { type: String, required: true },
    reason: { type: String, default: 'Leave / Absence' },
    status: {
      type: String,
      enum: ['Proposed', 'Approved', 'Rejected'],
      default: 'Approved',
    },
    approvedBy: String,
    approvedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

timetableSchema.index({ instituteId: 1, batchId: 1, day: 1, periodNumber: 1 });
timetableSchema.index({ instituteId: 1, teacherName: 1, day: 1, startTime: 1 });
timetableSchema.index({ instituteId: 1, roomNo: 1, day: 1, startTime: 1 });

module.exports = mongoose.model('Timetable', timetableSchema);
