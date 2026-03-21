// middleware/roleMiddleware.js

// Check if user is admin
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ 
      success: false, 
      message: 'Access denied. Admin privileges required.' 
    });
  }
};

// Check if user is engineer
const engineer = (req, res, next) => {
  if (req.user && (req.user.role === 'engineer' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ 
      success: false, 
      message: 'Access denied. Engineer privileges required.' 
    });
  }
};

// Check if user is customer (regular user)
const customer = (req, res, next) => {
  if (req.user && req.user.role === 'user') {
    next();
  } else {
    res.status(403).json({ 
      success: false, 
      message: 'Access denied. Customer privileges required.' 
    });
  }
};

module.exports = { admin, engineer, customer };