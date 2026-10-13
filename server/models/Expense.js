const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true, index: true },
  voucherNo: { type: String, required: true, uppercase: true, trim: true },
  title: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: [
      'Staff Salaries & Wages',
      'Campus Rent & Building',
      'Electricity, Water & Utilities',
      'Lab, IT & Software Subscriptions',
      'Stationery & Office Supplies',
      'School Events & Activities',
      'Marketing & Advertising',
      'Repairs & Campus Maintenance',
      'Transport Fuel & Bus Maintenance',
      'Other Miscellaneous Expense'
    ],
    required: true,
    index: true,
  },
  amount: { type: Number, required: true, min: 1 },
  expenseDate: { type: String, required: true }, // YYYY-MM-DD
  payeeName: { type: String, required: true },
  invoiceNumber: { type: String, default: '' },
  paymentMode: {
    type: String,
    enum: ['Bank Transfer', 'Cheque', 'Cash', 'UPI'],
    default: 'Bank Transfer',
  },
  paymentStatus: {
    type: String,
    enum: ['Pending Approval', 'Approved', 'Paid', 'Rejected'],
    default: 'Paid',
    index: true,
  },
  approvedBy: { type: String, default: 'Finance Officer' },
  receiptFileUrl: String,
  remarks: String,
}, { timestamps: true });

expenseSchema.index({ instituteId: 1, voucherNo: 1 }, { unique: true });
expenseSchema.index({ instituteId: 1, expenseDate: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
