/**
 * Role-Based Authorization Middleware
 * Restricts access to specific roles
 * Usage: roleAuth('admin', 'employee')
 */
const roleAuth = (...allowedRoles) => {
  return (req, res, next) => {
    // Ensure auth middleware has run first
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    // Check if user's role is in the allowed roles list
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${req.user.role}.`
      });
    }

    next();
  };
};

module.exports = roleAuth;
