const mongoose = require('mongoose');

const fileVaultSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    storedName: {
      type: String,
      required: true,
      unique: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
      default: 0,
    },
    mimeType: {
      type: String,
      default: 'application/octet-stream',
    },
    extension: {
      type: String,
      trim: true,
      lowercase: true,
    },
    totalChunks: {
      type: Number,
      default: 1,
    },
    chunkSize: {
      type: Number,
      default: 2 * 1024 * 1024, // 2MB default
    },
    uploadFormat: {
      type: String,
      enum: ['binary', 'base64', 'multipart'],
      default: 'binary',
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
    },
    uploadedByName: {
      type: String,
      default: 'SuperAdmin',
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    lastDownloadedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['Uploading', 'Ready', 'Failed'],
      default: 'Ready',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Helpful index for quick searching
fileVaultSchema.index({ fileName: 'text', extension: 1, createdAt: -1 });

module.exports = mongoose.model('FileVault', fileVaultSchema);
