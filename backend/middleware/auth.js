import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

const extractToken = (header = '') => (
  header.startsWith('Bearer ') ? header.slice(7) : ''
);

export const requireAuth = async (req, res, next) => {
  try {
    const token = extractToken(req.headers.authorization || '');
    if (!token) {
      return res.status(401).json({ message: 'Authorization token required' });
    }

    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findOne({ userId: payload.userId });
    if (!user) {
      return res.status(401).json({ message: 'Invalid authentication token' });
    }

    req.user = user;
    req.auth = payload;
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid authentication token' });
  }
};

export const requireAdmin = async (req, res, next) => {
  try {
    const token = extractToken(req.headers.authorization || '');
    if (!token) {
      return res.status(401).json({ message: 'Authorization token required' });
    }

    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findOne({ userId: payload.userId });
    if (!user) {
      return res.status(401).json({ message: 'Invalid authentication token' });
    }
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    req.user = user;
    req.auth = payload;
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid authentication token' });
  }
};
