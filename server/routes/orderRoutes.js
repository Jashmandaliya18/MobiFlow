/**
 * Order Routes (SRS §3.1.5)
 *
 * Permission matrix:
 *   place         : order:place           (distributors)
 *   update        : order:update          (staff: sales/admin)
 *   all           : order:view_all        (staff)
 *   single / hist : order:view_own OR view_all; ownership enforced in controller
 */
const express = require('express');
const router = express.Router();
const { placeOrder, updateOrder, getOrder, getOrderHistory, getAllOrders } = require('../controllers/orderController');
const auth = require('../middleware/auth');
const { requirePerm, requireAnyPerm } = require('../middleware/rbac');
const { PERMISSIONS } = require('../config/permissions');

router.post('/place',                auth, requirePerm(PERMISSIONS.ORDER_PLACE),      placeOrder);
router.put('/update/:id',            auth, requirePerm(PERMISSIONS.ORDER_UPDATE),     updateOrder);
router.get('/all',                   auth, requirePerm(PERMISSIONS.ORDER_VIEW_ALL),   getAllOrders);
router.get('/history/:distributorId',auth, requireAnyPerm(PERMISSIONS.ORDER_VIEW_OWN, PERMISSIONS.ORDER_VIEW_ALL), getOrderHistory);
router.get('/:id',                   auth, requireAnyPerm(PERMISSIONS.ORDER_VIEW_OWN, PERMISSIONS.ORDER_VIEW_ALL), getOrder);

module.exports = router;
