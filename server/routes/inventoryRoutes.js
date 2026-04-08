/**
 * Inventory Routes (SRS §3.1.4)
 */
const express = require('express');
const router = express.Router();
const { addItem, updateItem, getAllItems, getLowStock } = require('../controllers/inventoryController');
const auth = require('../middleware/auth');
const { requirePerm } = require('../middleware/rbac');
const { PERMISSIONS } = require('../config/permissions');

router.post('/add',       auth, requirePerm(PERMISSIONS.INV_ADD),       addItem);
router.put('/update/:id', auth, requirePerm(PERMISSIONS.INV_UPDATE),    updateItem);
router.get('/all',        auth, requirePerm(PERMISSIONS.INV_VIEW),      getAllItems);
router.get('/low-stock',  auth, requirePerm(PERMISSIONS.INV_LOW_STOCK), getLowStock);

module.exports = router;
