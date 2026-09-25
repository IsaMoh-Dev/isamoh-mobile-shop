const express = require('express');
const router  = express.Router();
const Review  = require('../models/Review');
const { protect, adminAccess } = require('../middleware/auth');

// ADMIN: GET /api/reviews  — all reviews
router.get('/', protect, adminAccess, async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('user',    'firstName lastName email')
      .populate('product', 'name brand image')
      .sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch reviews.' });
  }
});

// ADMIN: DELETE /api/reviews/:id
router.delete('/:id', protect, adminAccess, async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Review deleted.' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to delete review.' });
  }
});

module.exports = router;
