const mongoose = require('mongoose');

const alumniSchema = new mongoose.Schema({
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true, index: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  name: { type: String, required: true, trim: true },
  grno: { type: String, default: '' },
  graduationYear: { type: Number, required: true, index: true },
  courseCompleted: { type: String, required: true },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  currentOrganization: { type: String, default: '' },
  designation: { type: String, default: '' },
  city: { type: String, default: 'Mumbai' },
  linkedInUrl: { type: String, default: '' },
  isProfilePublic: { type: Boolean, default: false }, // Privacy: hidden from public directory by default
  notes: String,
}, { timestamps: true });

alumniSchema.index({ instituteId: 1, graduationYear: 1 });

module.exports = mongoose.model('Alumni', alumniSchema);
