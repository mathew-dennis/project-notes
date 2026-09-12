const express = require('express');
const router = express.Router();
const registrationManager = require('../controllers/newRegistrationManager');

// Matches POST /api/register
router.post('/', registrationManager.registerUser);

module.exports = router;
