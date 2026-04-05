/**
 * Inventory Routes
 * Admin and employees can add/update inventory
 * All authenticated users can view
 */
const express = require('express');
const router = express.Router();
const { addItem, updateItem, getAllItems, getLowStock } = require('../controllers/inventoryController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

router.post('/add', auth, roleAuth('admin', 'employee'), addItem);
router.put('/update/:id', auth, roleAuth('admin', 'employee'), updateItem);
router.get('/all', auth, getAllItems);
router.get('/low-stock', auth, getLowStock);

module.exports = router;
