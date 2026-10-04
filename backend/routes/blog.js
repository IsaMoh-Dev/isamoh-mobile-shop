const express  = require('express');
const router   = express.Router();
const Blog     = require('../models/Blog');
const slugify  = require('slugify');
const { protect, adminAccess } = require('../middleware/auth');
const upload   = require('../middleware/upload');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');

// GET /api/blog
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const total = await Blog.countDocuments();
    const posts = await Blog.find()
      .sort({ publishedAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));
    res.json({ success: true, total, posts });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch blog posts.' });
  }
});

// GET /api/blog/:slug
router.get('/:slug', async (req, res) => {
  try {
    const post = await Blog.findOne({ slug: req.params.slug });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    res.json({ success: true, post });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch post.' });
  }
});

// ADMIN: POST /api/blog
router.post('/', protect, adminAccess, upload.single('image'), async (req, res) => {
  try {
    const { title, content } = req.body;
    const slug  = slugify(title, { lower: true, strict: true }) + '-' + Date.now();
    let image = 'assets/blog/blog1.jpg'; // fallback to existing static image
    if (req.file) {
      image = await uploadToCloudinary(req.file.buffer, 'isamoh/blog');
    }
    const post = await Blog.create({ title, content, slug, image });
    res.status(201).json({ success: true, post });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to create post.' });
  }
});

// ADMIN: PUT /api/blog/:id
router.put('/:id', protect, adminAccess, upload.single('image'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      const existing = await Blog.findById(req.params.id);
      if (existing?.image) await deleteFromCloudinary(existing.image);
      data.image = await uploadToCloudinary(req.file.buffer, 'isamoh/blog');
    }
    if (data.title) data.slug = slugify(data.title, { lower: true, strict: true }) + '-' + Date.now();
    const post = await Blog.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    res.json({ success: true, post });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to update post.' });
  }
});

// ADMIN: DELETE /api/blog/:id
router.delete('/:id', protect, adminAccess, async (req, res) => {
  try {
    const post = await Blog.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    await deleteFromCloudinary(post.image);
    res.json({ success: true, message: 'Post deleted.' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to delete post.' });
  }
});

module.exports = router;
