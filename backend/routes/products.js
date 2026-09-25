const express = require('express');
const router  = express.Router();
const { body, validationResult } = require('express-validator');

const Product   = require('../models/Product');
const Review    = require('../models/Review');
const { protect, adminAccess, optionalAuth } = require('../middleware/auth');
const upload    = require('../middleware/upload');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/products  — list/search/filter products
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { q, brand, filter, minPrice, maxPrice, sort, page = 1, limit = 20 } = req.query;

    const query = {};

    // FIX #4: Escape user input before using in regex to prevent ReDoS
    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name:  { $regex: escaped, $options: 'i' } },
        { brand: { $regex: escaped, $options: 'i' } },
      ];
    }

    // Brand filter — also escape
    if (brand) {
      const escapedBrand = brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.brand = { $regex: `^${escapedBrand}$`, $options: 'i' };
    }

    // Type filter
    if (filter === 'onsale')   query.onSale  = true;
    if (filter === 'featured') query.featured = true;

    // Price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Sort
    let sortObj = { createdAt: -1 };
    if (sort === 'price_asc')  sortObj = { price: 1 };
    if (sort === 'price_desc') sortObj = { price: -1 };
    if (sort === 'name_asc')   sortObj = { name: 1 };

    const skip  = (parseInt(page) - 1) * Math.min(parseInt(limit) || 20, 100);
    const safeLimit = Math.min(parseInt(limit) || 20, 100);
    const total = await Product.countDocuments(query);
    const products = await Product.find(query).sort(sortObj).skip(skip).limit(safeLimit);

    res.json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      products,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Failed to fetch products.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/products/featured
// ─────────────────────────────────────────────────────────────────────────────
router.get('/featured', async (req, res) => {
  try {
    const products = await Product.find({ featured: true }).limit(16);
    res.json({ success: true, products });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error fetching featured products.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/products/onsale
// ─────────────────────────────────────────────────────────────────────────────
router.get('/onsale', async (req, res) => {
  try {
    const products = await Product.find({ onSale: true }).limit(16);
    res.json({ success: true, products });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error fetching sale products.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/products/:id  — single product with reviews
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    // Related products (same brand, exclude self)
    const related = await Product.find({
      brand: product.brand,
      _id:   { $ne: product._id },
    }).limit(4);

    // Reviews
    const reviews = await Review.find({ product: product._id })
      .populate('user', 'firstName lastName avatar')
      .sort({ createdAt: -1 });

    const avgRating = reviews.length
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : 0;

    let userReview = null;
    if (req.user) {
      userReview = reviews.find(r => r.user._id.toString() === req.user._id.toString()) || null;
    }

    res.json({ success: true, product, related, reviews, avgRating, userReview });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Failed to fetch product.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/products/:id/reviews  — submit or update review
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/reviews', protect, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5.'),
  body('comment').trim().notEmpty().withMessage('Comment is required.'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ success: false, message: errors.array()[0].msg });

  try {
    const { rating, comment } = req.body;
    const productId = req.params.id;

    // Upsert — one review per user per product
    const review = await Review.findOneAndUpdate(
      { product: productId, user: req.user._id },
      { rating, comment },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate('user', 'firstName lastName avatar');

    res.json({ success: true, message: 'Review submitted!', review });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Failed to submit review.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: POST /api/products  — create product
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', protect, adminAccess, (req, res, next) => {
  req.uploadFolder = 'products';
  req.uploadPrefix = 'product';
  next();
}, upload.single('image'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.image = `assets/products/${req.file.filename}`;

    // Coerce booleans
    data.featured = data.featured === 'true' || data.featured === true;
    data.onSale   = data.onSale   === 'true' || data.onSale   === true;
    data.price    = parseFloat(data.price)    || 0;
    data.oldPrice = parseFloat(data.oldPrice) || null;
    data.stock    = parseInt(data.stock)      || 0;

    const product = await Product.create(data);
    res.status(201).json({ success: true, product });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Failed to create product.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: PUT /api/products/:id  — update product
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id', protect, adminAccess, (req, res, next) => {
  req.uploadFolder = 'products';
  req.uploadPrefix = 'product';
  next();
}, upload.single('image'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.image = `assets/products/${req.file.filename}`;
    data.featured = data.featured === 'true' || data.featured === true;
    data.onSale   = data.onSale   === 'true' || data.onSale   === true;
    if (data.price)    data.price    = parseFloat(data.price);
    if (data.oldPrice) data.oldPrice = parseFloat(data.oldPrice);
    if (data.stock)    data.stock    = parseInt(data.stock);

    const product = await Product.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, product });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Failed to update product.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: DELETE /api/products/:id
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', protect, adminAccess, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    await Review.deleteMany({ product: req.params.id });
    res.json({ success: true, message: 'Product deleted.' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to delete product.' });
  }
});

module.exports = router;
