const mongoose = require('mongoose');

const homeworkSchema = new mongoose.Schema({
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
  title: {
    type: String,
    required: true,
    trim: true,
  },
  subject: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  dueDate: {
    type: String, // YYYY-MM-DD
    required: true,
  },
  attachmentUrl: String,
  teacherName: String,
  submissions: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    studentName: String,
    submittedAt: { type: Date, default: Date.now },
    submissionText: String,
    fileUrl: String,
    grade: String,
    feedback: String,
    status: { type: String, enum: ['Submitted', 'Graded', 'Late'], default: 'Submitted' }
  }],
}, { timestamps: true });

homeworkSchema.index({ instituteId: 1, batchId: 1, dueDate: 1 });

module.exports = mongoose.model('Homework', homeworkSchema);
