const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  instituteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute',
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  userName: {
    type: String,
    default: 'System',
  },
  userRole: String,
  action: {
    type: String,
    required: true,
  },
  module: {
    type: String,
    required: true,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
  },
  ipAddress: String,
}, { timestamps: true });

auditLogSchema.index({ instituteId: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
