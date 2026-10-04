const express = require('express');
const router  = express.Router();
const Order   = require('../models/Order');
const Cart    = require('../models/Cart');
const Product = require('../models/Product');
const Coupon  = require('../models/Coupon');
const { protect, adminAccess } = require('../middleware/auth');
const { sendOrderConfirmation, sendOrderCancellation } = require('../utils/mailer');

// ─────────────────────────────────────────────────────────────────────────────
// Helper — restore stock for all items in an order
// ─────────────────────────────────────────────────────────────────────────────
async function restoreStock(order) {
  for (const item of order.items) {
    const Model = item.itemModel === 'Accessory' ? require('../models/Accessory') : Product;
    await Model.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTE: Static routes (/my, /stats) MUST be declared before /:id routes
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/orders/my  — user's own orders
router.get('/my', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ orderDate: -1 });
    res.json({ success: true, orders });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
  }
});

// ADMIN: GET /api/orders/stats  — dashboard stats
router.get('/stats', protect, adminAccess, async (req, res) => {
  try {
    const totalOrders  = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    const statusCounts = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Last 7 days revenue
    const sevenDays = [];
    for (let i = 6; i >= 0; i--) {
      const date  = new Date();
      date.setDate(date.getDate() - i);
      const start = new Date(date.setHours(0, 0, 0, 0));
      const end   = new Date(date.setHours(23, 59, 59, 999));

      const day = await Order.aggregate([
        { $match: { orderDate: { $gte: start, $lte: end }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
      ]);

      sevenDays.push({
        date:    start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: day[0]?.revenue || 0,
        orders:  day[0]?.count   || 0,
      });
    }

    // Top 5 products
    const topProducts = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.itemName', totalQty: { $sum: '$items.quantity' }, totalRev: { $sum: { $multiply: ['$items.itemPrice', '$items.quantity'] } } } },
      { $sort: { totalQty: -1 } },
      { $limit: 5 },
    ]);

    // Recent 10 orders for dashboard table
    const recentOrders = await Order.find()
      .sort({ orderDate: -1 })
      .limit(10)
      .select('fullName totalAmount paymentMethod status orderDate');

    res.json({
      success: true,
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      statusCounts: Object.fromEntries(statusCounts.map(s => [s._id, s.count])),
      sevenDays,
      topProducts,
      recentOrders,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/orders  — place order
// Fix #2: Atomic coupon application
// Fix #6: Atomic stock deduction
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const { fullName, email, phone, address, city, paymentMethod = 'cod', couponCode = '', couponId = '' } = req.body;

    if (!fullName || !email || !phone || !address || !city) {
      return res.status(400).json({ success: false, message: 'All delivery fields are required.' });
    }

    // Get cart
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart || !cart.items.length) {
      return res.status(400).json({ success: false, message: 'Your cart is empty.' });
    }

    // Build order items + FIX #6: atomic stock deduction
    const orderItems = [];
    let subtotal = 0;
    const stockUpdates = []; // track successful deductions for rollback

    for (const cartItem of cart.items) {
      const Model = cartItem.itemModel === 'Accessory'
        ? require('../models/Accessory')
        : Product;

      // Atomic: only deduct if enough stock exists
      const doc = await Model.findOneAndUpdate(
        { _id: cartItem.product, stock: { $gte: cartItem.qty } },
        { $inc: { stock: -cartItem.qty } },
        { new: true }
      );

      if (!doc) {
        // Rollback any stock already deducted
        for (const { Model: M, id, qty } of stockUpdates) {
          await M.findByIdAndUpdate(id, { $inc: { stock: qty } });
        }
        // Get item name for error message
        const item = await Model.findById(cartItem.product).select('name stock');
        const reason = item
          ? `"${item.name}" only has ${item.stock} unit(s) in stock`
          : 'Item not found';
        return res.status(400).json({ success: false, message: `Cannot place order — ${reason}.` });
      }

      stockUpdates.push({ Model, id: doc._id, qty: cartItem.qty });

      orderItems.push({
        product:   doc._id,
        itemModel: cartItem.itemModel,
        itemName:  doc.name,
        itemPrice: doc.price,
        itemImage: doc.image,
        quantity:  cartItem.qty,
      });

      subtotal += doc.price * cartItem.qty;
    }

    if (!orderItems.length) {
      return res.status(400).json({ success: false, message: 'No valid items found in cart.' });
    }

    // FIX #2: Atomic coupon validation — check-and-increment in one operation
    let couponDiscount = 0;
    let appliedCouponCode = '';

    if (couponId) {
      const now = new Date();
      const atomicCoupon = await Coupon.findOneAndUpdate(
        {
          _id:      couponId,
          isActive: true,
          $expr:    { $lt: ['$usedCount', '$maxUses'] },
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: null },
            { expiresAt: { $gt: now } },
          ],
          minOrder: { $lte: subtotal },
        },
        { $inc: { usedCount: 1 } },
        { new: false } // get the doc before increment so we can compute discount
      );

      if (atomicCoupon) {
        couponDiscount = atomicCoupon.type === 'percent'
          ? Math.round(subtotal * (atomicCoupon.value / 100) * 100) / 100
          : Math.min(atomicCoupon.value, subtotal);
        appliedCouponCode = atomicCoupon.code;
      }
      // If atomicCoupon is null, coupon was invalid/expired/exhausted — silently skip
    }

    const totalAmount = Math.max(0, subtotal - couponDiscount);

    // Create order
    const order = await Order.create({
      user: req.user._id,
      fullName, email, phone, address, city,
      items: orderItems,
      totalAmount,
      paymentMethod,
      couponCode:     appliedCouponCode,
      couponDiscount,
    });

    // Clear cart
    cart.items = [];
    await cart.save();

    // Send confirmation email (non-blocking)
    sendOrderConfirmation(order).catch(console.error);

    res.status(201).json({ success: true, order });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Order failed. Please try again.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/orders/:id/cancel  — customer cancels own order
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/cancel', protect, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    if (!['pending', 'processing'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `This order cannot be cancelled — it has already been ${order.status}.`,
      });
    }

    order.status = 'cancelled';
    await order.save();

    // Restore stock
    await restoreStock(order);

    // Send cancellation email
    sendOrderCancellation(order).catch(console.error);

    res.json({ success: true, message: `Order #${order._id} has been cancelled.` });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Failed to cancel order.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: GET /api/orders  — all orders
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', protect, adminAccess, async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const query = status ? { status } : {};
    const total  = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'firstName lastName email')
      .sort({ orderDate: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json({ success: true, total, orders });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: PUT /api/orders/:id/status  — update order status
// Fix #3: Restore stock when admin sets status to 'cancelled'
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id/status', protect, adminAccess, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    const wasNotCancelled = order.status !== 'cancelled';
    order.status = status;
    await order.save();

    // FIX #3: Restore stock when admin cancels an order
    if (status === 'cancelled' && wasNotCancelled) {
      await restoreStock(order);
    }

    res.json({ success: true, order });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to update order status.' });
  }
});

module.exports = router;
