/**
 * User Model
 * Handles user data with password hashing, lockout, and fine-grained permissions.
 *
 * Aligned with SRS §2.3 (user characteristics), §3.1.7 (user & role management),
 * and §4.1.1 / §4.1.2 (authentication & authorization).
 *
 * Roles:
 *   - admin        : full system administration
 *   - procurement  : raw material intake, supplier mgmt
 *   - warehouse    : inventory, stock movements, picking
 *   - production   : manufacturing batches, stage progression
 *   - qa           : quality control, inspection, dispositioning
 *   - dispatch     : dispatch scheduling, delivery updates
 *   - distributor  : external customer placing and tracking orders
 *   - employee     : legacy generic operator (kept for backwards compatibility
 *                    with earlier seed data; treated as combined production+qa+warehouse)
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = [
  'admin',
  'procurement',
  'warehouse',
  'production',
  'qa',
  'dispatch',
  'distributor',
  'employee'
];

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  role: {
    type: String,
    enum: ROLES,
    default: 'employee'
  },
  // Per-user permission overrides. Granted perms ADD to role defaults;
  // revoked perms REMOVE from role defaults. Enables SRS §4.1.2 fine-grained RBAC.
  permissions_granted: {
    type: [String],
    default: []
  },
  permissions_revoked: {
    type: [String],
    default: []
  },
  // Account lockout state (SRS §4.1.1: 5 failed attempts in 15 minutes -> lock)
  failed_login_attempts: {
    type: Number,
    default: 0
  },
  first_failed_at: {
    type: Date,
    default: null
  },
  locked_until: {
    type: Date,
    default: null
  },
  last_login_at: {
    type: Date,
    default: null
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Is account currently locked out?
userSchema.methods.isLocked = function() {
  return !!(this.locked_until && this.locked_until.getTime() > Date.now());
};

// Register a failed login attempt. 5 within 15 minutes => lock 15 minutes.
userSchema.methods.registerFailedLogin = async function() {
  const now = Date.now();
  const WINDOW_MS = 15 * 60 * 1000;
  const LOCK_MS = 15 * 60 * 1000;
  const MAX_ATTEMPTS = 5;

  if (!this.first_failed_at || (now - this.first_failed_at.getTime()) > WINDOW_MS) {
    this.first_failed_at = new Date(now);
    this.failed_login_attempts = 1;
  } else {
    this.failed_login_attempts += 1;
  }

  if (this.failed_login_attempts >= MAX_ATTEMPTS) {
    this.locked_until = new Date(now + LOCK_MS);
  }

  await this.save();
};

// Clear failed-login state after a successful login.
userSchema.methods.registerSuccessfulLogin = async function() {
  this.failed_login_attempts = 0;
  this.first_failed_at = null;
  this.locked_until = null;
  this.last_login_at = new Date();
  await this.save();
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.failed_login_attempts;
  delete user.first_failed_at;
  delete user.locked_until;
  return user;
};

userSchema.statics.ROLES = ROLES;

module.exports = mongoose.model('User', userSchema);
