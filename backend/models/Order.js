const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product:   { type: mongoose.Schema.Types.ObjectId, refPath: 'itemModel' },
  itemModel: { type: String, enum: ['Product', 'Accessory'], default: 'Product' },
  itemName:  { type: String, required: true },
  itemPrice: { type: Number, required: true },
  itemImage: { type: String, default: '' },
  quantity:  { type: Number, required: true, min: 1, default: 1 },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fullName:      { type: String, required: true },
  email:         { type: String, required: true },
  phone:         { type: String, required: true },
  address:       { type: String, required: true },
  city:          { type: String, required: true },
  items:         [orderItemSchema],
  totalAmount:   { type: Number, required: true },
  currency:      { type: String, default: 'USD' },
  paymentMethod: { type: String, enum: ['cod','bank','telebirr','cbe'], default: 'cod' },
  status:        {
    type: String,
    enum: ['pending','processing','shipped','delivered','cancelled'],
    default: 'pending',
  },
  couponCode:    { type: String, default: '' },
  couponDiscount:{ type: Number, default: 0 },
}, { timestamps: { createdAt: 'orderDate', updatedAt: 'updatedAt' } });

orderSchema.index({ user: 1, orderDate: -1 });
orderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', orderSchema);
