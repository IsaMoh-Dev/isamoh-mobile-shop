const express = require('express');
const router  = express.Router();
const Setting = require('../models/Setting');
const Brand   = require('../models/Brand');
const ContactMessage = require('../models/ContactMessage');
const Newsletter     = require('../models/Newsletter');
const { protect, adminAccess } = require('../middleware/auth');
const upload  = require('../middleware/upload');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');

// GET /api/settings
router.get('/', async (req, res) => {
  try {
    const settings = await Setting.find();
    const map = Object.fromEntries(settings.map(s => [s.key, s.value]));
    res.json({ success: true, settings: map });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch settings.' });
  }
});

// PUT /api/settings — bulk update
router.put('/', protect, adminAccess, async (req, res) => {
  try {
    const updates = req.body;
    const ops = Object.entries(updates).map(([key, value]) => ({
      updateOne: {
        filter: { key },
        update: { $set: { key, value: String(value) } },
        upsert: true,
      },
    }));
    await Setting.bulkWrite(ops);
    res.json({ success: true, message: 'Settings saved.' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to save settings.' });
  }
});

// POST /api/settings/banner — upload banner or logo image to Cloudinary
router.post('/banner', protect, adminAccess, upload.single('banner'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });

    const { bannerKey } = req.body;

    // Delete old image from Cloudinary if it exists
    if (bannerKey) {
      const existing = await Setting.findOne({ key: bannerKey });
      if (existing?.value) await deleteFromCloudinary(existing.value);
    }

    // Upload new image to Cloudinary
    const folder = bannerKey === 'shop_logo' ? 'isamoh/logos' : 'isamoh/banners';
    const imageUrl = await uploadToCloudinary(req.file.buffer, folder);

    // Save URL to settings
    if (bannerKey) {
      await Setting.findOneAndUpdate(
        { key: bannerKey },
        { $set: { key: bannerKey, value: imageUrl } },
        { upsert: true }
      );
    }

    res.json({ success: true, path: imageUrl });
  } catch (e) {
    console.error('[Banner upload]', e);
    res.status(500).json({ success: false, message: 'Upload failed: ' + e.message });
  }
});

// ── Brands ──────────────────────────────────────────────────────────────────

router.get('/brands', async (req, res) => {
  try {
    const brands = await Brand.find().sort({ name: 1 });
    res.json({ success: true, brands });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch brands.' });
  }
});

router.post('/brands', protect, adminAccess, async (req, res) => {
  try {
    const brand = await Brand.create(req.body);
    res.status(201).json({ success: true, brand });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ success: false, message: 'Brand already exists.' });
    res.status(500).json({ success: false, message: 'Failed to create brand.' });
  }
});

router.delete('/brands/:id', protect, adminAccess, async (req, res) => {
  try {
    await Brand.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Brand deleted.' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to delete brand.' });
  }
});

// ── Contact Messages ─────────────────────────────────────────────────────────

router.get('/messages', protect, adminAccess, async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.json({ success: true, messages });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch messages.' });
  }
});

router.put('/messages/:id/read', protect, adminAccess, async (req, res) => {
  try {
    await ContactMessage.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to mark as read.' });
  }
});

router.delete('/messages/:id', protect, adminAccess, async (req, res) => {
  try {
    await ContactMessage.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Message deleted.' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to delete message.' });
  }
});

// ── Newsletter ───────────────────────────────────────────────────────────────

router.post('/newsletter', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }
    const exists = await Newsletter.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ success: false, message: 'You are already subscribed!' });
    await Newsletter.create({ email: email.toLowerCase() });
    res.json({ success: true, message: 'Subscribed! You will receive our latest deals.' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Subscription failed.' });
  }
});

router.get('/newsletter', protect, adminAccess, async (req, res) => {
  try {
    const subscribers = await Newsletter.find().sort({ subscribedAt: -1 });
    res.json({ success: true, subscribers });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch subscribers.' });
  }
});

// POST /api/settings/contact — public contact form
router.post('/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email and message are required.' });
    }
    await ContactMessage.create({ name, email, subject, message });
    res.json({ success: true, message: 'Message sent! We will get back to you soon.' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
});

module.exports = router;
