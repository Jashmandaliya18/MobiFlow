/**
 * Quality Control Routes (SRS §3.1.3)
 */
const express = require('express');
const router = express.Router();
const { addInspection, getReport } = require('../controllers/qcController');
const auth = require('../middleware/auth');
const { requirePerm } = require('../middleware/rbac');
const { PERMISSIONS } = require('../config/permissions');

router.post('/add',   auth, requirePerm(PERMISSIONS.QC_ADD),  addInspection);
router.get('/report', auth, requirePerm(PERMISSIONS.QC_VIEW), getReport);

module.exports = router;
