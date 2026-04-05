/**
 * Quality Control Routes
 * Admin and employees can add inspections
 * All authenticated users can view reports
 */
const express = require('express');
const router = express.Router();
const { addInspection, getReport } = require('../controllers/qcController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

router.post('/add', auth, roleAuth('admin', 'employee'), addInspection);
router.get('/report', auth, getReport);

module.exports = router;
