const mongoose = require('mongoose');

const feeTransactionSchema = new mongoose.Schema({
  instituteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute',
    required: true,
    index: true,
  },
  receiptNo: {
    type: String,
    required: true,
    trim: true,
  },
  invoiceNo: {
    type: String,
    default: '',
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true,
  },
  studentName: {
    type: String,
    required: true,
  },
  grno: {
    type: String,
    default: '',
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
  },
  courseName: String,
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
  },
  batchName: String,
  amountPaid: {
    type: Number,
    required: true,
    min: 0,
  },
  feeComponents: [{
    name: { type: String, default: 'Tuition Fee' },
    amount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
  }],
  paymentMode: {
    type: String,
    enum: ['Cash', 'UPI', 'Card', 'Cheque', 'NetBanking', 'Razorpay', 'UPI / GPay / PhonePe', 'Bank Transfer (NEFT/IMPS)', 'Credit / Debit Card'],
    default: 'UPI',
  },
  transactionRef: {
    type: String,
    default: '',
  },
  razorpayPaymentId: String,
  razorpayOrderId: String,
  razorpaySignature: String,
  installmentNo: {
    type: Number,
    default: 1,
  },
  discount: {
    type: Number,
    default: 0,
  },
  discountReason: String,
  remainingBalance: {
    type: Number,
    default: 0,
  },
  paymentDate: {
    type: String,
    default: () => new Date().toISOString().split('T')[0],
  },
  collectedBy: {
    type: String,
    default: 'Admin',
  },
  status: {
    type: String,
    enum: ['Paid', 'Pending', 'Partial', 'Refunded'],
    default: 'Paid',
  },
  remarks: {
    type: String,
    default: 'Fee installment payment received',
  },
}, { timestamps: true });

feeTransactionSchema.index({ instituteId: 1, receiptNo: 1 }, { unique: true });
feeTransactionSchema.index({ instituteId: 1, studentId: 1 });
feeTransactionSchema.index({ instituteId: 1, paymentDate: 1 });

module.exports = mongoose.model('FeeTransaction', feeTransactionSchema);
