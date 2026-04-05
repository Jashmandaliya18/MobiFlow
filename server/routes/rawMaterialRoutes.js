/**
 * Raw Material Routes
 * All routes require authentication
 * Add/Update restricted to admin and employee
 */
const express = require('express');
const router = express.Router();
const { addMaterial, updateMaterial, getAllMaterials, getLowStock } = require('../controllers/rawMaterialController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

router.post('/add', auth, roleAuth('admin', 'employee'), addMaterial);
router.put('/update/:id', auth, roleAuth('admin', 'employee'), updateMaterial);
router.get('/all', auth, getAllMaterials);
router.get('/low-stock', auth, getLowStock);

module.exports = router;
