const express  = require('express');
const { body, validationResult } = require('express-validator');
const crypto   = require('crypto');
const router   = express.Router();

const User          = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const { protect }   = require('../middleware/auth');
const { sendTokenCookie, clearTokenCookie, generateSecureToken } = require('../utils/token');
const { sendPasswordReset } = require('../utils/mailer');

// ── Helper ────────────────────────────────────────────────────────────────
function validationErrors(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, message: errors.array()[0].msg });
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/check-email  — check if email already registered
// ─────────────────────────────────────────────────────────────────────────────
router.post('/check-email', async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ success: false, message: 'Email required.' });
  const exists = !!(await User.findOne({ email }).select('_id'));
  res.json({ exists });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────────────────────
router.post('/register', [
  body('firstName').trim().notEmpty().withMessage('First name is required.'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email address.'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
], async (req, res) => {
  const err = validationErrors(req, res); if (err) return;

  const { firstName, lastName = '', email, password, phone = '' } = req.body;

  try {
    if (await User.findOne({ email })) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const user = await User.create({ firstName, lastName, email, password, phone });
    const token = sendTokenCookie(res, user._id);

    res.status(201).json({
      success: true,
      message: `Welcome, ${user.firstName}! Your account has been created.`,
      token,
      user: { _id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Enter a valid email.'),
  body('password').notEmpty().withMessage('Password is required.'),
], async (req, res) => {
  const err = validationErrors(req, res); if (err) return;

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'No account found with this email.' });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
    }

    const token = sendTokenCookie(res, user._id);

    res.json({
      success: true,
      message: `Welcome back, ${user.firstName}!`,
      token,
      user: { _id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/logout
// ─────────────────────────────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  clearTokenCookie(res);
  res.json({ success: true, message: 'Logged out successfully.' });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me  — get current user from token
// ─────────────────────────────────────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password
// ─────────────────────────────────────────────────────────────────────────────
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Enter a valid email.'),
], async (req, res) => {
  const err = validationErrors(req, res); if (err) return;

  // Always return success to prevent email enumeration
  const successMsg = 'If that email is registered, a reset link has been sent. Check your inbox.';

  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.json({ success: true, message: successMsg });

    // Delete old tokens for this user
    await PasswordReset.deleteMany({ user: user._id });

    const rawToken = generateSecureToken();
    const hashed   = crypto.createHash('sha256').update(rawToken).digest('hex');

    await PasswordReset.create({
      user:      user._id,
      token:     hashed,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl  = `${clientUrl}/reset-password/${rawToken}`;

    await sendPasswordReset(user.email, user.firstName, resetUrl);

    res.json({ success: true, message: successMsg });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/reset-password/:token
// ─────────────────────────────────────────────────────────────────────────────
router.post('/reset-password/:token', [
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
], async (req, res) => {
  const err = validationErrors(req, res); if (err) return;

  try {
    const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const record = await PasswordReset.findOne({
      token:     hashed,
      used:      false,
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
      return res.status(400).json({ success: false, message: 'Reset link is invalid or has expired.' });
    }

    const user = await User.findById(record.user);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    user.password = req.body.password;
    await user.save();

    record.used = true;
    await record.save();

    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Reset failed. Please try again.' });
  }
});

module.exports = router;
