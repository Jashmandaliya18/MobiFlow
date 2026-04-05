/**
 * Dashboard & Reports Routes
 * All authenticated users can view dashboard
 * Reports accessible to admin and employees
 */
const express = require('express');
const router = express.Router();
const { getDashboard, getInventoryReport, getOrderReport } = require('../controllers/dashboardController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

router.get('/dashboard', auth, getDashboard);
router.get('/reports/inventory', auth, roleAuth('admin', 'employee'), getInventoryReport);
router.get('/reports/orders', auth, roleAuth('admin', 'employee'), getOrderReport);

module.exports = router;
