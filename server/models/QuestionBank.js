const mongoose = require('mongoose');

const questionBankSchema = new mongoose.Schema({
  instituteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute',
    required: true,
    index: true,
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  topic: {
    type: String,
    default: 'General',
    trim: true,
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium',
    index: true,
  },
  questionType: {
    type: String,
    enum: ['mcq', 'true_false', 'subjective'],
    default: 'mcq',
  },
  questionText: {
    type: String,
    required: true,
    trim: true,
  },
  options: [{
    text: { type: String, required: true },
    isCorrect: { type: Boolean, default: false }
  }],
  marks: {
    type: Number,
    default: 1,
    min: 1,
  },
  explanation: {
    type: String,
    default: '',
  },
  createdBy: {
    type: String,
    default: 'Faculty',
  }
}, { timestamps: true });

questionBankSchema.index({ instituteId: 1, courseId: 1, subject: 1 });

module.exports = mongoose.model('QuestionBank', questionBankSchema);
