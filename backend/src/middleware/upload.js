const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// Create all upload subdirectories at startup
ensureDir(path.join(UPLOADS_DIR, 'resumes'));
ensureDir(path.join(UPLOADS_DIR, 'screenshots'));
ensureDir(path.join(UPLOADS_DIR, 'photos'));
ensureDir(path.join(UPLOADS_DIR, 'attachments'));

// ── Magic-byte signatures for file type validation ─────────────────────────
// PDF: %PDF- (hex 25 50 44 46 2D)
// JPEG: FF D8 FF
// PNG: 89 50 4E 47 0D 0A 1A 0A
// DOCX/DOC (ZIP-based): PK (50 4B)
const MAGIC_BYTES = {
  pdf:  [0x25, 0x50, 0x44, 0x46],   // %PDF
  jpeg: [0xFF, 0xD8, 0xFF],
  jpg:  [0xFF, 0xD8, 0xFF],
  png:  [0x89, 0x50, 0x4E, 0x47],
  webp: [0x52, 0x49, 0x46, 0x46],   // RIFF
  docx: [0x50, 0x4B],               // PK (zip)
  doc:  [0xD0, 0xCF, 0x11, 0xE0]    // OLE2 compound doc
};

/**
 * Reads the first bytes of a file and checks against known magic bytes.
 * Returns true if the file signature matches the expected extension.
 */
const verifyMagicBytes = (filePath, ext) => {
  const expected = MAGIC_BYTES[ext.replace('.', '')];
  if (!expected) return false; // Unknown type — reject
  try {
    const buf = Buffer.alloc(expected.length);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buf, 0, expected.length, 0);
    fs.closeSync(fd);
    return expected.every((byte, i) => buf[i] === byte);
  } catch {
    return false;
  }
};

const createStorage = (subdir) => multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(UPLOADS_DIR, subdir);
    ensureDir(dest);
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    // Use only server-generated filename — never trust user-provided name
    const ext = path.extname(file.originalname).toLowerCase();
    const randomName = `${req.user.id}-${Date.now()}-${Math.random().toString(36).substring(2, 10)}${ext}`;
    cb(null, randomName);
  }
});

const fileFilter = (allowedExts) => (req, file, cb) => {
  // 1. Extension check
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedExts.includes(ext)) {
    return cb(new Error(`Invalid file type "${ext}". Allowed: ${allowedExts.join(', ')}`), false);
  }
  // 2. MIME type check
  const mimeWhitelist = {
    '.pdf':  ['application/pdf'],
    '.doc':  ['application/msword'],
    '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    '.jpg':  ['image/jpeg'],
    '.jpeg': ['image/jpeg'],
    '.png':  ['image/png'],
    '.webp': ['image/webp']
  };
  const allowedMimes = mimeWhitelist[ext] || [];
  if (!allowedMimes.includes(file.mimetype)) {
    return cb(new Error(`MIME type mismatch. Got "${file.mimetype}" for extension "${ext}"`), false);
  }
  cb(null, true);
};

/**
 * Post-upload magic byte verification middleware.
 * Call after multer processes the file.
 */
const verifyUploadedFile = (req, res, next) => {
  if (!req.file) return next();
  const ext = path.extname(req.file.filename).toLowerCase();
  const isValid = verifyMagicBytes(req.file.path, ext);
  if (!isValid) {
    // Delete the file — it failed magic byte check
    try { fs.unlinkSync(req.file.path); } catch {}
    return res.status(400).json({
      error: `File content does not match expected format for "${ext}". Upload rejected.`
    });
  }
  next();
};

const uploadResume = multer({
  storage: createStorage('resumes'),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: fileFilter(['.pdf', '.doc', '.docx'])
});

const uploadScreenshot = multer({
  storage: createStorage('screenshots'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter(['.jpg', '.jpeg', '.png', '.webp'])
});

const uploadPhoto = multer({
  storage: createStorage('photos'),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: fileFilter(['.jpg', '.jpeg', '.png', '.webp'])
});

const uploadAttachment = multer({
  storage: createStorage('attachments'),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: fileFilter(['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.doc', '.docx'])
});

const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size: 10MB for resumes, 5MB for images.' });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  if (err?.message?.startsWith('Invalid file type') || err?.message?.startsWith('MIME type mismatch')) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
};

module.exports = {
  uploadResume,
  uploadScreenshot,
  uploadPhoto,
  uploadAttachment,
  handleUploadError,
  verifyUploadedFile,
  UPLOADS_DIR
};
