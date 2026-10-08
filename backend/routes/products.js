const express = require('express');
const router  = express.Router();
const { body, validationResult } = require('express-validator');

const Product   = require('../models/Product');
const Review    = require('../models/Review');
const { protect, adminAccess, optionalAuth } = require('../middleware/auth');
const upload    = require('../middleware/upload');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');

// GET /api/products
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { q, brand, filter, category, minPrice, maxPrice, sort, page = 1, limit = 20 } = req.query;
    const query = {};
    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [{ name: { $regex: escaped, $options: 'i' } }, { brand: { $regex: escaped, $options: 'i' } }];
    }
    if (brand) { const e = brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); query.brand = { $regex: `^${e}$`, $options: 'i' }; }
    if (category) { const e = category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); query.brand = { $regex: `^${e}$`, $options: 'i' }; }
    if (filter === 'onsale')   query.onSale   = true;
    if (filter === 'featured') query.featured = true;
    if (minPrice || maxPrice) { query.price = {}; if (minPrice) query.price.$gte = parseFloat(minPrice); if (maxPrice) query.price.$lte = parseFloat(maxPrice); }
    let sortObj = { createdAt: -1 };
    if (sort === 'price_asc')  sortObj = { price: 1 };
    if (sort === 'price_desc') sortObj = { price: -1 };
    if (sort === 'name_asc')   sortObj = { name: 1 };
    const skip = (parseInt(page) - 1) * Math.min(parseInt(limit) || 20, 500);
    const safeLimit = Math.min(parseInt(limit) || 20, 500);
    const total    = await Product.countDocuments(query);
    const products = await Product.find(query).sort(sortObj).skip(skip).limit(safeLimit);
    res.json({ success: true, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), products });
  } catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Failed to fetch products.' }); }
});

// GET /api/products/featured
router.get('/featured', async (req, res) => {
  try { const products = await Product.find({ featured: true }).limit(16); res.json({ success: true, products }); }
  catch (e) { res.status(500).json({ success: false, message: 'Error fetching featured products.' }); }
});

// GET /api/products/onsale
router.get('/onsale', async (req, res) => {
  try { const products = await Product.find({ onSale: true }).limit(16); res.json({ success: true, products }); }
  catch (e) { res.status(500).json({ success: false, message: 'Error fetching sale products.' }); }
});

// GET /api/products/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    const related = await Product.find({ brand: product.brand, _id: { $ne: product._id } }).limit(4);
    const reviews = await Review.find({ product: product._id }).populate('user', 'firstName lastName avatar').sort({ createdAt: -1 });
    const avgRating = reviews.length ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10 : 0;
    let userReview = null;
    if (req.user) userReview = reviews.find(r => r.user._id.toString() === req.user._id.toString()) || null;
    res.json({ success: true, product, related, reviews, avgRating, userReview });
  } catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Failed to fetch product.' }); }
});

// POST /api/products/:id/reviews
router.post('/:id/reviews', protect, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5.'),
  body('comment').trim().notEmpty().withMessage('Comment is required.'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ success: false, message: errors.array()[0].msg });
  try {
    const { rating, comment } = req.body;
    const review = await Review.findOneAndUpdate(
      { product: req.params.id, user: req.user._id },
      { rating, comment },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate('user', 'firstName lastName avatar');
    res.json({ success: true, message: 'Review submitted!', review });
  } catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Failed to submit review.' }); }
});

// ADMIN: POST /api/products — supports image, image2, image3
router.post('/', protect, adminAccess, upload.fields([
  { name: 'image',  maxCount: 1 },
  { name: 'image2', maxCount: 1 },
  { name: 'image3', maxCount: 1 },
]), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.files?.image?.[0])  data.image  = await uploadToCloudinary(req.files.image[0].buffer,  'isamoh/products');
    if (req.files?.image2?.[0]) data.image2 = await uploadToCloudinary(req.files.image2[0].buffer, 'isamoh/products');
    if (req.files?.image3?.[0]) data.image3 = await uploadToCloudinary(req.files.image3[0].buffer, 'isamoh/products');
    data.featured = data.featured === 'true' || data.featured === true;
    data.onSale   = data.onSale   === 'true' || data.onSale   === true;
    data.price    = parseFloat(data.price)    || 0;
    data.oldPrice = parseFloat(data.oldPrice) || null;
    data.stock    = parseInt(data.stock)      || 0;
    const product = await Product.create(data);
    res.status(201).json({ success: true, product });
  } catch (e) {
    console.error('[Product create]', e.message);
    res.status(500).json({ success: false, message: e.message || 'Failed to create product.' });
  }
});

// ADMIN: PUT /api/products/:id — supports image, image2, image3
router.put('/:id', protect, adminAccess, upload.fields([
  { name: 'image',  maxCount: 1 },
  { name: 'image2', maxCount: 1 },
  { name: 'image3', maxCount: 1 },
]), async (req, res) => {
  try {
    const data = { ...req.body };
    const existing = await Product.findById(req.params.id);
    if (req.files?.image?.[0])  { if (existing?.image)  await deleteFromCloudinary(existing.image);  data.image  = await uploadToCloudinary(req.files.image[0].buffer,  'isamoh/products'); }
    if (req.files?.image2?.[0]) { if (existing?.image2) await deleteFromCloudinary(existing.image2); data.image2 = await uploadToCloudinary(req.files.image2[0].buffer, 'isamoh/products'); }
    if (req.files?.image3?.[0]) { if (existing?.image3) await deleteFromCloudinary(existing.image3); data.image3 = await uploadToCloudinary(req.files.image3[0].buffer, 'isamoh/products'); }
    data.featured = data.featured === 'true' || data.featured === true;
    data.onSale   = data.onSale   === 'true' || data.onSale   === true;
    if (data.price)    data.price    = parseFloat(data.price);
    if (data.oldPrice) data.oldPrice = parseFloat(data.oldPrice);
    if (data.stock)    data.stock    = parseInt(data.stock);
    const product = await Product.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, product });
  } catch (e) {
    console.error('[Product update]', e.message);
    res.status(500).json({ success: false, message: e.message || 'Failed to update product.' });
  }
});

// ADMIN: DELETE /api/products/:id
router.delete('/:id', protect, adminAccess, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    await deleteFromCloudinary(product.image);
    if (product.image2) await deleteFromCloudinary(product.image2);
    if (product.image3) await deleteFromCloudinary(product.image3);
    await Review.deleteMany({ product: req.params.id });
    res.json({ success: true, message: 'Product deleted.' });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed to delete product.' }); }
});

module.exports = router;
