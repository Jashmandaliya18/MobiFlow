/**
 * Raw Material Routes (SRS §3.1.1)
 * All routes require authentication; actions gated by permission.
 */
const express = require('express');
const router = express.Router();
const { addMaterial, updateMaterial, getAllMaterials, getLowStock } = require('../controllers/rawMaterialController');
const auth = require('../middleware/auth');
const { requirePerm } = require('../middleware/rbac');
const { PERMISSIONS } = require('../config/permissions');

router.post('/add',          auth, requirePerm(PERMISSIONS.RAW_ADD),       addMaterial);
router.put('/update/:id',    auth, requirePerm(PERMISSIONS.RAW_UPDATE),    updateMaterial);
router.get('/all',           auth, requirePerm(PERMISSIONS.RAW_VIEW),      getAllMaterials);
router.get('/low-stock',     auth, requirePerm(PERMISSIONS.RAW_LOW_STOCK), getLowStock);

module.exports = router;
