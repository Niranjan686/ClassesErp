const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  instituteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute',
    required: true,
    index: true,
  },
  certificateNo: {
    type: String,
    required: true,
    trim: true,
  },
  certificateType: {
    type: String,
    enum: [
      'Bonafide Certificate',
      'Transfer Certificate (TC)',
      'Study Certificate',
      'Character Certificate',
      'Admission Confirmation',
      'Course Completion Certificate',
      'Other'
    ],
    required: true,
    index: true,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true,
  },
  studentName: { type: String, required: true },
  grno: { type: String, required: true },
  fatherName: { type: String, default: '' },
  courseName: { type: String, default: '' },
  batchName: { type: String, default: '' },
  academicYear: { type: String, default: '2026-2027' },
  purpose: { type: String, required: true },
  issueDate: { type: Date, default: Date.now },
  signatoryName: { type: String, default: 'Principal / Authorized Officer' },
  signatoryDesignation: { type: String, default: 'Head of Institution' },
  status: {
    type: String,
    enum: ['Issued', 'Cancelled'],
    default: 'Issued',
    index: true,
  },
  cancellationReason: { type: String, default: '' },
  cancelledBy: { type: String, default: '' },
  cancelledAt: { type: Date },
  issuedBy: { type: String, default: 'Registrar Office' },
  contentBody: { type: String, default: '' },
}, { timestamps: true });

certificateSchema.index({ instituteId: 1, certificateNo: 1 }, { unique: true });
certificateSchema.index({ instituteId: 1, studentId: 1 });

module.exports = mongoose.model('Certificate', certificateSchema);
