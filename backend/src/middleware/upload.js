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

const createStorage = (subdir) => multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(UPLOADS_DIR, subdir);
    ensureDir(dest);
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const sanitized = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '-').substring(0, 30);
    cb(null, `${req.user.id}-${Date.now()}-${sanitized}${ext}`);
  }
});

const fileFilter = (allowedExts) => (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type "${ext}". Allowed: ${allowedExts.join(', ')}`), false);
  }
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

const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size: 10MB for resumes, 5MB for images.' });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  if (err?.message?.startsWith('Invalid file type')) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
};

ensureDir(path.join(UPLOADS_DIR, 'attachments'));

const uploadAttachment = multer({
  storage: createStorage('attachments'),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: fileFilter(['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.doc', '.docx'])
});

module.exports = { uploadResume, uploadScreenshot, uploadPhoto, uploadAttachment, handleUploadError, UPLOADS_DIR };
