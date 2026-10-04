const cloudinary = require('cloudinary').v2;

// Warn loudly on startup if credentials are missing
const missingVars = ['CLOUDINARY_CLOUD_NAME','CLOUDINARY_API_KEY','CLOUDINARY_API_SECRET']
  .filter(k => !process.env[k] || process.env[k].startsWith('your_'));

if (missingVars.length > 0) {
  console.warn(`⚠️  Cloudinary not configured — missing: ${missingVars.join(', ')}`);
  console.warn('   Image uploads will fail. Add these to your Render environment variables.');
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a buffer to Cloudinary.
 * @param {Buffer} buffer   — file buffer from multer memoryStorage
 * @param {string} folder   — Cloudinary folder e.g. 'isamoh/products'
 * @param {string} publicId — optional public_id (without extension)
 * @returns {Promise<string>} secure_url of the uploaded image
 */
function uploadToCloudinary(buffer, folder = 'isamoh', publicId) {
  // Guard: fail fast with a clear message if not configured
  if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME.startsWith('your_')) {
    return Promise.reject(new Error('Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to your environment variables on Render.'));
  }
  return new Promise((resolve, reject) => {
    const opts = {
      folder,
      resource_type: 'image',
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    };
    if (publicId) opts.public_id = publicId;

    const stream = cloudinary.uploader.upload_stream(opts, (err, result) => {
      if (err) return reject(err);
      resolve(result.secure_url);
    });
    stream.end(buffer);
  });
}

/**
 * Delete an image from Cloudinary by its public_id.
 * Extracts public_id from a full Cloudinary URL automatically.
 * Safe to call with non-Cloudinary URLs (no-op).
 */
async function deleteFromCloudinary(url) {
  if (!url || !url.includes('cloudinary.com')) return;
  try {
    // Extract public_id: everything between /upload/vXXXX/ and the extension
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/i);
    if (match) await cloudinary.uploader.destroy(match[1]);
  } catch (e) {
    console.warn('[Cloudinary] delete failed:', e.message);
  }
}

module.exports = { uploadToCloudinary, deleteFromCloudinary };
