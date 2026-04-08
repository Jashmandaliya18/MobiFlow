/**
 * Auth Routes (SRS §3.1.7, §4.1.1)
 *
 * Public: register, login, password policy discovery
 * Admin:  list users, update role, update per-user permission overrides,
 *         list the full permission catalog
 */
const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getUsers,
  updateRole,
  updatePermissions,
  getPermissionCatalog,
  getCurrentUser
} = require('../controllers/authController');
const auth = require('../middleware/auth');
const { requirePerm } = require('../middleware/rbac');
const { PERMISSIONS } = require('../config/permissions');

// Public
router.post('/register', register);
router.post('/login', login);

// Current user (introspection) — any authenticated user
router.get('/me', auth, getCurrentUser);

// User administration
router.get('/users',          auth, requirePerm(PERMISSIONS.USER_VIEW),         getUsers);
router.put('/users/role',     auth, requirePerm(PERMISSIONS.USER_MANAGE_ROLE),  updateRole);
router.put('/users/perms',    auth, requirePerm(PERMISSIONS.USER_MANAGE_PERMS), updatePermissions);
router.get('/permissions',    auth, requirePerm(PERMISSIONS.USER_MANAGE_PERMS), getPermissionCatalog);

module.exports = router;
