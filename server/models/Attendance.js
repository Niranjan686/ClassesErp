const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Late', 'Leave'],
    default: 'Present',
  },
  inTime: { type: String, default: '' },
  mode: {
    type: String,
    enum: ['Manual', 'QR', 'LiveClass'],
    default: 'Manual',
  },
  remarks: { type: String, default: '' },
}, { _id: false });

const attendanceSchema = new mongoose.Schema({
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
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true,
  },
  records: [attendanceRecordSchema],
  totalStudents: { type: Number, default: 0 },
  presentCount: { type: Number, default: 0 },
  absentCount: { type: Number, default: 0 },
  lateCount: { type: Number, default: 0 },
  leaveCount: { type: Number, default: 0 },
  markedBy: { type: String, default: 'Admin' },
  markedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

attendanceSchema.index({ instituteId: 1, batchId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ instituteId: 1, date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
