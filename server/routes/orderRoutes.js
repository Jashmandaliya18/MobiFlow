/**
 * Order Routes
 * Distributors can place orders and view history
 * Admin/employees can update status and view all
 */
const express = require('express');
const router = express.Router();
const { placeOrder, updateOrder, getOrder, getOrderHistory, getAllOrders } = require('../controllers/orderController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

router.post('/place', auth, roleAuth('distributor'), placeOrder);
router.put('/update/:id', auth, roleAuth('admin', 'employee'), updateOrder);
router.get('/all', auth, roleAuth('admin', 'employee'), getAllOrders);
router.get('/history/:distributorId', auth, getOrderHistory);
router.get('/:id', auth, getOrder);

module.exports = router;
