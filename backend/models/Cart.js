const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product:   { type: mongoose.Schema.Types.ObjectId, refPath: 'items.itemModel', required: true },
  itemModel: { type: String, enum: ['Product', 'Accessory'], default: 'Product' },
  qty:       { type: Number, default: 1, min: 1, max: 20 },
}, { _id: false });

const cartSchema = new mongoose.Schema({
  user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [cartItemSchema],
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);
