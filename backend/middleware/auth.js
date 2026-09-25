const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT from httpOnly cookie or Authorization header
exports.protect = async (req, res, next) => {
  try {
    let token;

    // 1. Cookie (preferred — httpOnly, not accessible by JS)
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // 2. Authorization header fallback (for mobile / Postman)
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authenticated. Please login.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded.id).select('-password +passwordChangedAt');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }

    // FIX #9: Reject token if password was changed after it was issued
    if (user.passwordChangedAt) {
      const changedAt = Math.floor(user.passwordChangedAt.getTime() / 1000);
      if (decoded.iat < changedAt) {
        return res.status(401).json({ success: false, message: 'Password was recently changed. Please login again.' });
      }
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token. Please login again.' });
  }
};

// Allow unauthenticated access but attach user if token present
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.cookies && req.cookies.token) token = req.cookies.token;
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer '))
      token = req.headers.authorization.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    }
    next();
  } catch {
    next(); // silently proceed without user
  }
};

// Role-based access
exports.requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }
  next();
};

// Admin only (superadmin or admin) — sellers excluded
exports.adminAccess = (req, res, next) => {
  if (!req.user || !['admin', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }
  next();
};

// Admin or Seller — for routes sellers are legitimately allowed to use
exports.adminOrSellerAccess = (req, res, next) => {
  if (!req.user || !['admin', 'superadmin', 'seller'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access required.' });
  }
  next();
};
