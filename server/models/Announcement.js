const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  instituteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute',
    required: true,
    index: true,
  },
  circularNumber: {
    type: String,
    trim: true,
  },
  type: {
    type: String,
    enum: ['General Announcement', 'Official Circular', 'Emergency Alert', 'Event Reminder', 'Class Notice'],
    default: 'General Announcement',
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
    enum: ['Academic', 'Exam', 'Holiday', 'Fee', 'General', 'Live', 'Emergency'],
    default: 'General',
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium',
  },
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Archived'],
    default: 'Published',
    index: true,
  },
  targetType: {
    type: String,
    enum: ['all', 'course', 'batch', 'student'],
    default: 'all',
  },
  targetRole: {
    type: String,
    enum: ['All', 'Staff Only', 'Students Only', 'Parents Only'],
    default: 'All',
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  requiresAcknowledgement: {
    type: Boolean,
    default: false,
  },
  acknowledgements: [{
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    userType: { type: String, enum: ['Student', 'Staff', 'Parent', 'Admin'], default: 'Student' },
    userName: String,
    acknowledgedAt: { type: Date, default: Date.now },
  }],
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileSize: String,
  }],
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
