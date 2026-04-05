/**
 * Dispatch Routes
 * Admin and employees can manage dispatches
 */
const express = require('express');
const router = express.Router();
const { createDispatch, updateDispatch, getAllDispatches } = require('../controllers/dispatchController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

router.post('/create', auth, roleAuth('admin', 'employee'), createDispatch);
router.put('/update/:id', auth, roleAuth('admin', 'employee'), updateDispatch);
router.get('/all', auth, getAllDispatches);

module.exports = router;
