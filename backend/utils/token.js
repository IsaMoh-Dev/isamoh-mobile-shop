const jwt    = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Sign a JWT and set it as an httpOnly cookie on the response.
 * Also returns the token string for use in API responses.
 */
function sendTokenCookie(res, userId) {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  const cookieOptions = {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production', // HTTPS only in prod
    sameSite: 'lax',
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days in ms
    path:     '/',
  };

  res.cookie('token', token, cookieOptions);
  return token;
}

/**
 * Clear the auth cookie (used on logout).
 */
function clearTokenCookie(res) {
  res.cookie('token', '', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires:  new Date(0),
    path:     '/',
  });
}

/**
 * Generate a cryptographically secure random token (for password resets etc.)
 */
function generateSecureToken() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = { sendTokenCookie, clearTokenCookie, generateSecureToken };
