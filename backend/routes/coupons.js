const express = require('express');
const router  = express.Router();
const Coupon  = require('../models/Coupon');
const { protect, adminAccess } = require('../middleware/auth');

// POST /api/coupons/check  — validate a coupon (public)
router.post('/check', async (req, res) => {
  try {
    const { code, total = 0 } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Please enter a coupon code.' });

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (!coupon)          return res.status(404).json({ success: false, message: 'Invalid coupon code.' });
    if (!coupon.isActive) return res.status(400).json({ success: false, message: 'This coupon is no longer active.' });

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'This coupon has expired.' });
    }
    if (coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ success: false, message: 'This coupon has reached its usage limit.' });
    }
    if (coupon.minOrder > 0 && parseFloat(total) < coupon.minOrder) {
      return res.status(400).json({
        success: false,
        message: `Minimum order of $${coupon.minOrder.toFixed(2)} required for this coupon.`,
      });
    }

    const discount = coupon.type === 'percent'
      ? Math.round(parseFloat(total) * (coupon.value / 100) * 100) / 100
      : Math.min(coupon.value, parseFloat(total));

    res.json({
      success:  true,
      message:  `Coupon applied! You save $${discount.toFixed(2)}`,
      discount,
      type:     coupon.type,
      value:    coupon.value,
      couponId: coupon._id,
      code:     coupon.code,
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to check coupon.' });
  }
});

// ADMIN CRUD ──────────────────────────────────────────────────────────────────

router.get('/', protect, adminAccess, async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch coupons.' });
  }
});

router.post('/', protect, adminAccess, async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, coupon });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ success: false, message: 'Coupon code already exists.' });
    res.status(500).json({ success: false, message: 'Failed to create coupon.' });
  }
});

router.put('/:id', protect, adminAccess, async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found.' });
    res.json({ success: true, coupon });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to update coupon.' });
  }
});

router.delete('/:id', protect, adminAccess, async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Coupon deleted.' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to delete coupon.' });
  }
});

module.exports = router;
