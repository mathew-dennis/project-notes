// middleware/authenticationManager.js
const jwt = require('jsonwebtoken');

// Keep secret key consistent across loginManager and authenticationManager
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_123';

exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  // Token is sent as "Bearer <token_string>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach { userId, role } payload to the request
    next(); // Pass control to the next handler/controller
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
};
