/**
 * Auth Controller (SRS §3.1.7, §4.1.1, §4.1.2)
 *
 * - register / login with account lockout after 5 failed attempts in 15 minutes
 * - login returns the effective permission set so the client can gate UI
 * - admin endpoints for role changes, per-user permission overrides,
 *   and discovering the full permission catalog
 */
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const {
  registerSchema,
  loginSchema,
  updateRoleSchema,
  updatePermissionsSchema
} = require('../validators/validators');
const {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  ALL_PERMS,
  permissionsForUser
} = require('../config/permissions');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Build the client-visible user payload (public profile + effective perms)
const buildSession = (user) => {
  const perms = Array.from(permissionsForUser(user));
  return {
    user: { ...user.toJSON(), permissions: perms },
    token: generateToken(user)
  };
};

/**
 * POST /auth/register
 */
exports.register = async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const existingUser = await User.findOne({ email: value.email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    const user = await User.create(value);
    const session = buildSession(user);

    res.status(201).json({ message: 'User registered successfully', ...session });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

/**
 * POST /auth/login  (SRS §4.1.1)
 */
exports.login = async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Select password explicitly in case schema ever becomes select:false
    const user = await User.findOne({ email: value.email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (!user.active) {
      return res.status(403).json({ message: 'Account is disabled. Contact an administrator.' });
    }

    if (user.isLocked()) {
      const retryAfter = Math.ceil((user.locked_until.getTime() - Date.now()) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(423).json({
        message: 'Account temporarily locked due to too many failed login attempts. Try again later.'
      });
    }

    const isMatch = await user.comparePassword(value.password);
    if (!isMatch) {
      await user.registerFailedLogin();
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    await user.registerSuccessfulLogin();
    const session = buildSession(user);
    res.json({ message: 'Login successful', ...session });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

/**
 * GET /auth/me
 * Returns the current user's profile + effective permissions.
 * Any authenticated user can call this; useful for hydrating the frontend.
 */
exports.getCurrentUser = async (req, res) => {
  try {
    const perms = Array.from(permissionsForUser(req.user));
    res.json({ ...req.user.toJSON(), permissions: perms });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error fetching current user.' });
  }
};

/**
 * GET /auth/users
 */
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    // Attach effective permissions so admin UI can show them.
    const enriched = users.map((u) => ({
      ...u.toJSON(),
      permissions: Array.from(permissionsForUser(u))
    }));
    res.json(enriched);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error fetching users.' });
  }
};

/**
 * PUT /auth/users/role
 */
exports.updateRole = async (req, res) => {
  try {
    const { error, value } = updateRoleSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const user = await User.findByIdAndUpdate(
      value.userId,
      { role: value.role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    console.info(`[AUDIT] role-change actor=${req.user._id} target=${user._id} new_role=${value.role}`);
    res.json({
      message: 'Role updated successfully',
      user: { ...user.toJSON(), permissions: Array.from(permissionsForUser(user)) }
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ message: 'Server error updating role.' });
  }
};

/**
 * PUT /auth/users/perms
 * Set per-user permission overrides (granted / revoked arrays).
 * Unknown permission keys are rejected to prevent typos leaking into the DB.
 */
exports.updatePermissions = async (req, res) => {
  try {
    const { error, value } = updatePermissionsSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const validSet = new Set(ALL_PERMS);
    const bad = [...value.permissions_granted, ...value.permissions_revoked].filter((p) => !validSet.has(p));
    if (bad.length) {
      return res.status(400).json({ message: `Unknown permission keys: ${bad.join(', ')}` });
    }

    const user = await User.findByIdAndUpdate(
      value.userId,
      {
        permissions_granted: value.permissions_granted,
        permissions_revoked: value.permissions_revoked
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    console.info(
      `[AUDIT] perm-change actor=${req.user._id} target=${user._id} ` +
      `granted=${value.permissions_granted.join(',')} revoked=${value.permissions_revoked.join(',')}`
    );

    res.json({
      message: 'Permissions updated successfully',
      user: { ...user.toJSON(), permissions: Array.from(permissionsForUser(user)) }
    });
  } catch (error) {
    console.error('Update permissions error:', error);
    res.status(500).json({ message: 'Server error updating permissions.' });
  }
};

/**
 * GET /auth/permissions
 * Returns the full permission catalog + default role mapping so the admin UI
 * can render the role/perm matrix without hard-coding it.
 */
exports.getPermissionCatalog = async (_req, res) => {
  res.json({
    permissions: PERMISSIONS,
    all: ALL_PERMS,
    role_defaults: ROLE_PERMISSIONS
  });
};
