const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  instituteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute',
    required: true,
    index: true,
  },
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true,
    index: true,
  },
  staffName: { type: String, required: true },
  staffCode: { type: String, default: '' },
  designation: { type: String, default: 'Faculty' },
  month: { type: String, required: true }, // Format: YYYY-MM
  baseSalary: { type: Number, required: true, default: 0 },
  totalWorkingDays: { type: Number, default: 26 },
  presentDays: { type: Number, default: 26 },
  leaveDays: { type: Number, default: 0 },
  dailyRate: { type: Number, default: 0 },
  allowances: [{
    title: { type: String, default: 'Bonus / Allowance' },
    amount: { type: Number, default: 0 }
  }],
  deductions: [{
    title: { type: String, default: 'Leave Deduction' },
    amount: { type: Number, default: 0 }
  }],
  grossPay: { type: Number, default: 0 },
  netPay: { type: Number, default: 0 },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Processed', 'Paid'],
    default: 'Pending',
    index: true,
  },
  paymentDate: { type: Date },
  paymentMode: {
    type: String,
    enum: ['Bank Transfer', 'Cheque', 'Cash', 'UPI'],
    default: 'Bank Transfer'
  },
  transactionReference: { type: String, default: '' },
  remarks: { type: String, default: '' }
}, { timestamps: true });

payrollSchema.index({ instituteId: 1, staffId: 1, month: 1 }, { unique: true });
payrollSchema.index({ instituteId: 1, month: 1 });

module.exports = mongoose.model('Payroll', payrollSchema);
