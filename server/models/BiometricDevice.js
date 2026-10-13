const mongoose = require('mongoose');

// 1. Biometric / RFID Hardware Device Registry
const biometricDeviceSchema = new mongoose.Schema({
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true, index: true },
  deviceId: { type: String, required: true, uppercase: true, trim: true },
  deviceName: { type: String, required: true, trim: true },
  deviceModel: { type: String, default: 'ClassTech Biometric Bio-01' },
  deviceType: {
    type: String,
    enum: ['RFID Card Reader', 'Fingerprint Terminal', 'Face Recognition Terminal', 'Hybrid Biometric'],
    default: 'RFID Card Reader',
  },
  location: { type: String, default: 'Main School Gate' },
  ipAddress: { type: String, default: '192.168.1.100' },
  port: { type: Number, default: 4370 },
  apiKey: { type: String, default: () => Math.random().toString(36).substring(2, 15) },
  status: { type: String, enum: ['Online', 'Offline', 'Error'], default: 'Online' },
  lastHeartbeat: { type: Date, default: Date.now },
  duplicatePunchThresholdMinutes: { type: Number, default: 5 },
}, { timestamps: true });

biometricDeviceSchema.index({ instituteId: 1, deviceId: 1 }, { unique: true });

// 2. Raw Device Ingestion Event Log
const rawDeviceEventSchema = new mongoose.Schema({
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true, index: true },
  deviceId: { type: String, required: true, index: true },
  identifier: { type: String, required: true, trim: true, index: true },
  eventTimestamp: { type: Date, required: true, default: Date.now },
  punchType: { type: String, enum: ['IN', 'OUT', 'CHECK'], default: 'IN' },
  processingStatus: {
    type: String,
    enum: ['Pending', 'Processed', 'Duplicate Ignored', 'Unmatched Identifier', 'Error'],
    default: 'Pending',
    index: true,
  },
  reconciledPersonType: { type: String, enum: ['Student', 'Staff', 'Unknown'] },
  reconciledPersonId: mongoose.Schema.Types.ObjectId,
  reconciledPersonName: String,
  errorMessage: String,
}, { timestamps: true });

rawDeviceEventSchema.index({ instituteId: 1, identifier: 1, eventTimestamp: -1 });

const BiometricDevice = mongoose.model('BiometricDevice', biometricDeviceSchema);
const RawDeviceEvent = mongoose.model('RawDeviceEvent', rawDeviceEventSchema);

module.exports = {
  BiometricDevice,
  RawDeviceEvent,
};
