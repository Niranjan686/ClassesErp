const mongoose = require('mongoose');

const admissionApplicationSchema = new mongoose.Schema({
  instituteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute',
    required: true,
    index: true,
  },
  applicationNo: {
    type: String,
    required: true,
    trim: true,
  },
  enquiryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enquiry',
  },
  candidateName: {
    type: String,
    required: true,
    trim: true,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    default: 'Male',
  },
  dob: {
    type: Date,
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
  fatherName: {
    type: String,
    default: '',
  },
  fatherMobileNo: {
    type: String,
    default: '',
  },
  motherName: {
    type: String,
    default: '',
  },
  address: {
    type: String,
    default: '',
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
  },
  courseName: {
    type: String,
    default: '',
  },
  appliedClass: {
    type: String,
    default: '',
  },
  academicYear: {
    type: String,
    default: '2026-2027',
  },
  documents: [{
    docType: { type: String, required: true },
    docUrl: { type: String, required: true },
    fileName: String,
    verificationStatus: {
      type: String,
      enum: ['Pending', 'Verified', 'Rejected'],
      default: 'Pending',
    },
    verificationNotes: String,
  }],
  applicationFeeStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Waived'],
    default: 'Pending',
  },
  applicationFeeAmount: {
    type: Number,
    default: 500,
  },
  applicationFeeReceiptNo: String,
  entranceTestDate: Date,
  entranceTestScore: Number,
  interviewNotes: String,
  status: {
    type: String,
    enum: ['Submitted', 'Under Review', 'Interview Scheduled', 'Approved', 'Rejected', 'Converted to Student'],
    default: 'Submitted',
    index: true,
  },
  rejectionReason: String,
  convertedStudentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
  },
  admissionDate: Date,
  reviewedBy: String,
  reviewedAt: Date,
}, { timestamps: true });

admissionApplicationSchema.index({ instituteId: 1, applicationNo: 1 }, { unique: true });
admissionApplicationSchema.index({ instituteId: 1, mobileNo: 1 });
admissionApplicationSchema.index({ instituteId: 1, status: 1 });

module.exports = mongoose.model('AdmissionApplication', admissionApplicationSchema);
