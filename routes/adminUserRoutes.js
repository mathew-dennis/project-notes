
// routes/adminUserRoutes.js
const express = require('express');
const router = express.Router();
const adminManager = require('../controllers/adminManager');
const { verifyToken } = require('../middleware/authenticationManager');
const { verifyRole } = require('../middleware/authorizationManager');

// Protect all routes in this file for 'admin' only
router.use(verifyToken, verifyRole(['admin']));

router.post('/users', adminManager.createUser);
router.get('/users', adminManager.getAllUsers);
router.put('/users/:id/:role', adminManager.updateUserRole);
router.patch('/users/:id/deactivate', adminManager.deactivateUser);
router.patch('/users/:id/activate', adminManager.activateUser);
router.delete('/users/:id', adminManager.deleteUser);

module.exports = router;