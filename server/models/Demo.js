const mongoose = require('mongoose');

const demoSchema = new mongoose.Schema({
  instituteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute',
    required: true,
    index: true,
  },
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enquiry',
    index: true,
  },
  studentName: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  email: String,
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
  },
  courseName: String,
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  teacherName: String,
  demoDate: {
    type: String, // YYYY-MM-DD
    required: true,
  },
  demoTime: {
    type: String, // HH:mm
    required: true,
  },
  mode: {
    type: String,
    enum: ['offline', 'online'],
    default: 'offline',
  },
  meetingLink: String,
  status: {
    type: String,
    enum: ['Scheduled', 'Attended', 'No-Show', 'Rescheduled', 'Cancelled'],
    default: 'Scheduled',
    index: true,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  feedback: String,
  counsellorNotes: String,
}, { timestamps: true });

demoSchema.index({ instituteId: 1, demoDate: 1 });
demoSchema.index({ instituteId: 1, teacherId: 1, demoDate: 1, demoTime: 1 });

module.exports = mongoose.model('Demo', demoSchema);
