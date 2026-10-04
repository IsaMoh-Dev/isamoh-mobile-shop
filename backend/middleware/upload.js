const multer = require('multer');
const path   = require('path');

// Use memory storage — files go to buffer, NOT disk
// This works on Render (ephemeral filesystem) because we upload directly to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
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
