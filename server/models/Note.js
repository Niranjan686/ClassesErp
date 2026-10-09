const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
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
  chapter: {
    type: String,
    required: true,
    trim: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  fileType: {
    type: String,
    enum: ['pdf', 'image', 'video', 'doc', 'link'],
    default: 'pdf',
  },
  fileUrl: {
    type: String,
    required: true,
  },
  fileSize: {
    type: String,
    default: '2.4 MB',
  },
  batches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
  }],
  allowDownload: {
    type: Boolean,
    default: true,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  uploadedByName: String,
  publishedAt: {
    type: Date,
    default: Date.now,
  },
  viewCount: {
    type: Number,
    default: 0,
  },
  views: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    viewedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

noteSchema.index({ instituteId: 1, courseId: 1, subject: 1 });

module.exports = mongoose.model('Note', noteSchema);
