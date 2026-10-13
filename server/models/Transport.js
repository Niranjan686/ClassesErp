const mongoose = require('mongoose');

// 1. Vehicle Schema
const vehicleSchema = new mongoose.Schema({
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true, index: true },
  vehicleNumber: { type: String, required: true, uppercase: true, trim: true },
  vehicleModel: { type: String, default: 'School Bus' },
  seatingCapacity: { type: Number, required: true, default: 40 },
  driverName: { type: String, required: true },
  driverPhone: { type: String, required: true },
  driverLicenseNo: { type: String, default: '' },
  attendantName: { type: String, default: '' },
  attendantPhone: { type: String, default: '' },
  insuranceExpiryDate: Date,
  fitnessExpiryDate: Date,
  pollutionCertExpiryDate: Date,
  status: {
    type: String,
    enum: ['Active', 'Under Maintenance', 'Out of Service'],
    default: 'Active',
    index: true,
  },
  gpsDeviceId: { type: String, default: '' }, // For hardware integration
  notes: String,
}, { timestamps: true });

vehicleSchema.index({ instituteId: 1, vehicleNumber: 1 }, { unique: true });

// 2. Route & Stops Schema
const routeSchema = new mongoose.Schema({
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true, index: true },
  routeName: { type: String, required: true, trim: true },
  routeNumber: { type: String, required: true, uppercase: true, trim: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  startPoint: { type: String, default: 'Campus' },
  endPoint: { type: String, default: 'City Terminal' },
  stops: [{
    stopName: { type: String, required: true },
    pickupTime: { type: String, default: '07:30 AM' },
    dropTime: { type: String, default: '02:30 PM' },
    monthlyFee: { type: Number, default: 1200 },
  }],
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
  },
}, { timestamps: true });

routeSchema.index({ instituteId: 1, routeNumber: 1 }, { unique: true });

// 3. Student Transport Allocation Schema
const studentTransportSchema = new mongoose.Schema({
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true, index: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  studentName: { type: String, required: true },
  grno: { type: String, required: true },
  routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true, index: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  stopName: { type: String, required: true },
  pickupTime: String,
  dropTime: String,
  monthlyFee: { type: Number, default: 1200 },
  status: {
    type: String,
    enum: ['Active', 'Suspended', 'Cancelled'],
    default: 'Active',
  },
  allocatedDate: { type: Date, default: Date.now },
}, { timestamps: true });

studentTransportSchema.index({ instituteId: 1, studentId: 1 }, { unique: true });

const Vehicle = mongoose.model('Vehicle', vehicleSchema);
const Route = mongoose.model('Route', routeSchema);
const StudentTransport = mongoose.model('StudentTransport', studentTransportSchema);

module.exports = {
  Vehicle,
  Route,
  StudentTransport,
};
