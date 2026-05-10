const jwt = require('jsonwebtoken');
const config = require('../config/config');

const protect = (req, res, next) => {
  try {
    // 1. Read the token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    // 2. Verify the signature and decode the payload
    const decoded = jwt.verify(token, config.jwt.secret);

    // 3. Attach user info to req.user
    req.user = {
      id: decoded.id,
      role: decoded.role,
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token invalid or expired' });
  }
};

const authorise = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
      });
    }
    next();
  };
};

module.exports = { protect, authorise };
