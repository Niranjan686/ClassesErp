const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema({
  instituteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute',
    required: true,
    index: true,
  },
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  studentName: { type: String, required: true },
  grno: { type: String, required: true },
  rollno: { type: String, default: '' },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
  attendanceStatus: {
    type: String,
    enum: ['Present', 'Absent', 'Exempted'],
    default: 'Present'
  },
  theoryMarksObtained: { type: Number, default: 0 },
  practicalMarksObtained: { type: Number, default: 0 },
  totalMarksObtained: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  grade: {
    type: String,
    enum: ['A+ (Distinction)', 'A (First Class)', 'B (Second Class)', 'C (Pass Class)', 'Fail', 'Absent'],
    default: 'Fail'
  },
  resultStatus: {
    type: String,
    enum: ['Passed', 'Failed', 'Absent'],
    default: 'Failed'
  },
  rank: { type: Number, default: 0 },
  remarks: { type: String, default: 'Good performance' }
}, { timestamps: true });

marksSchema.index({ instituteId: 1, examId: 1, studentId: 1 }, { unique: true });
marksSchema.index({ instituteId: 1, studentId: 1 });

module.exports = mongoose.model('Marks', marksSchema);
