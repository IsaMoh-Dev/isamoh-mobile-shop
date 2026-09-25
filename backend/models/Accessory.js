const mongoose = require('mongoose');

const accessorySchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  category:    { type: String, default: 'Cases', trim: true },
  price:       { type: Number, required: true, min: 0 },
  oldPrice:    { type: Number, default: null },
  image:       { type: String, default: 'assets/products/1.png' },
  description: { type: String, default: '' },
  stock:       { type: Number, default: 10, min: 0 },
  featured:    { type: Boolean, default: false },
  onSale:      { type: Boolean, default: false },
}, { timestamps: true });

accessorySchema.index({ category: 1 });
accessorySchema.index({ name: 'text' });

module.exports = mongoose.model('Accessory', accessorySchema);
