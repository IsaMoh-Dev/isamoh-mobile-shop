const express  = require('express');
const router   = express.Router();
const Wishlist = require('../models/Wishlist');
const Cart     = require('../models/Cart');
const { protect } = require('../middleware/auth');

// GET /api/wishlist
router.get('/', protect, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id }).populate('items');
    res.json({ success: true, items: wishlist ? wishlist.items : [], count: wishlist ? wishlist.items.length : 0 });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch wishlist.' });
  }
});

// POST /api/wishlist/add
router.post('/add', protect, async (req, res) => {
  try {
    const { productId } = req.body;
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) wishlist = await Wishlist.create({ user: req.user._id, items: [] });

    if (!wishlist.items.map(String).includes(productId)) {
      wishlist.items.push(productId);
      await wishlist.save();
    }
    res.json({ success: true, count: wishlist.items.length });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to add to wishlist.' });
  }
});

// DELETE /api/wishlist/remove/:productId
router.delete('/remove/:productId', protect, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (wishlist) {
      wishlist.items = wishlist.items.filter(id => id.toString() !== req.params.productId);
      await wishlist.save();
    }
    res.json({ success: true, count: wishlist ? wishlist.items.length : 0 });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to remove from wishlist.' });
  }
});

// POST /api/wishlist/move-to-cart/:productId  — move item to cart
router.post('/move-to-cart/:productId', protect, async (req, res) => {
  try {
    const productId = req.params.productId;

    // Add to cart
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });
    const exists = cart.items.find(i => i.product.toString() === productId);
    if (exists) exists.qty = Math.min(20, exists.qty + 1);
    else cart.items.push({ product: productId, itemModel: 'Product', qty: 1 });
    await cart.save();

    // Remove from wishlist
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (wishlist) {
      wishlist.items = wishlist.items.filter(id => id.toString() !== productId);
      await wishlist.save();
    }

    res.json({ success: true, cartCount: cart.items.reduce((s, i) => s + i.qty, 0) });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to move to cart.' });
  }
});

module.exports = router;
