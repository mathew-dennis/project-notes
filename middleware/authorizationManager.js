// middleware/authorizationManager.js

exports.verifyRole = (allowedRoles) => {
  return (req, res, next) => {
    // req.user is populated by the verifyToken middleware that runs before this
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: 'Access denied. Role information missing.' });
    }

    // Check if the user's role exists in the array of permitted roles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden. You do not have the required permissions.' });
    }

    // Role is authorized, proceed to the actual route controller
    next(); 
  };
};