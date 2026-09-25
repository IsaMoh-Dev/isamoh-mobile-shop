const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  brand:       { type: String, required: true, trim: true },
  name:        { type: String, required: true, trim: true },
  price:       { type: Number, required: true, min: 0 },
  oldPrice:    { type: Number, default: null },
  image:       { type: String, required: true },
  image2:      { type: String, default: null },
  image3:      { type: String, default: null },
  description: { type: String, default: '' },
  ram:         { type: String, default: '' },
  storage:     { type: String, default: '' },
  display:     { type: String, default: '' },
  camera:      { type: String, default: '' },
  battery:     { type: String, default: '' },
  processor:   { type: String, default: '' },
  os:          { type: String, default: '' },
  stock:       { type: Number, default: 10, min: 0 },
  category:    { type: String, default: 'smartphone' },
  featured:    { type: Boolean, default: false },
  onSale:      { type: Boolean, default: false },
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

// Text index for search
productSchema.index({ name: 'text', brand: 'text', description: 'text' });
productSchema.index({ brand: 1 });
productSchema.index({ featured: 1 });
productSchema.index({ onSale: 1 });

module.exports = mongoose.model('Product', productSchema);
