/**
 * Auth Routes
 * Public: register, login
 * Protected: getUsers (admin), updateRole (admin)
 */
const express = require('express');
const router = express.Router();
const { register, login, getUsers, updateRole } = require('../controllers/authController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes (admin only)
router.get('/users', auth, roleAuth('admin'), getUsers);
router.put('/users/role', auth, roleAuth('admin'), updateRole);

module.exports = router;
