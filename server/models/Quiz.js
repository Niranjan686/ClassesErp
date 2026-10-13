const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  instituteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true,
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
  },
  subject: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  durationMinutes: {
    type: Number,
    default: 30,
  },
  totalMarks: {
    type: Number,
    default: 20,
  },
  passingPercentage: {
    type: Number,
    default: 40,
  },
  questions: [{
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuestionBank' },
    questionText: { type: String, required: true },
    questionType: { type: String, default: 'mcq' },
    options: [{
      text: { type: String, required: true },
      isCorrect: { type: Boolean, default: false }
    }],
    marks: { type: Number, default: 1 },
    explanation: { type: String, default: '' }
  }],
  isPublished: {
    type: Boolean,
    default: true,
    index: true,
  },
  attempts: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    studentName: String,
    grno: String,
    submittedAt: { type: Date, default: Date.now },
    timeTakenSeconds: Number,
    score: Number,
    totalQuestions: Number,
    correctCount: Number,
    percentage: Number,
    passed: Boolean,
    answers: [{
      questionIndex: Number,
      selectedOptionIndex: Number,
      isCorrect: Boolean,
      marksAwarded: Number
    }]
  }]
}, { timestamps: true });

quizSchema.index({ instituteId: 1, courseId: 1, isPublished: 1 });
quizSchema.index({ instituteId: 1, 'attempts.studentId': 1 });

module.exports = mongoose.model('Quiz', quizSchema);
