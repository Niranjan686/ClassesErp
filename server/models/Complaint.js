const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  instituteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute',
    required: true,
    index: true,
  },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  studentName: { type: String, required: true },
  grno: { type: String, required: true },
  courseName: { type: String, default: '' },
  batchName: { type: String, default: '' },
  category: {
    type: String,
    enum: ['Faculty & Teaching', 'PC / Lab Hardware', 'Course Material / Software', 'Batch Timing / Scheduling', 'Fees & Receipts', 'Cleanliness & Facility', 'Other'],
    default: 'Faculty & Teaching'
  },
  subject: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
    default: 'Open',
    index: true,
  },
  adminResponse: { type: String, default: '' },
  resolvedBy: { type: String, default: '' },
  resolvedAt: { type: Date }
}, { timestamps: true });

complaintSchema.index({ instituteId: 1, status: 1 });

module.exports = mongoose.model('Complaint', complaintSchema);
