const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName:      { type: String, required: true, trim: true },
  lastName:       { type: String, default: '',    trim: true },
  email:          { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:       { type: String, required: true, minlength: 6, select: false },
  phone:          { type: String, default: '' },
  avatar:         { type: String, default: null },
  role:           { type: String, enum: ['customer','seller','admin','superadmin'], default: 'customer' },
  defaultAddress: { type: String, default: '' },
  defaultCity:    { type: String, default: '' },
  newsletterSubscribed: { type: Boolean, default: false },
  currency:       { type: String, enum: ['USD','ETB'], default: 'USD' },
  // FIX #9: Track when password was changed to invalidate old tokens
  passwordChangedAt: { type: Date, select: false },
}, { timestamps: { createdAt: 'registerDate', updatedAt: 'updatedAt' } });

// Hash password before save + record change timestamp
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  // FIX #9: Record when password was changed (skip on first-ever save)
  if (!this.isNew) this.passwordChangedAt = new Date();
  next();
});

// Compare password
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Never expose password in JSON responses
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
