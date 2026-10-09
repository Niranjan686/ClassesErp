const mongoose = require('mongoose');

const followUpSchema = new mongoose.Schema({
  date: { type: String, required: true },
  note: { type: String, required: true },
  status: { type: String, default: 'Completed' },
  counsellorName: String,
  createdAt: { type: Date, default: Date.now },
});

const enquirySchema = new mongoose.Schema({
  instituteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute',
    required: true,
    index: true,
  },
  candidateName: {
    type: String,
    required: true,
    trim: true,
  },
  mobileNo: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    default: '',
    trim: true,
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
  },
  courseName: {
    type: String,
    default: 'General Course',
  },
  qualification: {
    type: String,
    default: '12th Standard',
  },
  preferredTiming: {
    type: String,
    default: 'Morning (08:00 AM - 12:00 PM)',
  },
  leadSource: {
    type: String,
    enum: ['Walk-in', 'Website', 'Instagram', 'Facebook', 'Referral', 'Google', 'Other', 'Walk-in Campus Visit', 'Website Enquiry', 'Social Media (Instagram/FB)', 'Friend / Student Referral'],
    default: 'Walk-in',
  },
  status: {
    type: String,
    enum: ['New', 'Contacted', 'Demo Scheduled', 'Demo Attended', 'Negotiation', 'Converted', 'Lost', 'Pending', 'Follow-up Required', 'Admission Taken'],
    default: 'New',
    index: true,
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium',
  },
  expectedJoiningDate: String,
  lostReason: String,
  followUpDate: {
    type: String,
    default: () => new Date().toISOString().split('T')[0],
  },
  followUpNotes: {
    type: String,
    default: 'New lead inquiry registered.',
  },
  followUps: [followUpSchema],
  counselorName: {
    type: String,
    default: 'Admission Counselor',
  },
  assignedCounsellorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  // Demo Lecture Details
  isDemoRequested: {
    type: Boolean,
    default: false,
  },
  demoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Demo',
  },
  demoDate: String,
  demoTiming: String,
  demoFaculty: String,
  demoStatus: {
    type: String,
    default: 'None',
  },
  demoFeedback: String,

  // Conversion Link
  convertedStudentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
  },
  admissionDate: Date,
}, { timestamps: true });

enquirySchema.index({ instituteId: 1, status: 1 });
enquirySchema.index({ instituteId: 1, mobileNo: 1 });

module.exports = mongoose.model('Enquiry', enquirySchema);
