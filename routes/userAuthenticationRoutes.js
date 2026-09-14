// routes/userAuthenticationRoutes.js
const express = require('express');
const router = express.Router();

const loginManager = require('../controllers/loginManager');
const authenticationManager = require('../middleware/authenticationManager');

// Public route: generate token on login
router.post('/login', loginManager.handleLogin);

// Protected route: require valid token to view profile
router.get('/profile', authenticationManager.verifyToken, (req, res) => {
  res.json({
    message: 'Welcome to your protected profile!',
    user: req.user
  });
});

module.exports = router;
