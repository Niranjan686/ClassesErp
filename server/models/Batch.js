const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  instituteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute',
    required: true,
    index: true,
  },
  batchName: {
    type: String,
    required: true,
    trim: true,
  },
  batchCode: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  timing: {
    type: String,
    required: true,
  },
  startTime: {
    type: String,
    default: '08:00 AM',
  },
  endTime: {
    type: String,
    default: '09:30 AM',
  },
  days: {
    type: String,
    enum: ['Daily (Mon-Sat)', 'Mon-Wed-Fri (MWF)', 'Tue-Thu-Sat (TTS)', 'Weekend (Sat-Sun)', 'Sunday Only'],
    default: 'Mon-Wed-Fri (MWF)',
  },
  mode: {
    type: String,
    enum: ['offline', 'online', 'hybrid'],
    default: 'offline',
  },
  instructor: {
    type: String,
    default: 'Senior Faculty',
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  assignedTeachers: [{
    subject: String,
    teacherName: String,
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  }],
  timetableSlots: [{
    day: { type: String, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
    startTime: String,
    endTime: String,
    subject: String,
    teacherName: String,
    roomNo: String,
  }],
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: Date,
  maxCapacity: {
    type: Number,
    default: 30,
  },
  roomNo: {
    type: String,
    default: 'Classroom A-101',
  },
  status: {
    type: String,
    enum: ['Active', 'Upcoming', 'Completed', 'Paused'],
    default: 'Active',
  },
}, { timestamps: true });

batchSchema.index({ instituteId: 1, batchCode: 1 }, { unique: true });
batchSchema.index({ instituteId: 1, courseId: 1, status: 1 });

module.exports = mongoose.model('Batch', batchSchema);
