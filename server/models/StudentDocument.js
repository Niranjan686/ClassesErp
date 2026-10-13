const mongoose = require('mongoose');

const studentDocumentSchema = new mongoose.Schema({
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true, index: true },
  entityType: { type: String, enum: ['Student', 'Staff'], default: 'Student', index: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', index: true },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', index: true },
  personName: { type: String, required: true },
  identifier: { type: String, default: '' }, // GR No or Staff ID
  documentCategory: {
    type: String,
    enum: [
      'Identity Proof (Aadhaar / Passport)',
      'Birth Certificate',
      'Previous Academic Marksheet',
      'Transfer Certificate (TC)',
      'Medical & Vaccination Record',
      'Parental Consent Form',
      'Fee Concession Document',
      'Other Official Document'
    ],
    required: true,
    index: true,
  },
  documentTitle: { type: String, required: true, trim: true },
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileSize: String,
  mimeType: { type: String, default: 'application/pdf' },
  expiryDate: Date,
  verificationStatus: {
    type: String,
    enum: ['Pending Review', 'Verified', 'Rejected'],
    default: 'Pending Review',
    index: true,
  },
  verificationNotes: String,
  verifiedBy: String,
  verifiedAt: Date,
  downloadCount: { type: Number, default: 0 },
}, { timestamps: true });

studentDocumentSchema.index({ instituteId: 1, studentId: 1, documentCategory: 1 });

module.exports = mongoose.model('StudentDocument', studentDocumentSchema);
