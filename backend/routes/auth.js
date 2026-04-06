import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const buildLevel = (points) => Math.max(1, Math.floor(points / 100) + 1);

const buildBadges = (points, currentBadges = [], streakCurrent = 0) => {
  const badges = new Set(['Beginner', ...(currentBadges || [])]);
  if (points >= 100) badges.add('Eco Starter');
  if (points >= 250) badges.add('Eco Warrior');
  if (points >= 500) badges.add('Green Champion');
  if (streakCurrent >= 7) badges.add('7-Day Streak');
  return Array.from(badges);
};

const signToken = (user) => jwt.sign(
  {
    userId: user.userId,
    email: user.email,
    role: user.role || 'user'
  },
  JWT_SECRET,
  { expiresIn: JWT_EXPIRES_IN }
);

const serializeUser = (user) => ({
  userId: user.userId,
  name: user.name,
  email: user.email,
  role: user.role,
  points: user.points,
  impactScore: user.impactScore,
  level: user.level,
  badges: user.badges,
  completedChallenges: user.completedChallenges,
  streak: user.streak
});

router.post('/signup', async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'An account already exists for that email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      points: 0,
      impactScore: 0,
      level: buildLevel(0),
      badges: buildBadges(0),
      completedChallenges: [],
      streak: {
        current: 0,
        longest: 0,
        lastCompletedAt: null
      }
    });

    const token = signToken(user);
    return res.status(201).json({
      message: 'Signup successful',
      token,
      user: serializeUser(user)
    });
  } catch (error) {
    return res.status(500).json({ message: `Signup failed: ${error.message}` });
  }
});

router.post('/login', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user);
    return res.json({
      message: 'Login successful',
      token,
      user: serializeUser(user)
    });
  } catch (error) {
    return res.status(500).json({ message: `Login failed: ${error.message}` });
  }
});

router.get('/user', requireAuth, async (req, res) => (
  res.json({ user: serializeUser(req.user) })
));

router.put('/user', requireAuth, async (req, res) => {
  try {
    const nextName = String(req.body?.name || '').trim();
    const nextPassword = String(req.body?.password || '');

    if (!nextName) {
      return res.status(400).json({ message: 'Name is required' });
    }

    req.user.name = nextName;
    if (nextPassword) {
      if (nextPassword.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }
      req.user.password = await bcrypt.hash(nextPassword, 10);
    }

    await req.user.save();
    return res.json({
      message: 'Profile updated successfully',
      user: serializeUser(req.user)
    });
  } catch (error) {
    return res.status(500).json({ message: `Profile update failed: ${error.message}` });
  }
});

router.post('/logout', requireAuth, async (_req, res) => (
  res.json({ message: 'Logout successful' })
));

export default router;
