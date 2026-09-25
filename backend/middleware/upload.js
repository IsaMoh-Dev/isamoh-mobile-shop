const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

// Store uploads in backend/public/assets — proper MERN structure
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'products';
    if (req.uploadFolder) folder = req.uploadFolder;
    const dir = path.join(__dirname, '../public/assets', folder);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const prefix = req.uploadPrefix || 'upload';
    const ext    = path.extname(file.originalname).toLowerCase();
    cb(null, `${prefix}_${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  // FIX #7: Check both extension AND MIME type to prevent file type spoofing
  const allowedExts  = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const ext  = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();

  if (allowedExts.includes(ext) && allowedMimes.includes(mime)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpg, jpeg, png, webp, gif)'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

module.exports = upload;
