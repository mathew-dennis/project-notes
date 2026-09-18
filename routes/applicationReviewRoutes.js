// routes/applicationReviewRoutes.js
const express = require('express');
const router = express.Router();

// Import the distinct middlewares
const { verifyToken } = require('../middleware/authenticationManager');
const { verifyRole } = require('../middleware/authorizationManager');
const applicationReviewManager = require('../controllers/applicationReviewManager');
const allowedRoles = ['doc_reviewer',  'visa_staff', 'manager','admin'];


// both these calls go through two middlewere one for authenticating the token then for authorisation of role. 
// Applicant role is blocked because it is not in the array
router.get('/pending-applications', verifyToken,  verifyRole(allowedRoles), applicationReviewManager.getPendingApplications);

// Direct file streaming with URL params (:id and :type)
// we are using the two parameters so both passport and photo can be requested using the type parameter
// id is the application id
// example use-->  GET /api/applicationReview/documents/12/passport
router.get('/documents/:id/:type', verifyToken, verifyRole(allowedRoles), applicationReviewManager.viewDocument);

//this route allows updtating the status of application by the staff
//example use-->  POST /api/applicationReview/update-application-status/12/approved
router.post('/update-application-status/:id/:decision', verifyToken, verifyRole(allowedRoles), applicationReviewManager.updateApplicationStatus);


module.exports = router;