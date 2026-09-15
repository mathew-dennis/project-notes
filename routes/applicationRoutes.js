// routes/applicationRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const applicationManager = require('../controllers/applicationManager');
const authenticationManager = require('../middleware/authenticationManager');

// Keep files in memory so they can be encrypted before being saved to disk.
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Expecting two specific file fields from the frontend.
const uploadFields = upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'passport', maxCount: 1 }
]);

// POST /api/applications -> Create application
router.post('/', authenticationManager.verifyToken, uploadFields, applicationManager.createApplication);

// GET /api/applications -> Retrieve applications for logged-in user
router.get('/', authenticationManager.verifyToken, applicationManager.getUserApplications);

module.exports = router;