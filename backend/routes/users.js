const express = require('express');
const router  = express.Router();
const { body, validationResult } = require('express-validator');
const User     = require('../models/User');
const { protect, requireRole } = require('../middleware/auth');
const upload   = require('../middleware/upload');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');

// GET /api/users/profile
router.get('/profile', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// PUT /api/users/profile
router.put('/profile', protect, [
  body('firstName').trim().notEmpty().withMessage('First name is required.'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email address.'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ success: false, message: errors.array()[0].msg });

  try {
    const { firstName, lastName, email, phone, defaultAddress, defaultCity, currency } = req.body;

    // Check email uniqueness
    const conflict = await User.findOne({ email, _id: { $ne: req.user._id } });
    if (conflict) return res.status(409).json({ success: false, message: 'Email already used by another account.' });

    const updated = await User.findByIdAndUpdate(req.user._id, {
      firstName, lastName, email, phone, defaultAddress, defaultCity,
      ...(currency && { currency }),
    }, { new: true, runValidators: true });

    res.json({ success: true, message: 'Profile updated successfully!', user: updated });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Update failed.' });
  }
});

// PUT /api/users/password
router.put('/password', protect, [
  body('currentPassword').notEmpty().withMessage('Current password is required.'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters.'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ success: false, message: errors.array()[0].msg });

  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    const match = await user.comparePassword(currentPassword);
    if (!match) return res.status(401).json({ success: false, message: 'Current password is incorrect.' });

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully!' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Password change failed.' });
  }
});

// POST /api/users/avatar  — upload profile picture to Cloudinary
router.post('/avatar', protect, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
    // Delete old avatar from Cloudinary if it exists
    const existing = await User.findById(req.user._id).select('avatar');
    if (existing?.avatar) await deleteFromCloudinary(existing.avatar);
    // Upload new avatar
    const avatarUrl = await uploadToCloudinary(req.file.buffer, 'isamoh/avatars');
    const user = await User.findByIdAndUpdate(req.user._id, { avatar: avatarUrl }, { new: true });
    res.json({ success: true, message: 'Avatar updated!', avatar: user.avatar });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Upload failed.' });
  }
});

// DELETE /api/users/avatar
router.delete('/avatar', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { avatar: null });
    res.json({ success: true, message: 'Avatar removed.' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to remove avatar.' });
  }
});

// PUT /api/users/settings
router.put('/settings', protect, async (req, res) => {
  try {
    const { currency, newsletterSubscribed } = req.body;
    const update = {};
    if (currency)               update.currency = currency;
    if (newsletterSubscribed !== undefined) {
      update.newsletterSubscribed = newsletterSubscribed;
      // Sync with Newsletter collection
      const Newsletter = require('../models/Newsletter');
      if (newsletterSubscribed) {
        await Newsletter.findOneAndUpdate(
          { email: req.user.email },
          { email: req.user.email },
          { upsert: true }
        );
      } else {
        await Newsletter.findOneAndDelete({ email: req.user.email });
      }
    }
    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true });
    res.json({ success: true, message: 'Settings saved!', user });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to save settings.' });
  }
});

// DELETE /api/users/account  — delete own account
router.delete('/account', protect, async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ success: false, message: 'Incorrect password. Account not deleted.' });

    // Clean up related data
    await require('../models/Cart').deleteMany({ user: req.user._id });
    await require('../models/Wishlist').deleteMany({ user: req.user._id });
    await require('../models/Review').deleteMany({ user: req.user._id });
    await require('../models/PasswordReset').deleteMany({ user: req.user._id });
    await User.findByIdAndDelete(req.user._id);

    res.clearCookie('token');
    res.json({ success: true, message: 'Account deleted.' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to delete account.' });
  }
});

// ── ADMIN ────────────────────────────────────────────────────────────────────

// GET /api/users  — admin: list all users
router.get('/', protect, requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { page = 1, limit = 50, q } = req.query;
    const query = q ? { $or: [{ firstName: { $regex: q, $options: 'i' } }, { email: { $regex: q, $options: 'i' } }] } : {};
    const total = await User.countDocuments(query);
    const users = await User.find(query).sort({ registerDate: -1 }).skip((parseInt(page)-1)*parseInt(limit)).limit(parseInt(limit));
    res.json({ success: true, total, users });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
});

// PUT /api/users/:id/role  — admin: change user role
router.put('/:id/role', protect, requireRole('superadmin'), async (req, res) => {
  try {
    const { role } = req.body;
    const allowed = ['customer','seller','admin','superadmin'];
    if (!allowed.includes(role)) return res.status(400).json({ success: false, message: 'Invalid role.' });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to update role.' });
  }
});

// DELETE /api/users/:id  — admin: delete user
router.delete('/:id', protect, requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    // FIX #10: Prevent deleting yourself or another superadmin (unless you are superadmin)
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account from here. Use Account Settings.' });
    }
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'User not found.' });
    if (target.role === 'superadmin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Only a superadmin can delete another superadmin.' });
    }

    // FIX #10: Clean up all related data — same as self-delete
    await require('../models/Cart').deleteMany({ user: target._id });
    await require('../models/Wishlist').deleteMany({ user: target._id });
    await require('../models/Review').deleteMany({ user: target._id });
    await require('../models/PasswordReset').deleteMany({ user: target._id });
    await User.findByIdAndDelete(target._id);

    res.json({ success: true, message: 'User deleted.' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to delete user.' });
  }
});

module.exports = router;
