const express = require('express');
const router  = express.Router();
const Cart    = require('../models/Cart');
const Product = require('../models/Product');
const Accessory = require('../models/Accessory');
const { protect } = require('../middleware/auth');

// Helper — populate cart items with product data
async function populateCart(cart) {
  if (!cart) return null;
  const populated = [];
  for (const item of cart.items) {
    const Model = item.itemModel === 'Accessory' ? Accessory : Product;
    const doc   = await Model.findById(item.product);
    if (doc) {
      populated.push({
        product:   doc._id,
        itemModel: item.itemModel,
        qty:       item.qty,
        name:      doc.name || doc.name,
        price:     doc.price,
        image:     doc.image,
        brand:     doc.brand || '',
        stock:     doc.stock,
      });
    }
  }
  return { ...cart.toObject(), items: populated };
}

// GET /api/cart
router.get('/', protect, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });
    res.json({ success: true, cart: await populateCart(cart) });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch cart.' });
  }
});

// POST /api/cart/add
router.post('/add', protect, async (req, res) => {
  try {
    const { productId, itemModel = 'Product', qty = 1 } = req.body;
    if (!productId) return res.status(400).json({ success: false, message: 'productId is required.' });

    // Check stock
    const Model = itemModel === 'Accessory' ? Accessory : Product;
    const doc   = await Model.findById(productId);
    if (!doc)             return res.status(404).json({ success: false, message: 'Product not found.' });
    if (doc.stock <= 0)   return res.status(400).json({ success: false, message: 'This item is out of stock.' });

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });

    const existing = cart.items.find(i => i.product.toString() === productId && i.itemModel === itemModel);
    if (existing) {
      existing.qty = Math.min(20, existing.qty + parseInt(qty));
    } else {
      cart.items.push({ product: productId, itemModel, qty: Math.min(20, parseInt(qty)) });
    }

    await cart.save();
    const count = cart.items.reduce((s, i) => s + i.qty, 0);
    res.json({ success: true, count, cart: await populateCart(cart) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Failed to add to cart.' });
  }
});

// PUT /api/cart/update
router.put('/update', protect, async (req, res) => {
  try {
    const { productId, itemModel = 'Product', qty } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found.' });

    const item = cart.items.find(i => i.product.toString() === productId && i.itemModel === itemModel);
    if (!item) return res.status(404).json({ success: false, message: 'Item not in cart.' });

    const newQty = Math.min(20, Math.max(1, parseInt(qty)));
    item.qty = newQty;
    await cart.save();

    const count = cart.items.reduce((s, i) => s + i.qty, 0);
    res.json({ success: true, count, cart: await populateCart(cart) });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to update cart.' });
  }
});

// DELETE /api/cart/remove/:productId
router.delete('/remove/:productId', protect, async (req, res) => {
  try {
    const { itemModel = 'Product' } = req.query;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found.' });

    cart.items = cart.items.filter(
      i => !(i.product.toString() === req.params.productId && i.itemModel === itemModel)
    );
    await cart.save();

    const count = cart.items.reduce((s, i) => s + i.qty, 0);
    res.json({ success: true, count, cart: await populateCart(cart) });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to remove from cart.' });
  }
});

// POST /api/cart/move-to-wishlist/:productId  — save cart item for later
router.post('/move-to-wishlist/:productId', protect, async (req, res) => {
  try {
    const { productId } = req.params;
    const { itemModel = 'Product' } = req.body;
    const Wishlist = require('../models/Wishlist');

    // Remove from cart
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found.' });
    cart.items = cart.items.filter(
      i => !(i.product.toString() === productId && i.itemModel === itemModel)
    );
    await cart.save();

    // Add to wishlist (avoid duplicates)
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) wishlist = await Wishlist.create({ user: req.user._id, items: [] });
    if (!wishlist.items.map(String).includes(productId)) {
      wishlist.items.push(productId);
      await wishlist.save();
    }

    res.json({ success: true, cart: await populateCart(cart) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Failed to save for later.' });
  }
});

// DELETE /api/cart/clear
router.delete('/clear', protect, async (req, res) => {  try {
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
    res.json({ success: true, message: 'Cart cleared.' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to clear cart.' });
  }
});

// GET /api/cart/count
router.get('/count', protect, async (req, res) => {
  try {
    const cart  = await Cart.findOne({ user: req.user._id });
    const count = cart ? cart.items.reduce((s, i) => s + i.qty, 0) : 0;
    res.json({ success: true, count });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to get cart count.' });
  }
});

module.exports = router;
