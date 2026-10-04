const cloudinary = require('cloudinary').v2;

// Configure once — credentials come from env vars
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
