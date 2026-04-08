/**
 * Authentication Middleware (SRS §4.1.1)
 * Verifies JWT token and enforces account active + lockout status on every request.
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Load full user (minus password) so RBAC middleware sees role + permission overrides.
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Token is invalid. User not found.' });
    }

    // Disabled / locked accounts are session-level failures — return 401 so
    // the client-side interceptor evicts the session and redirects to login.
    if (!user.active) {
      return res.status(401).json({ message: 'Account is disabled.' });
    }

    if (user.isLocked()) {
      return res.status(423).json({ message: 'Account is temporarily locked.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({ message: 'Token is invalid or expired.' });
  }
};

module.exports = auth;
