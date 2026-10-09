const mongoose = require('mongoose');

const instituteSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  subdomain: {
    type: String,
    trim: true,
    lowercase: true,
  },
  logo: {
    type: String,
    default: '',
  },
  brandColor: {
    type: String,
    default: '#2563eb',
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
  },
  phone: {
    type: String,
    default: '',
  },
  email: {
    type: String,
    default: '',
  },
  academicYear: {
    type: String,
    default: '2026-2027',
  },
  workingDays: {
    type: [String],
    default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  },
  timings: {
    open: { type: String, default: '07:00' },
    close: { type: String, default: '21:00' },
  },
  currency: {
    type: String,
    default: 'INR',
  },
  currencySymbol: {
    type: String,
    default: '₹',
  },
  gstNumber: {
    type: String,
    default: '',
  },
  receiptPrefix: {
    type: String,
    default: 'REC',
  },
  plan: {
    type: String,
    enum: ['Free', 'Basic', 'Pro', 'Enterprise'],
    default: 'Pro',
  },
  limits: {
    maxStudents: { type: Number, default: 1000 },
    maxStorageGB: { type: Number, default: 50 },
    liveClassesEnabled: { type: Boolean, default: true },
    smsQuota: { type: Number, default: 5000 },
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'trial'],
    default: 'active',
  },
  subscriptionExpiry: {
    type: Date,
    default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  },
}, { timestamps: true });

instituteSchema.index({ code: 1 });
instituteSchema.index({ status: 1 });

module.exports = mongoose.model('Institute', instituteSchema);
