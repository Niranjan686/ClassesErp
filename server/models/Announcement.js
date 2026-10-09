const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
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
  message: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['Academic', 'Exam', 'Holiday', 'Fee', 'General', 'Live'],
    default: 'General',
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium',
  },
  targetType: {
    type: String,
    enum: ['all', 'course', 'batch', 'student'],
    default: 'all',
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  isPinned: {
    type: Boolean,
    default: false,
  },
  authorName: {
    type: String,
    default: 'Administration',
  },
  expiresAt: Date,
}, { timestamps: true });

announcementSchema.index({ instituteId: 1, createdAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);
