const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Authentication middleware
const auth = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    }

    // Check if no token
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      
      // Get user from token
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        return res.status(401).json({ message: 'Token is not valid - user not found' });
      }

      // Check if user is active
      if (user.status === 'suspended') {
        return res.status(403).json({ message: 'Account is suspended' });
      }

      // Add user to request
      req.user = user;
      next();
    } catch (err) {
      console.error('Token verification failed:', err);
      return res.status(401).json({ message: 'Token is not valid' });
    }
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ message: 'Server error in authentication' });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required roles: ${roles.join(', ')}` 
      });
    }

    next();
  };
};

// Admin only middleware
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Exporter only middleware
const exporterOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'exporter') {
    return res.status(403).json({ message: 'Exporter access required' });
  }
  next();
};

// Verified users only middleware
const verifiedOnly = (req, res, next) => {
  if (!req.user || !req.user.isVerified) {
    return res.status(403).json({ 
      message: 'Email verification required. Please verify your email to access this feature.' 
    });
  }
  next();
};

// Owner or admin middleware (for resource access)
const ownerOrAdmin = (resourceUserIdField = 'userId') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Admin can access everything
      if (req.user.role === 'admin') {
        return next();
      }

      // Get resource owner ID from request params, body, or query
      const resourceUserId = req.params[resourceUserIdField] || 
                            req.body[resourceUserIdField] || 
                            req.query[resourceUserIdField];

      // Check if user is the owner
      if (req.user._id.toString() !== resourceUserId?.toString()) {
        return res.status(403).json({ 
          message: 'Access denied. You can only access your own resources.' 
        });
      }

      next();
    } catch (err) {
      console.error('Owner/Admin check error:', err);
      return res.status(500).json({ message: 'Server error in authorization' });
    }
  };
};

// Optional auth middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        const user = await User.findById(decoded.userId).select('-password');
        
        if (user && user.status !== 'suspended') {
          req.user = user;
        }
      } catch (err) {
        // Ignore token errors in optional auth
        console.log('Optional auth token error (ignored):', err.message);
      }
    }

    next();
  } catch (err) {
    console.error('Optional auth middleware error:', err);
    next(); // Continue even if there's an error
  }
};

module.exports = {
  auth,
  authorize,
  adminOnly,
  exporterOnly,
  verifiedOnly,
  ownerOrAdmin,
  optionalAuth
};