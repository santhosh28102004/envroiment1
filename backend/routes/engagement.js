import express from 'express';
import User from '../models/User.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = express.Router();

const isSameUtcDay = (firstDate, secondDate) => (
  firstDate.getUTCFullYear() === secondDate.getUTCFullYear()
  && firstDate.getUTCMonth() === secondDate.getUTCMonth()
  && firstDate.getUTCDate() === secondDate.getUTCDate()
);

const dayDifferenceUtc = (olderDate, newerDate) => {
  const older = Date.UTC(olderDate.getUTCFullYear(), olderDate.getUTCMonth(), olderDate.getUTCDate());
  const newer = Date.UTC(newerDate.getUTCFullYear(), newerDate.getUTCMonth(), newerDate.getUTCDate());
  return Math.round((newer - older) / 86400000);
};

const buildLevel = (points) => Math.max(1, Math.floor(points / 100) + 1);

const buildBadges = (points, currentBadges = [], streakCurrent = 0, completedCount = 0) => {
  const badges = new Set(['Beginner', ...(currentBadges || [])]);
  if (points >= 100) badges.add('Eco Starter');
  if (points >= 250) badges.add('Eco Warrior');
  if (points >= 500) badges.add('Green Champion');
  if (completedCount >= 5) badges.add('Challenge Finisher');
  if (streakCurrent >= 3) badges.add('3-Day Streak');
  if (streakCurrent >= 7) badges.add('7-Day Streak');
  return Array.from(badges);
};

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

router.post('/complete-challenge', requireAuth, async (req, res) => {
  try {
    const challengeId = String(req.body?.challengeId || '').trim();
    const points = Number.isFinite(req.body?.points) ? Number(req.body.points) : 10;

    if (!challengeId) {
      return res.status(400).json({ message: 'challengeId is required' });
    }

    const alreadyCompleted = req.user.completedChallenges.some(
      (entry) => entry.challengeId === challengeId
    );

    if (alreadyCompleted) {
      return res.status(409).json({
        message: 'Challenge already completed',
        user: serializeUser(req.user)
      });
    }

    const now = new Date();
    const lastCompletedAt = req.user.streak?.lastCompletedAt ? new Date(req.user.streak.lastCompletedAt) : null;
    let currentStreak = req.user.streak?.current || 0;

    if (!lastCompletedAt) {
      currentStreak = 1;
    } else if (isSameUtcDay(lastCompletedAt, now)) {
      currentStreak = req.user.streak?.current || 1;
    } else if (dayDifferenceUtc(lastCompletedAt, now) === 1) {
      currentStreak += 1;
    } else {
      currentStreak = 1;
    }

    const longestStreak = Math.max(req.user.streak?.longest || 0, currentStreak);
    req.user.completedChallenges.push({
      challengeId,
      date: now,
      points
    });
    req.user.points += points;
    req.user.impactScore += points;
    req.user.level = buildLevel(req.user.points);
    req.user.streak = {
      current: currentStreak,
      longest: longestStreak,
      lastCompletedAt: now
    };
    req.user.badges = buildBadges(
      req.user.points,
      req.user.badges,
      currentStreak,
      req.user.completedChallenges.length
    );

    await req.user.save();

    return res.json({
      message: 'Challenge completed successfully',
      challenge: {
        challengeId,
        points,
        completedAt: now
      },
      user: serializeUser(req.user)
    });
  } catch (error) {
    return res.status(500).json({ message: `Failed to complete challenge: ${error.message}` });
  }
});

router.post('/impact-score', requireAuth, async (req, res) => {
  try {
    const points = Number.isFinite(req.body?.points) ? Number(req.body.points) : 0;
    if (points <= 0) {
      return res.status(400).json({ message: 'points must be greater than 0' });
    }

    req.user.impactScore += points;
    req.user.badges = buildBadges(
      req.user.points,
      req.user.badges,
      req.user.streak?.current || 0,
      req.user.completedChallenges.length
    );
    await req.user.save();

    return res.json({
      message: 'Impact score updated successfully',
      user: serializeUser(req.user)
    });
  } catch (error) {
    return res.status(500).json({ message: `Failed to update impact score: ${error.message}` });
  }
});

router.get('/leaderboard', async (_req, res) => {
  try {
    const users = await User.find({})
      .sort({ points: -1, impactScore: -1, createdAt: 1 })
      .limit(10)
      .select('userId name points impactScore level badges streak');

    return res.json({
      leaderboard: users.map((user, index) => ({
        rank: index + 1,
        userId: user.userId,
        name: user.name,
        points: user.points,
        impactScore: user.impactScore,
        level: user.level,
        badges: user.badges,
        streak: user.streak
      }))
    });
  } catch (error) {
    return res.status(500).json({ message: `Failed to load leaderboard: ${error.message}` });
  }
});

router.get('/admin/users', requireAdmin, async (_req, res) => {
  try {
    const users = await User.find({})
      .sort({ createdAt: -1 })
      .select('userId name email role points impactScore level');

    return res.json({
      users: users.map((user) => ({
        id: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        points: user.points,
        impactScore: user.impactScore,
        level: user.level
      }))
    });
  } catch (error) {
    return res.status(500).json({ message: `Failed to read users: ${error.message}` });
  }
});

router.put('/admin/users/:userId/role', requireAdmin, async (req, res) => {
  try {
    const role = String(req.body?.role || '');
    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ message: 'Role must be admin or user' });
    }

    const user = await User.findOne({ userId: req.params.userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    await user.save();

    return res.json({
      user: {
        id: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        points: user.points,
        impactScore: user.impactScore,
        level: user.level
      }
    });
  } catch (error) {
    return res.status(500).json({ message: `Failed to update role: ${error.message}` });
  }
});

export default router;
