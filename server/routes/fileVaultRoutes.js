const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const os = require('os');
const stream = require('stream');
const multer = require('multer');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const FileVault = require('../models/FileVault');
const VaultTempChunk = require('../models/VaultTempChunk');
const { authenticateAdmin, authorizeRoles, JWT_SECRET } = require('../middleware/auth');

// Storage Directories
const UPLOADS_ROOT = process.env.VERCEL
  ? path.join(os.tmpdir(), 'classtech_vault')
  : path.join(__dirname, '../uploads');
const VAULT_DIR = path.join(UPLOADS_ROOT, 'vault');
const TEMP_CHUNKS_DIR = path.join(UPLOADS_ROOT, 'temp_chunks');

// Ensure base directories exist if writable
try {
  if (!fs.existsSync(VAULT_DIR)) {
    fs.mkdirSync(VAULT_DIR, { recursive: true });
  }
  if (!fs.existsSync(TEMP_CHUNKS_DIR)) {
    fs.mkdirSync(TEMP_CHUNKS_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('Vault directory initialization notice:', e.message);
}

// Multer memory storage for chunk buffers (up to 15MB per chunk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

// GridFS Bucket accessor
let gridfsBucket = null;
function getGridFSBucket() {
  if (!gridfsBucket && mongoose.connection.readyState === 1 && mongoose.connection.db) {
    gridfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'vault_files',
    });
  }
  return gridfsBucket;
}

// Helper to authenticate token from Bearer header or query param
const verifySuperAdminOrToken = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication token required.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'superadmin' && decoded.role !== 'owner') {
      return res.status(403).json({ success: false, message: 'SuperAdmin privilege required.' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.', error: err.message });
  }
};

// Helper: Resolve existing file on disk across multiple candidate paths
function resolveLocalPath(file) {
  if (!file) return null;
  const candidates = [
    file.filePath,
    path.join(VAULT_DIR, file.storedName),
    path.join(__dirname, '../uploads/vault', file.storedName),
    path.join(os.tmpdir(), 'classtech_vault', 'vault', file.storedName),
  ];
  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

/**
 * @route   POST /api/vault/chunk-upload
 * @desc    Receive a single file chunk. Chunks are buffered both locally and in MongoDB
 *          so multi-instance and serverless environments stay 100% in sync.
 * @access  SuperAdmin Only
 */
router.post(
  '/chunk-upload',
  authenticateAdmin,
  authorizeRoles('superadmin'),
  upload.single('chunkFile'),
  async (req, res) => {
    try {
      const {
        uploadId,
        fileName,
        fileSize,
        chunkIndex,
        totalChunks,
        chunkBase64,
        format = 'binary',
        description = '',
      } = req.body;

      if (!uploadId || !fileName || chunkIndex === undefined || !totalChunks) {
        return res.status(400).json({
          success: false,
          message: 'Missing required chunk metadata: uploadId, fileName, chunkIndex, totalChunks.',
        });
      }

      const index = parseInt(chunkIndex, 10);
      const total = parseInt(totalChunks, 10);
      const totalSize = parseInt(fileSize, 10) || 0;

      // Extract chunk buffer
      let chunkBuffer = null;
      if (req.file && req.file.buffer) {
        chunkBuffer = req.file.buffer;
      } else if (chunkBase64) {
        const cleanBase64 = chunkBase64.replace(/^data:.*?;base64,/, '');
        chunkBuffer = Buffer.from(cleanBase64, 'base64');
      }

      if (!chunkBuffer || chunkBuffer.length === 0) {
        return res.status(400).json({
          success: false,
          message: `Chunk ${index} contains no data. Ensure chunkFile or chunkBase64 is provided.`,
        });
      }

      // 1. Persist chunk into MongoDB buffer (enables cross-container serverless synchronization)
      await VaultTempChunk.findOneAndUpdate(
        { uploadId, chunkIndex: index },
        {
          uploadId,
          chunkIndex: index,
          data: chunkBuffer,
          size: chunkBuffer.length,
          createdAt: new Date(),
        },
        { upsert: true, new: true }
      );

      // 2. Also write to local disk directory if writable
      const sessionDir = path.join(TEMP_CHUNKS_DIR, uploadId);
      try {
        if (!fs.existsSync(sessionDir)) {
          fs.mkdirSync(sessionDir, { recursive: true });
        }
        const chunkFilePath = path.join(sessionDir, `chunk_${index}`);
        await fs.promises.writeFile(chunkFilePath, chunkBuffer);
      } catch (diskErr) {
        // Disk write failure on read-only environments is gracefully absorbed by MongoDB buffer
      }

      // Check if this was the last chunk
      if (index === total - 1) {
        // Verify all chunks from 0 to total - 1 exist in MongoDB or on disk
        const storedChunks = await VaultTempChunk.find({ uploadId }).sort({ chunkIndex: 1 });
        if (storedChunks.length < total) {
          return res.json({
            success: true,
            isComplete: false,
            message: `Chunk ${index + 1}/${total} stored. Waiting for remaining chunks.`,
            chunkIndex: index,
            totalChunks: total,
            chunksReceived: storedChunks.length,
          });
        }

        // Sanitize filename & generate stored name
        const ext = path.extname(fileName).toLowerCase();
        const safeBase = path.basename(fileName, ext).replace(/[^a-zA-Z0-9_\-\.]/g, '_');
        const storedName = `vault_${Date.now()}_${safeBase}${ext}`;
        const finalFilePath = path.join(VAULT_DIR, storedName);

        // Upload to MongoDB GridFS for permanent, serverless-proof cloud persistence
        const bucket = getGridFSBucket();
        let gridfsId = null;

        if (bucket) {
          const gridUploadStream = bucket.openUploadStream(storedName, {
            contentType: req.file?.mimetype || 'application/octet-stream',
            metadata: {
              fileName,
              fileSize: totalSize,
              uploadedBy: req.user?.id,
              description,
            },
          });
          gridfsId = gridUploadStream.id;

          // Write all chunks in sequential order into GridFS
          for (let i = 0; i < total; i++) {
            const chunk = storedChunks[i];
            gridUploadStream.write(chunk.data);
          }
          gridUploadStream.end();

          await new Promise((resolve, reject) => {
            gridUploadStream.on('finish', resolve);
            gridUploadStream.on('error', reject);
          });
        }

        // Also save to local disk if directory is writable (for ultra-fast zero-latency local caching)
        let localDiskSaved = false;
        try {
          const writeStream = fs.createWriteStream(finalFilePath);
          for (let i = 0; i < total; i++) {
            writeStream.write(storedChunks[i].data);
          }
          writeStream.end();
          await new Promise((resolve, reject) => {
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
          });
          localDiskSaved = true;
        } catch (diskWriteErr) {
          console.warn('Local disk write skipped in serverless environment:', diskWriteErr.message);
        }

        // Clean up temporary chunks from MongoDB and disk
        try {
          await VaultTempChunk.deleteMany({ uploadId });
          if (fs.existsSync(sessionDir)) {
            await fs.promises.rm(sessionDir, { recursive: true, force: true });
          }
        } catch (cleanErr) {
          console.error('Error cleaning temporary chunks:', cleanErr);
        }

        // Create Mongoose record in FileVault
        const fileRecord = await FileVault.create({
          fileName,
          storedName,
          filePath: localDiskSaved ? finalFilePath : `gridfs://${storedName}`,
          fileSize: totalSize || (localDiskSaved ? (await fs.promises.stat(finalFilePath)).size : 0),
          mimeType: req.file?.mimetype || 'application/octet-stream',
          extension: ext || '.bin',
          totalChunks: total,
          chunkSize: chunkBuffer.length,
          uploadFormat: chunkBase64 ? 'base64' : 'binary',
          uploadedBy: req.user?.id,
          uploadedByName: req.user?.username || req.user?.name || 'SuperAdmin',
          gridfsId,
          storageType: bucket ? 'gridfs' : 'disk',
          status: 'Ready',
          description,
        });

        return res.status(201).json({
          success: true,
          isComplete: true,
          message: `File '${fileName}' successfully stored permanently in Vault!`,
          file: fileRecord,
        });
      }

      // Intermediate chunk stored successfully
      return res.json({
        success: true,
        isComplete: false,
        chunkIndex: index,
        totalChunks: total,
        uploadedBytes: chunkBuffer.length,
        message: `Chunk ${index + 1}/${total} received successfully.`,
      });
    } catch (err) {
      console.error('Chunk Upload Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to process file chunk.',
        error: err.message,
      });
    }
  }
);

/**
 * @route   GET /api/vault/files
 * @desc    List all files in the SuperAdmin Vault with search, status, & stats
 * @access  SuperAdmin Only
 */
router.get('/files', authenticateAdmin, authorizeRoles('superadmin'), async (req, res) => {
  try {
    const { search, extension, page = 1, limit = 50 } = req.query;
    const query = {};

    if (search) {
      query.fileName = { $regex: search, $options: 'i' };
    }
    if (extension) {
      query.extension = extension.toLowerCase();
    }

    const total = await FileVault.countDocuments(query);
    const files = await FileVault.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit, 10));

    // Calculate vault storage stats
    const statsAgg = await FileVault.aggregate([
      {
        $group: {
          _id: null,
          totalBytes: { $sum: '$fileSize' },
          totalDownloads: { $sum: '$downloadCount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const stats = statsAgg[0] || { totalBytes: 0, totalDownloads: 0, count: 0 };

    res.json({
      success: true,
      files,
      pagination: {
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / limit),
      },
      stats: {
        totalFiles: stats.count,
        totalStorageBytes: stats.totalBytes,
        totalDownloads: stats.totalDownloads,
      },
    });
  } catch (err) {
    console.error('List Vault Files Error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch vault files.', error: err.message });
  }
});

/**
 * @route   GET /api/vault/download/:id
 * @desc    Stream download file of ANY size using multi-tier storage:
 *          1. Local Disk Cache (fastest)
 *          2. MongoDB GridFS Cloud Storage (permanent across all serverless restarts & environments)
 * @access  SuperAdmin Only (Accepts Bearer header or ?token=)
 */
router.get('/download/:id', verifySuperAdminOrToken, async (req, res) => {
  try {
    const file = await FileVault.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ success: false, message: 'Requested file not found in Vault.' });
    }

    // Tier 1: Check if physical file exists on local disk
    const localPath = resolveLocalPath(file);
    if (localPath) {
      const stat = await fs.promises.stat(localPath);

      res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
      res.setHeader('Content-Length', stat.size);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.fileName)}"`);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'no-cache');

      const readStream = fs.createReadStream(localPath, { highWaterMark: 64 * 1024 });
      readStream.pipe(res);

      readStream.on('error', (streamErr) => {
        console.error('File Streaming Error:', streamErr);
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: 'Error streaming file from disk.' });
        }
      });

      // Update download metrics
      FileVault.findByIdAndUpdate(file._id, {
        $inc: { downloadCount: 1 },
        lastDownloadedAt: new Date(),
      }).exec().catch(() => {});
      return;
    }

    // Tier 2: Check MongoDB GridFS Cloud Storage
    const bucket = getGridFSBucket();
    if (bucket) {
      let gridFile = null;

      // Look up by gridfsId first
      if (file.gridfsId) {
        const found = await bucket.find({ _id: new mongoose.Types.ObjectId(file.gridfsId) }).toArray();
        if (found.length > 0) gridFile = found[0];
      }

      // Fallback: look up by storedName
      if (!gridFile && file.storedName) {
        const found = await bucket.find({ filename: file.storedName }).toArray();
        if (found.length > 0) gridFile = found[0];
      }

      if (gridFile) {
        res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
        res.setHeader('Content-Length', gridFile.length);
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.fileName)}"`);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'no-cache');

        const downloadStream = bucket.openDownloadStream(gridFile._id);
        downloadStream.pipe(res);

        downloadStream.on('error', (gridErr) => {
          console.error('GridFS Streaming Error:', gridErr);
          if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Error streaming file from cloud storage.' });
          }
        });

        // In background: Cache to local disk if directory is writable
        try {
          if (!fs.existsSync(VAULT_DIR)) fs.mkdirSync(VAULT_DIR, { recursive: true });
          const cachePath = path.join(VAULT_DIR, file.storedName);
          const cacheStream = fs.createWriteStream(cachePath);
          bucket.openDownloadStream(gridFile._id).pipe(cacheStream);
        } catch (cacheErr) {
          // Non-critical cache error
        }

        // Update download metrics
        FileVault.findByIdAndUpdate(file._id, {
          $inc: { downloadCount: 1 },
          lastDownloadedAt: new Date(),
        }).exec().catch(() => {});
        return;
      }
    }

    // Tier 3: Physical file was stored in an ephemeral serverless container that was purged
    await FileVault.findByIdAndUpdate(file._id, { status: 'Expired' });
    return res.status(404).json({
      success: false,
      expired: true,
      message: `Physical file '${file.fileName}' was stored in a previous serverless session whose temporary storage was purged. Please delete and re-upload this file to persist it to permanent cloud storage.`,
    });
  } catch (err) {
    console.error('Download File Error:', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to initiate download.', error: err.message });
    }
  }
});

/**
 * @route   DELETE /api/vault/files/:id
 * @desc    Delete a file from disk, GridFS, and database
 * @access  SuperAdmin Only
 */
router.delete('/files/:id', authenticateAdmin, authorizeRoles('superadmin'), async (req, res) => {
  try {
    const file = await FileVault.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found in Vault.' });
    }

    // Remove from local disk if it exists
    const localPath = resolveLocalPath(file);
    if (localPath) {
      try {
        await fs.promises.unlink(localPath);
      } catch (e) {
        console.warn('Failed to remove local file:', e.message);
      }
    }

    // Remove from GridFS if stored
    const bucket = getGridFSBucket();
    if (bucket && file.gridfsId) {
      try {
        await bucket.delete(new mongoose.Types.ObjectId(file.gridfsId));
      } catch (e) {
        console.warn('Failed to remove GridFS file by ID:', e.message);
      }
    } else if (bucket && file.storedName) {
      try {
        const found = await bucket.find({ filename: file.storedName }).toArray();
        for (const g of found) {
          await bucket.delete(g._id);
        }
      } catch (e) {
        console.warn('Failed to remove GridFS file by name:', e.message);
      }
    }

    await FileVault.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: `File '${file.fileName}' permanently removed from Vault.`,
    });
  } catch (err) {
    console.error('Delete File Error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete file.', error: err.message });
  }
});

/**
 * @route   POST /api/vault/cancel-upload
 * @desc    Cancel in-progress upload and clean up temporary chunk buffers
 * @access  SuperAdmin Only
 */
router.post('/cancel-upload', authenticateAdmin, authorizeRoles('superadmin'), async (req, res) => {
  try {
    const { uploadId } = req.body;
    if (!uploadId) {
      return res.status(400).json({ success: false, message: 'uploadId is required.' });
    }

    // Clean up MongoDB temp chunks
    await VaultTempChunk.deleteMany({ uploadId });

    // Clean up local temp directory if exists
    const sessionDir = path.join(TEMP_CHUNKS_DIR, uploadId);
    if (fs.existsSync(sessionDir)) {
      await fs.promises.rm(sessionDir, { recursive: true, force: true });
    }

    res.json({ success: true, message: 'Temporary upload chunks cleaned up successfully.' });
  } catch (err) {
    console.error('Cancel Upload Error:', err);
    res.status(500).json({ success: false, message: 'Failed to cancel upload.', error: err.message });
  }
});

/**
 * @route   POST /api/vault/sync-local
 * @desc    Sync any local files into GridFS for permanent cloud persistence
 * @access  SuperAdmin Only
 */
router.post('/sync-local', authenticateAdmin, authorizeRoles('superadmin'), async (req, res) => {
  try {
    const bucket = getGridFSBucket();
    if (!bucket) {
      return res.status(500).json({ success: false, message: 'GridFS bucket not available.' });
    }

    const synced = [];
    if (fs.existsSync(VAULT_DIR)) {
      const files = await fs.promises.readdir(VAULT_DIR);
      for (const fileName of files) {
        const filePath = path.join(VAULT_DIR, fileName);
        const stat = await fs.promises.stat(filePath);
        if (!stat.isFile()) continue;

        // Check if file already exists in GridFS
        const found = await bucket.find({ filename: fileName }).toArray();
        let gridfsId = found.length > 0 ? found[0]._id : null;

        if (!gridfsId) {
          const uploadStream = bucket.openUploadStream(fileName);
          gridfsId = uploadStream.id;
          fs.createReadStream(filePath).pipe(uploadStream);
          await new Promise((resolve, reject) => {
            uploadStream.on('finish', resolve);
            uploadStream.on('error', reject);
          });
        }

        // Update or create DB record
        const ext = path.extname(fileName).toLowerCase();
        const cleanName = fileName.replace(/^vault_\d+_/, '');
        await FileVault.findOneAndUpdate(
          { storedName: fileName },
          {
            fileName: cleanName,
            storedName: fileName,
            filePath,
            fileSize: stat.size,
            extension: ext,
            gridfsId,
            storageType: 'hybrid',
            status: 'Ready',
          },
          { upsert: true, new: true }
        );

        synced.push({ fileName, size: stat.size, gridfsId });
      }
    }

    res.json({
      success: true,
      message: `Synchronized ${synced.length} files into permanent cloud storage.`,
      synced,
    });
  } catch (err) {
    console.error('Sync Local Error:', err);
    res.status(500).json({ success: false, message: 'Sync failed.', error: err.message });
  }
});

module.exports = router;
