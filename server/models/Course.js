const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  instituteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute',
    required: true,
    index: true,
  },
  courseName: {
    type: String,
    required: true,
    trim: true,
  },
  courseCode: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
  },
  category: {
    type: String,
    enum: ['JEE Main & Advanced', 'NEET Medical', 'Class 10 / 12 Board', 'Foundation 8-10', 'Computer Science & Coding', 'Commerce & CA Foundation', 'Spoken English', 'Professional Skills'],
    default: 'Class 10 / 12 Board',
  },
  duration: {
    type: String,
    default: '1 Year',
  },
  durationMonths: {
    type: Number,
    default: 12,
  },
  totalFees: {
    type: Number,
    required: true,
    min: 0,
  },
  description: {
    type: String,
    default: '',
  },
  thumbnail: {
    type: String,
    default: '',
  },
  subjects: [{
    name: { type: String, required: true },
    code: String,
    teacherName: String,
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  }],
  syllabus: [{
    chapterNo: Number,
    chapterTitle: String,
    subject: String,
    topicsCount: Number,
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

courseSchema.index({ instituteId: 1, courseCode: 1 }, { unique: true });
courseSchema.index({ instituteId: 1, category: 1 });

module.exports = mongoose.model('Course', courseSchema);
