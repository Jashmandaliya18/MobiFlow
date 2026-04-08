/**
 * Manufacturing Routes (SRS §3.1.2)
 */
const express = require('express');
const router = express.Router();
const { createBatch, updateBatch, getAllBatches } = require('../controllers/manufacturingController');
const auth = require('../middleware/auth');
const { requirePerm } = require('../middleware/rbac');
const { PERMISSIONS } = require('../config/permissions');

router.post('/create',    auth, requirePerm(PERMISSIONS.MFG_CREATE), createBatch);
router.put('/update/:id', auth, requirePerm(PERMISSIONS.MFG_UPDATE), updateBatch);
router.get('/all',        auth, requirePerm(PERMISSIONS.MFG_VIEW),   getAllBatches);

module.exports = router;
