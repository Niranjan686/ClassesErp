const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const FileVault = require('../models/FileVault');
const { authenticateAdmin, authorizeRoles } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

const os = require('os');

// Storage Directories (Use os.tmpdir() in serverless environments like Vercel to avoid EROFS error)
const UPLOADS_ROOT = process.env.VERCEL
  ? path.join(os.tmpdir(), 'classtech_vault')
  : path.join(__dirname, '../uploads');
const VAULT_DIR = path.join(UPLOADS_ROOT, 'vault');
const TEMP_CHUNKS_DIR = path.join(UPLOADS_ROOT, 'temp_chunks');

// Safely ensure base directories exist without crashing module load
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

/**
 * Helper to authenticate token from either Authorization header or query param
 * (Useful for direct browser <a href="..."> download triggers)
 */
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

/**
 * @route   POST /api/vault/chunk-upload
 * @desc    Receive a single file chunk (Binary multipart or Base64 format)
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

      // Extract chunk buffer from multipart file or base64 payload
      let chunkBuffer = null;
      if (req.file && req.file.buffer) {
        chunkBuffer = req.file.buffer;
      } else if (chunkBase64) {
        // Strip data URL header if present (e.g. data:application/octet-stream;base64,...)
        const cleanBase64 = chunkBase64.replace(/^data:.*?;base64,/, '');
        chunkBuffer = Buffer.from(cleanBase64, 'base64');
      }

      if (!chunkBuffer || chunkBuffer.length === 0) {
        return res.status(400).json({
          success: false,
          message: `Chunk ${index} contains no data. Ensure chunkFile or chunkBase64 is provided.`,
        });
      }

      // Create session chunk directory: uploads/temp_chunks/{uploadId}
      const sessionDir = path.join(TEMP_CHUNKS_DIR, uploadId);
      if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
      }

      // Write chunk to disk: uploads/temp_chunks/{uploadId}/chunk_{index}
      const chunkFilePath = path.join(sessionDir, `chunk_${index}`);
      await fs.promises.writeFile(chunkFilePath, chunkBuffer);

      // Check if this was the last chunk
      if (index === total - 1) {
        // Check if all chunks from 0 to total-1 exist
        const chunkFiles = await fs.promises.readdir(sessionDir);
        if (chunkFiles.length < total) {
          return res.json({
            success: true,
            isComplete: false,
            message: `Chunk ${index + 1}/${total} stored. Waiting for remaining chunks.`,
            chunkIndex: index,
            totalChunks: total,
            chunksReceived: chunkFiles.length,
          });
        }

        // Sanitize filename & generate stored name
        const ext = path.extname(fileName).toLowerCase();
        const safeBase = path.basename(fileName, ext).replace(/[^a-zA-Z0-9_\-\.]/g, '_');
        const storedName = `vault_${Date.now()}_${safeBase}${ext}`;
        const finalFilePath = path.join(VAULT_DIR, storedName);

        // Stream all chunks in sequential order into final file
        const writeStream = fs.createWriteStream(finalFilePath);
        for (let i = 0; i < total; i++) {
          const partPath = path.join(sessionDir, `chunk_${i}`);
          if (!fs.existsSync(partPath)) {
            throw new Error(`Missing chunk part ${i} during final file assembly.`);
          }
          const partBuffer = await fs.promises.readFile(partPath);
          writeStream.write(partBuffer);
        }
        writeStream.end();

        // Await stream finish
        await new Promise((resolve, reject) => {
          writeStream.on('finish', resolve);
          writeStream.on('error', reject);
        });

        // Clean up temporary chunk files
        try {
          await fs.promises.rm(sessionDir, { recursive: true, force: true });
        } catch (cleanErr) {
          console.error('Error cleaning temp chunks:', cleanErr);
        }

        // Verify final file size on disk
        const stats = await fs.promises.stat(finalFilePath);

        // Create Mongoose record in FileVault
        const fileRecord = await FileVault.create({
          fileName,
          storedName,
          filePath: finalFilePath,
          fileSize: stats.size || totalSize,
          mimeType: req.file?.mimetype || 'application/octet-stream',
          extension: ext || '.bin',
          totalChunks: total,
          chunkSize: chunkBuffer.length,
          uploadFormat: chunkBase64 ? 'base64' : 'binary',
          uploadedBy: req.user?.id,
          uploadedByName: req.user?.username || req.user?.name || 'SuperAdmin',
          status: 'Ready',
          description,
        });

        return res.status(201).json({
          success: true,
          isComplete: true,
          message: `File '${fileName}' successfully assembled and stored in Vault!`,
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
 * @desc    List all files in the SuperAdmin Vault with search & stats
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
 * @desc    Stream download file of ANY size (using streams, no memory exhaustion or timeouts)
 * @access  SuperAdmin Only (Accepts Bearer header or ?token=)
 */
router.get('/download/:id', verifySuperAdminOrToken, async (req, res) => {
  try {
    const file = await FileVault.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ success: false, message: 'Requested file not found in Vault.' });
    }

    if (!fs.existsSync(file.filePath)) {
      return res.status(404).json({ success: false, message: 'Physical file not found on disk.' });
    }

    const stat = await fs.promises.stat(file.filePath);

    // Set streaming headers for large binary downloads
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.fileName)}"`);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'no-cache');

    // Create high-throughput read stream (64KB chunks)
    const readStream = fs.createReadStream(file.filePath, { highWaterMark: 64 * 1024 });

    readStream.pipe(res);

    readStream.on('error', (streamErr) => {
      console.error('File Streaming Error:', streamErr);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Error streaming file.' });
      }
    });

    // Update download metrics in background
    FileVault.findByIdAndUpdate(file._id, {
      $inc: { downloadCount: 1 },
      lastDownloadedAt: new Date(),
    }).exec().catch(() => {});
  } catch (err) {
    console.error('Download File Error:', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to initiate download.', error: err.message });
    }
  }
});

/**
 * @route   DELETE /api/vault/files/:id
 * @desc    Delete a file from disk and database
 * @access  SuperAdmin Only
 */
router.delete('/files/:id', authenticateAdmin, authorizeRoles('superadmin'), async (req, res) => {
  try {
    const file = await FileVault.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found in Vault.' });
    }

    // Remove from disk if it exists
    if (fs.existsSync(file.filePath)) {
      await fs.promises.unlink(file.filePath);
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
 * @desc    Cancel in-progress upload and clean up temporary chunk files
 * @access  SuperAdmin Only
 */
router.post('/cancel-upload', authenticateAdmin, authorizeRoles('superadmin'), async (req, res) => {
  try {
    const { uploadId } = req.body;
    if (!uploadId) {
      return res.status(400).json({ success: false, message: 'uploadId is required.' });
    }

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

module.exports = router;
