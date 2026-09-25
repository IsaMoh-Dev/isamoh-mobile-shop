const mongoose = require('mongoose');

const passwordResetSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token:     { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  used:      { type: Boolean, default: false },
}, { timestamps: { createdAt: 'createdAt' } });

// Auto-delete expired tokens after 2 hours
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 7200 });

module.exports = mongoose.model('PasswordReset', passwordResetSchema);
