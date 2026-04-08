/**
 * Dashboard & Reports Routes (SRS §3.1.8)
 *
 * Each report endpoint accepts an optional `?format=csv|pdf` query string.
 * Without the query it returns the existing JSON shape so the frontend
 * data tables keep working.
 */
const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getInventoryReport,
  getOrderReport,
  getRawMaterialReport,
  getManufacturingReport,
  getQualityReport
} = require('../controllers/dashboardController');
const auth = require('../middleware/auth');
const { requirePerm } = require('../middleware/rbac');
const { PERMISSIONS } = require('../config/permissions');

router.get('/dashboard',              auth, requirePerm(PERMISSIONS.DASHBOARD_VIEW),        getDashboard);
router.get('/reports/inventory',      auth, requirePerm(PERMISSIONS.REPORT_INVENTORY),      getInventoryReport);
router.get('/reports/orders',         auth, requirePerm(PERMISSIONS.REPORT_ORDERS),         getOrderReport);
router.get('/reports/raw-materials',  auth, requirePerm(PERMISSIONS.REPORT_RAW),            getRawMaterialReport);
router.get('/reports/manufacturing',  auth, requirePerm(PERMISSIONS.REPORT_MANUFACTURING),  getManufacturingReport);
router.get('/reports/quality',        auth, requirePerm(PERMISSIONS.REPORT_QUALITY),        getQualityReport);

module.exports = router;
