const mongoose = require('mongoose');

// 1. SaaS Plan Schema
const saasPlanSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // e.g. "Basic Tier", "Pro Growth", "Enterprise Multi-Branch"
  code: { type: String, required: true, uppercase: true, unique: true },
  monthlyPrice: { type: Number, required: true },
  annualPrice: { type: Number, required: true },
  maxStudents: { type: Number, default: 500 },
  maxStaff: { type: Number, default: 50 },
  storageLimitGB: { type: Number, default: 10 },
  enabledModules: [{ type: String }], // ['attendance', 'fees', 'lms', 'timetable', 'exams', 'transport', 'library', 'inventory', 'biometrics']
  isPublic: { type: Boolean, default: true },
  description: String,
}, { timestamps: true });

// 2. Tenant Subscription Schema
const saasSubscriptionSchema = new mongoose.Schema({
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true, unique: true, index: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'SaaSPlan', required: true },
  planCode: { type: String, required: true },
  billingCycle: { type: String, enum: ['Monthly', 'Annual'], default: 'Monthly' },
  amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Trial', 'Active', 'Grace Period', 'Expired', 'Suspended'],
    default: 'Trial',
    index: true,
  },
  startDate: { type: Date, default: Date.now },
  currentPeriodEnd: { type: Date, required: true },
  gracePeriodDays: { type: Number, default: 7 },
  platformInvoices: [{
    invoiceNo: { type: String, required: true },
    amount: { type: Number, required: true },
    billingDate: { type: Date, default: Date.now },
    paymentStatus: { type: String, enum: ['Paid', 'Unpaid', 'Failed'], default: 'Paid' },
    paymentReference: String,
    paymentMethod: { type: String, default: 'Stripe / Razorpay Platform' },
  }],
}, { timestamps: true });

const SaaSPlan = mongoose.model('SaaSPlan', saasPlanSchema);
const SaaSSubscription = mongoose.model('SaaSSubscription', saasSubscriptionSchema);

module.exports = {
  SaaSPlan,
  SaaSSubscription,
};
