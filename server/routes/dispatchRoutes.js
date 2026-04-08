/**
 * Dispatch Routes (SRS §3.1.6)
 */
const express = require('express');
const router = express.Router();
const { createDispatch, updateDispatch, getAllDispatches } = require('../controllers/dispatchController');
const auth = require('../middleware/auth');
const { requirePerm } = require('../middleware/rbac');
const { PERMISSIONS } = require('../config/permissions');

router.post('/create',    auth, requirePerm(PERMISSIONS.DISPATCH_CREATE), createDispatch);
router.put('/update/:id', auth, requirePerm(PERMISSIONS.DISPATCH_UPDATE), updateDispatch);
router.get('/all',        auth, requirePerm(PERMISSIONS.DISPATCH_VIEW),   getAllDispatches);

module.exports = router;
