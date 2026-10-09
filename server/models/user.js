const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  instituteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute',
    index: true,
  },
  username: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    default: '',
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    enum: ['superadmin', 'owner', 'admin', 'teacher', 'accountant', 'counsellor', 'staff', 'student'],
    default: 'admin',
    index: true,
  },
  permissions: [{
    type: String, // e.g. "students:read", "fees:create", "attendance:edit"
  }],
  assignedBatches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
  }],
  assignedSubjects: [{
    type: String,
  }],
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
  },
  avatar: {
    type: String,
    default: '',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: Date,
}, { timestamps: true });

userSchema.index({ instituteId: 1, email: 1 });
userSchema.index({ instituteId: 1, role: 1 });

module.exports = mongoose.model('User', userSchema);
