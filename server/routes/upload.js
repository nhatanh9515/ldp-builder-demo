const express = require('express');
const path    = require('path');
const fs      = require('fs');
const crypto  = require('crypto');
const multer  = require('multer');

const router     = express.Router();
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'public', 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED_MIME = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
]);
const EXT_MAP = {
  'image/jpeg'   : '.jpg',
  'image/png'    : '.png',
  'image/gif'    : '.gif',
  'image/webp'   : '.webp',
  'image/svg+xml': '.svg',
};
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// Lưu thẳng ra disk với tên ngẫu nhiên để tránh trùng/đè
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = EXT_MAP[file.mimetype] || path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_BYTES },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new Error(`"${file.originalname}": chỉ nhận ảnh JPG/PNG/GIF/WebP/SVG`));
    }
    cb(null, true);
  },
});

// POST /api/upload
// FormData multipart, field name "files" (1 hoặc nhiều ảnh)
// Trả về { data: [url, ...] } đúng định dạng GrapesJS Asset Manager mong đợi
router.post('/', (req, res) => {
  // upload.any() nhận file ở MỌI tên field (GrapesJS có thể gửi 'files', 'files[]'...)
  upload.any()(req, res, (err) => {
    if (err) {
      const msg = err.code === 'LIMIT_FILE_SIZE'
        ? 'Ảnh quá lớn (tối đa 5 MB)'
        : err.message || 'Upload thất bại';
      return res.status(400).json({ error: msg });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Không có file nào được upload' });
    }

    const urls = req.files.map(f => `/uploads/${f.filename}`);
    res.json({ data: urls });
  });
});

module.exports = router;
