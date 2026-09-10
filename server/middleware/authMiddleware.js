// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/Users');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Immediately invalidate tokens of deactivated users
    const dbUser = await User.findById(decoded.id).select('isActive role email');
    if (!dbUser) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists'
      });
    }
    if (dbUser.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Please contact an administrator.'
      });
    }

    req.user = {
      id: decoded.id,
      role: dbUser.role || decoded.role,
      email: dbUser.email || decoded.email
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired' 
      });
    }
    
    res.status(401).json({ 
      success: false, 
      message: 'Not authorized' 
    });
  }
};

const verifyToken = protect;

// Optional auth: decodes the token IF present and attaches req.user,
// but NEVER rejects. Intended to run globally BEFORE maintenanceMiddleware
// so maintenance mode can tell admins apart from everyone else.
// (Route-level verifyToken still enforces auth where required.)
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email
    };
  } catch (error) {
    // Invalid/expired token -> treat as guest, never block here.
    // Protected routes still reject via verifyToken downstream.
  }

  next();
};

module.exports = { protect, verifyToken, optionalAuth };