const mongoose = require('mongoose');

const vaultTempChunkSchema = new mongoose.Schema(
  {
    uploadId: {
      type: String,
      required: true,
      index: true,
    },
    chunkIndex: {
      type: Number,
      required: true,
    },
    data: {
      type: Buffer,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 86400, // 24 hours TTL auto-cleanup
    },
  },
  {
    timestamps: false,
  }
);

vaultTempChunkSchema.index({ uploadId: 1, chunkIndex: 1 }, { unique: true });

module.exports = mongoose.model('VaultTempChunk', vaultTempChunkSchema);
