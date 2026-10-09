const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  instituteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute',
    required: true,
    index: true,
  },
  title: { type: String, required: true, trim: true },
  examType: {
    type: String,
    enum: ['Unit Test', 'Practical Assessment', 'Mid-Term Exam', 'Final Certification Exam', 'Weekly Quiz', 'Mock Test'],
    default: 'Unit Test'
  },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  courseName: { type: String },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true, index: true },
  batchName: { type: String },
  subject: { type: String, default: 'Core Theory & Practical' },
  examDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
  maxTheoryMarks: { type: Number, default: 70 },
  maxPracticalMarks: { type: Number, default: 30 },
  totalMaxMarks: { type: Number, default: 100 },
  passingMarks: { type: Number, default: 40 },
  evaluatorName: { type: String, default: 'Senior Faculty' },
  isPublished: { type: Boolean, default: false },
  description: { type: String, default: '' }
}, { timestamps: true });

examSchema.index({ instituteId: 1, batchId: 1, examDate: 1 });

module.exports = mongoose.model('Exam', examSchema);
