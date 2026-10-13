const mongoose = require('mongoose');

// 1. Visitor Entry Schema
const visitorSchema = new mongoose.Schema({
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true, index: true },
  visitorName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  purpose: { type: String, required: true },
  hostStaffName: { type: String, required: true },
  hostStaffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  idProofType: { type: String, enum: ['Aadhaar', 'Driving License', 'PAN Card', 'Voter ID', 'Other'], default: 'Aadhaar' },
  idProofNumber: { type: String, default: '' },
  badgeNumber: { type: String, default: 'V-01' },
  inTime: { type: Date, default: Date.now },
  outTime: Date,
  status: { type: String, enum: ['Checked In', 'Checked Out'], default: 'Checked In', index: true },
  securityOfficerName: { type: String, default: 'Main Gate Guard' },
  remarks: String,
}, { timestamps: true });

visitorSchema.index({ instituteId: 1, status: 1 });

// 2. Student Gate Pass Schema
const gatePassSchema = new mongoose.Schema({
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true, index: true },
  gatePassNo: { type: String, required: true, uppercase: true, trim: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  studentName: { type: String, required: true },
  grno: { type: String, required: true },
  batchName: String,
  reason: { type: String, required: true },
  pickupPersonName: { type: String, required: true },
  pickupPersonRelation: { type: String, default: 'Parent / Guardian' },
  pickupPersonPhone: { type: String, required: true },
  approvedBy: { type: String, default: 'Principal' },
  status: {
    type: String,
    enum: ['Approved', 'Exited', 'Cancelled'],
    default: 'Approved',
    index: true,
  },
  issuedAt: { type: Date, default: Date.now },
  actualExitTime: Date,
  gateGuardName: String,
}, { timestamps: true });

gatePassSchema.index({ instituteId: 1, gatePassNo: 1 }, { unique: true });

const Visitor = mongoose.model('Visitor', visitorSchema);
const GatePass = mongoose.model('GatePass', gatePassSchema);

module.exports = {
  Visitor,
  GatePass,
};
