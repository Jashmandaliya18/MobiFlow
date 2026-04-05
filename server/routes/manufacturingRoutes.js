/**
 * Manufacturing Routes
 * Admin and employees can create/update batches
 * All authenticated users can view
 */
const express = require('express');
const router = express.Router();
const { createBatch, updateBatch, getAllBatches } = require('../controllers/manufacturingController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

router.post('/create', auth, roleAuth('admin', 'employee'), createBatch);
router.put('/update/:id', auth, roleAuth('admin', 'employee'), updateBatch);
router.get('/all', auth, getAllBatches);

module.exports = router;
