const jwt = require('jsonwebtoken');
const { dbAsync } = require('../database');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_here');
    
    // Get user from SQLite database
    const user = await dbAsync.get(
      'SELECT id, name, email, role, phone FROM users WHERE id = ?',
      [decoded.userId]
    );
    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.userId = user.id;
    req.userRole = user.role;
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const adminAuth = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

module.exports = { auth, adminAuth };
