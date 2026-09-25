const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema({
  name:    { type: String, required: true, trim: true },
  email:   { type: String, required: true, trim: true },
  subject: { type: String, default: 'General', trim: true },
  message: { type: String, required: true },
  isRead:  { type: Boolean, default: false },
}, { timestamps: { createdAt: 'createdAt' } });

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
