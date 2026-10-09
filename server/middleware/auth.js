const jwt = require('jsonwebtoken');
const Institute = require('../models/Institute');
const User = require('../models/user');
const Student = require('../models/Students');

const JWT_SECRET = process.env.JWT_SECRET || 'keerti_classes_secret_key_2024';

/**
 * Authentication Middleware for Admin & Staff & SuperAdmin
 */
const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role === 'superadmin') {
      req.user = decoded;
      return next();
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or account deactivated.' });
    }

    req.user = user;
    req.instituteId = user.instituteId;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session token.', error: err.message });
  }
};

/**
 * Authentication Middleware for Students
 */
const authenticateStudent = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Student authentication required.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.type !== 'student' && decoded.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Access denied. Student credentials required.' });
    }

    const student = await Student.findById(decoded.id || decoded.studentId);
    if (!student || student.status === 'Dropped') {
      return res.status(401).json({ success: false, message: 'Student account not found or inactive.' });
    }

    req.student = student;
    req.instituteId = student.instituteId;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired student session.', error: err.message });
  }
};

/**
 * RBAC Role Authorization Middleware
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (req.user.role === 'superadmin' || req.user.role === 'owner') {
      return next();
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Forbidden: Access restricted to roles: [${roles.join(', ')}]` 
      });
    }
    next();
  };
};

module.exports = {
  authenticateAdmin,
  authenticateStudent,
  authorizeRoles,
  JWT_SECRET,
};
