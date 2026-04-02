const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token
exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

// Middleware to check if user is admin
exports.requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
  next();
};

// Middleware to check if user is doctor
exports.requireDoctor = (req, res, next) => {
  if (!req.user || req.user.role !== 'DOCTOR') {
    return res.status(403).json({ error: 'Access denied. Doctor privileges required.' });
  }
  next();
};

// Middleware to check if user is patient
exports.requirePatient = (req, res, next) => {
  if (!req.user || req.user.role !== 'PATIENT') {
    return res.status(403).json({ error: 'Access denied. Patient privileges required.' });
  }
  next();
};
