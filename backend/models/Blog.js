const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title:   { type: String, required: true, trim: true },
  image:   { type: String, default: 'assets/blog/blog1.jpg' },
  content: { type: String, required: true },
  slug:    { type: String, unique: true },
}, { timestamps: { createdAt: 'publishedAt', updatedAt: 'updatedAt' } });

blogSchema.index({ slug: 1 });

module.exports = mongoose.model('Blog', blogSchema);
