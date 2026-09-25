const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  key:   { type: String, required: true, unique: true },
  value: { type: String, default: '' },
}, { timestamps: false });

module.exports = mongoose.model('Setting', settingSchema);
