const express   = require('express');
const router    = express.Router();
const Accessory = require('../models/Accessory');
const { protect, adminAccess } = require('../middleware/auth');
const upload    = require('../middleware/upload');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');

// GET /api/accessories
router.get('/', async (req, res) => {
  try {
    const { cat, q, sort } = req.query;
    const query = {};
    if (cat) query.category = { $regex: `^${cat}$`, $options: 'i' };
    if (q)   query.name = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };

    let sortObj = { createdAt: -1 };
    if (sort === 'price_asc')  sortObj = { price: 1 };
    if (sort === 'price_desc') sortObj = { price: -1 };
    if (sort === 'name_asc')   sortObj = { name: 1 };

    const accessories = await Accessory.find(query).sort(sortObj);
    res.json({ success: true, accessories });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch accessories.' });
  }
});

// GET /api/accessories/categories
router.get('/categories', async (req, res) => {
  try {
    const cats = await Accessory.distinct('category');
    res.json({ success: true, categories: cats });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch categories.' });
  }
});

// GET /api/accessories/:id
router.get('/:id', async (req, res) => {
  try {
    const acc = await Accessory.findById(req.params.id);
    if (!acc) return res.status(404).json({ success: false, message: 'Accessory not found.' });
    res.json({ success: true, accessory: acc });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch accessory.' });
  }
});

// ADMIN: POST /api/accessories
router.post('/', protect, adminAccess, upload.single('image'), async (req, res) => {
  try {
    console.log('[ACC CREATE] req.file:', req.file ? `${req.file.originalname} ${req.file.size}b` : 'NONE');
    console.log('[ACC CREATE] req.body keys:', Object.keys(req.body));
    console.log('[ACC CREATE] req.body.image:', req.body.image);
    const data = { ...req.body };
    if (req.file) {
      data.image = await uploadToCloudinary(req.file.buffer, 'isamoh/accessories');
    }
    data.featured = data.featured === 'true';
    data.onSale   = data.onSale   === 'true';
    data.price    = parseFloat(data.price)    || 0;
    data.oldPrice = parseFloat(data.oldPrice) || null;
    data.stock    = parseInt(data.stock)      || 0;
    const acc = await Accessory.create(data);
    res.status(201).json({ success: true, accessory: acc });
  } catch (e) {
    console.error('[Accessory create]', e.message);
    res.status(500).json({ success: false, message: e.message || 'Failed to create accessory.' });
  }
});

// ADMIN: PUT /api/accessories/:id
router.put('/:id', protect, adminAccess, upload.single('image'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      const existing = await Accessory.findById(req.params.id);
      if (existing?.image) await deleteFromCloudinary(existing.image);
      data.image = await uploadToCloudinary(req.file.buffer, 'isamoh/accessories');
    }
    data.featured = data.featured === 'true';
    data.onSale   = data.onSale   === 'true';
    if (data.price)    data.price    = parseFloat(data.price);
    if (data.oldPrice) data.oldPrice = parseFloat(data.oldPrice);
    if (data.stock)    data.stock    = parseInt(data.stock);
    const acc = await Accessory.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!acc) return res.status(404).json({ success: false, message: 'Accessory not found.' });
    res.json({ success: true, accessory: acc });
  } catch (e) {
    console.error('[Accessory update]', e.message);
    res.status(500).json({ success: false, message: e.message || 'Failed to update accessory.' });
  }
});

// ADMIN: DELETE /api/accessories/:id
router.delete('/:id', protect, adminAccess, async (req, res) => {
  try {
    const acc = await Accessory.findByIdAndDelete(req.params.id);
    if (!acc) return res.status(404).json({ success: false, message: 'Accessory not found.' });
    await deleteFromCloudinary(acc.image);
    res.json({ success: true, message: 'Accessory deleted.' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to delete accessory.' });
  }
});

module.exports = router;
