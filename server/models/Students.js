const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  instituteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute',
    required: true,
    index: true,
  },
  studentId: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  grno: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
  },
  rollno: {
    type: Number,
    default: 1,
  },
  fname: {
    type: String,
    required: true,
    trim: true,
  },
  mname: {
    type: String,
    default: '',
    trim: true,
  },
  lname: {
    type: String,
    required: true,
    trim: true,
  },
  dob: Date,
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    default: 'Male',
  },

  // Contact Info
  mobileNo: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    default: '',
    trim: true,
    lowercase: true,
  },
  address: {
    type: String,
    default: '',
    trim: true,
  },
  adharno: {
    type: String,
    default: '',
    trim: true,
  },

  // Academic Background
  school: {
    type: String,
    default: '',
  },
  standard: {
    type: String,
    default: '',
  },
  board: {
    type: String,
    default: 'CBSE',
  },

  // Parent Info
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
  motherMobileNo: {
    type: String,
    default: '',
  },
  parentEmail: {
    type: String,
    default: '',
  },
  parentPin: {
    type: String,
    default: '1234', // 4 digit PIN for Parent View Mode
  },

  // Academic & Batch Details
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
  },
  academicYear: {
    type: String,
    default: '2026-2027',
  },
  admissionDate: {
    type: Date,
    default: Date.now,
  },
  referralSource: {
    type: String,
    default: 'Direct',
  },
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enquiry',
  },

  // Fees Details
  totalFees: {
    type: Number,
    default: 0,
  },
  paidFees: {
    type: Number,
    default: 0,
  },
  balanceFees: {
    type: Number,
    default: 0,
  },
  discountAmount: {
    type: Number,
    default: 0,
  },
  discountReason: {
    type: String,
    default: '',
  },

  // Smart ID & Identification
  rfid: {
    type: String,
    default: '',
    trim: true,
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'N/A'],
    default: 'B+',
  },
  emergencyContact: {
    type: String,
    default: '',
  },
  photo: {
    type: String,
    default: '',
  },

  // Portal Credentials
  password: {
    type: String,
    default: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // Demo@123
  },
  firstLoginChanged: {
    type: Boolean,
    default: false,
  },

  // Status & Custom Documents
  status: {
    type: String,
    enum: ['Active', 'Completed', 'Dropped', 'Inactive'],
    default: 'Active',
  },
  documents: [{
    docType: String,
    name: String,
    fileUrl: String,
    uploadedAt: { type: Date, default: Date.now },
  }],
  customFields: {
    type: Map,
    of: String,
    default: {},
  },
  qrCodeToken: {
    type: String,
    default: () => `STU-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
  }
}, { timestamps: true });

studentSchema.index({ instituteId: 1, studentId: 1 }, { unique: true });
studentSchema.index({ instituteId: 1, mobileNo: 1 });
studentSchema.index({ instituteId: 1, batchId: 1, status: 1 });

studentSchema.pre('save', function(next) {
  if (this.totalFees !== undefined && this.paidFees !== undefined) {
    this.balanceFees = Math.max(0, this.totalFees - (this.paidFees + (this.discountAmount || 0)));
  }
  next();
});

module.exports = mongoose.model('Student', studentSchema);
