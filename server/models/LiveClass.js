const mongoose = require('mongoose');

const liveClassSchema = new mongoose.Schema({
  instituteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute',
    required: true,
    index: true,
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true,
    index: true,
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  subject: {
    type: String,
    required: true,
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  teacherName: {
    type: String,
    required: true,
  },
  scheduledDate: {
    type: String, // YYYY-MM-DD
    required: true,
  },
  startTime: {
    type: String, // HH:mm
    required: true,
  },
  endTime: {
    type: String, // HH:mm
  },
  durationMinutes: {
    type: Number,
    default: 60,
  },
  provider: {
    type: String,
    enum: ['jitsi', 'zoom', 'gmeet'],
    default: 'jitsi',
  },
  meetingRoomId: {
    type: String,
    default: () => `class-${Math.random().toString(36).substring(2, 10)}`,
  },
  meetingLink: {
    type: String,
    default: '',
  },
  isLive: {
    type: Boolean,
    default: false,
    index: true,
  },
  recordingUrl: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Live', 'Completed', 'Cancelled'],
    default: 'Scheduled',
  },
  attendees: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    studentName: String,
    joinTime: Date,
    leaveTime: Date,
    durationMinutes: Number,
  }],
}, { timestamps: true });

liveClassSchema.index({ instituteId: 1, batchId: 1, scheduledDate: 1 });
liveClassSchema.index({ instituteId: 1, isLive: 1 });

module.exports = mongoose.model('LiveClass', liveClassSchema);
