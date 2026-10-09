const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  instituteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute',
    required: true,
    index: true,
  },
  applicantId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Student or Staff _id
  applicantType: { type: String, enum: ['Student', 'Staff'], required: true },
  applicantName: { type: String, required: true },
  identifier: { type: String, default: '' }, // Student ID or GR No
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
  leaveType: {
    type: String,
    enum: ['Sick Leave', 'Medical Emergency', 'College Exam', 'Personal / Family', 'Vacation', 'Other'],
    default: 'Personal / Family'
  },
  startDate: { type: String, required: true }, // YYYY-MM-DD
  endDate: { type: String, required: true }, // YYYY-MM-DD
  totalDays: { type: Number, default: 1 },
  reason: { type: String, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
    index: true,
  },
  adminRemarks: { type: String, default: '' },
  reviewedBy: { type: String, default: '' },
  reviewedAt: { type: Date }
}, { timestamps: true });

leaveSchema.index({ instituteId: 1, status: 1 });
leaveSchema.index({ instituteId: 1, applicantId: 1 });

module.exports = mongoose.model('Leave', leaveSchema);
