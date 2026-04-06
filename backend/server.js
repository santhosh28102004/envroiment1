import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { readFile } from 'fs/promises';
import { MongoClient, ObjectId } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  environmentalTopics,
  articles as sourceArticles,
  galleryImages as sourceGalleryImages,
  awarenessTips as sourceAwarenessTips
} from '../frontend/src/data.js';
import { articleContentById } from '../frontend/src/articleContent.js';
import { pageContent as sourcePageContent } from './page-content.js';
import authRoutes from './routes/auth.js';
import engagementRoutes from './routes/engagement.js';
import User from './models/User.js';

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || 'environment';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const DEFAULT_USER_NAME = process.env.DEFAULT_USER_NAME || 'rio';
const DEFAULT_USER_EMAIL = process.env.DEFAULT_USER_EMAIL || 'rio@gmail.com';
const DEFAULT_USER_PASSWORD = process.env.DEFAULT_USER_PASSWORD || 'abc123';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const ALLOWED_ORIGINS = String(process.env.ALLOWED_ORIGINS || CLIENT_URL)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = express();
app.use(cors({
  origin(origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  }
}));
app.use(express.json());
app.use('/api', authRoutes);
app.use('/api', engagementRoutes);
app.use('/', authRoutes);
app.use('/', engagementRoutes);

const defaultEngagement = {
  ecoScore: 0,
  completedChallenges: [],
  badges: ['Beginner']
};

const emptyQuizStats = (userId) => ({
  userId,
  totalCorrect: 0,
  totalQuestions: 0,
  totalQuizzes: 0,
  lastCorrect: 0,
  lastTotal: 0
});

let mongoClient;
let mongoDb;
let mongooseReady = false;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_JSON_PATH = path.join(__dirname, 'db.json');

const getUserId = (user) => String(user?._id ?? user?.id ?? '');
const isMongoUserId = (value) => ObjectId.isValid(value);
const toDbUserId = (value) => new ObjectId(value);
const stripMongoId = (doc) => {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return rest;
};

const normalizeBadges = (ecoScore, existingBadges = []) => {
  const badges = Array.from(new Set(['Beginner', ...existingBadges]));
  if (ecoScore > 200 && !badges.includes('Eco Warrior')) badges.push('Eco Warrior');
  if (ecoScore > 500 && !badges.includes('Green Champion')) badges.push('Green Champion');
  return badges;
};

const toUserResponse = (user) => ({
  id: getUserId(user),
  name: user.name,
  email: user.email,
  role: user.role || 'user'
});

const signToken = (user) => jwt.sign(
  { sub: getUserId(user), role: user.role || 'user' },
  JWT_SECRET,
  { expiresIn: JWT_EXPIRES_IN }
);

const getMongoDb = async () => {
  if (mongoDb) return mongoDb;
  mongoClient = new MongoClient(MONGO_URI, {
    serverSelectionTimeoutMS: 5000
  });
  await mongoClient.connect();
  mongoDb = mongoClient.db(MONGO_DB_NAME);
  return mongoDb;
};

const connectMongoose = async () => {
  if (mongooseReady) return mongoose.connection;
  await mongoose.connect(MONGO_URI, {
    dbName: MONGO_DB_NAME
  });
  await User.init();
  mongooseReady = true;
  return mongoose.connection;
};

const getCollections = async () => {
  const db = await getMongoDb();
  return {
    users: db.collection('users'),
    topics: db.collection('topics'),
    articles: db.collection('articles'),
    pageContent: db.collection('pageContent'),
    galleryImages: db.collection('galleryImages'),
    awarenessTips: db.collection('awarenessTips'),
    engagement: db.collection('engagement'),
    quizStats: db.collection('quizStats')
  };
};

const getAuthFromRequest = (req) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
};

const requireAuth = (req, res, next) => {
  const auth = getAuthFromRequest(req);
  if (!auth) return res.status(401).json({ message: 'Unauthorized' });
  req.auth = auth;
  return next();
};

const requireAdmin = (req, res, next) => {
  const auth = getAuthFromRequest(req);
  if (!auth) return res.status(401).json({ message: 'Unauthorized' });
  if (auth.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  req.auth = auth;
  return next();
};

const resolveScopedUserId = (req, requestedUserId) => {
  const auth = getAuthFromRequest(req);
  if (requestedUserId === 'guest') return 'guest';
  if (!auth) return null;
  const authUserId = auth.sub || auth.userId;
  if (authUserId !== requestedUserId) return false;
  return authUserId;
};

const buildSeedArticles = () => sourceArticles.map((article) => ({
  ...article,
  detail: articleContentById[article.id] || null,
  description: article.description || article.summary || 'No description available.'
}));

const readLegacySeedData = async () => {
  try {
    const raw = await readFile(DB_JSON_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      engagement: parsed.engagement && typeof parsed.engagement === 'object' ? parsed.engagement : {},
      quizStats: Array.isArray(parsed.quizStats) ? parsed.quizStats : []
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { users: [], engagement: {}, quizStats: [] };
    }
    throw error;
  }
};

const ensureIndexes = async (collections) => {
  await collections.users.createIndex({ email: 1 }, { unique: true });
  await collections.topics.createIndex({ id: 1 }, { unique: true });
  await collections.articles.createIndex({ id: 1 }, { unique: true });
  await collections.pageContent.createIndex({ slug: 1 }, { unique: true });
  await collections.galleryImages.createIndex({ title: 1 }, { unique: true });
  await collections.engagement.createIndex({ userId: 1 }, { unique: true });
  await collections.quizStats.createIndex({ userId: 1 }, { unique: true });
};

const seedCollectionById = async (collection, items) => {
  if (!items.length) return;
  await Promise.all(items.map((item) => collection.updateOne(
    { id: item.id },
    { $setOnInsert: item },
    { upsert: true }
  )));
};

const seedGalleryCollection = async (collection, items) => {
  if (!items.length) return;
  await Promise.all(items.map((item) => collection.updateOne(
    { title: item.title },
    { $setOnInsert: item },
    { upsert: true }
  )));
};

const seedPageContentCollection = async (collection, items) => {
  if (!items.length) return;
  await Promise.all(items.map((item) => collection.updateOne(
    { slug: item.slug },
    { $setOnInsert: item },
    { upsert: true }
  )));
};

const ensureDefaultUser = async (users) => {
  const email = String(DEFAULT_USER_EMAIL).trim().toLowerCase();
  const existing = await users.findOne({ email });
  if (existing) return;
  const now = new Date();
  const passwordHash = await bcrypt.hash(String(DEFAULT_USER_PASSWORD), 10);
  await users.insertOne({
    name: String(DEFAULT_USER_NAME).trim(),
    email,
    passwordHash,
    role: 'user',
    createdAt: now,
    updatedAt: now
  });
};

const seedUsersCollection = async (collection, users = []) => {
  if (!users.length) return;

  await Promise.all(users.map(async (user) => {
    const email = String(user.email || '').trim().toLowerCase();
    const name = String(user.name || '').trim();
    if (!email || !name || !user.passwordHash) return;

    const createdAt = user.createdAt ? new Date(user.createdAt) : new Date();
    const updatedAt = user.updatedAt ? new Date(user.updatedAt) : createdAt;

    await collection.updateOne(
      { email },
      {
        $setOnInsert: {
          name,
          email,
          passwordHash: user.passwordHash,
          role: user.role || 'user',
          createdAt,
          updatedAt
        }
      },
      { upsert: true }
    );
  }));
};

const seedEngagementCollection = async (collection, engagementMap = {}) => {
  const entries = Object.entries(engagementMap);
  if (!entries.length) return;

  await Promise.all(entries.map(([userId, record]) => collection.updateOne(
    { userId },
    {
      $setOnInsert: {
        userId,
        ecoScore: Number(record?.ecoScore || 0),
        completedChallenges: Array.isArray(record?.completedChallenges) ? record.completedChallenges : [],
        badges: normalizeBadges(Number(record?.ecoScore || 0), record?.badges)
      }
    },
    { upsert: true }
  )));
};

const seedQuizStatsCollection = async (collection, stats = []) => {
  if (!stats.length) return;

  await Promise.all(stats.map((record) => {
    const userId = String(record?.userId || '').trim();
    if (!userId) return Promise.resolve();

    return collection.updateOne(
      { userId },
      {
        $setOnInsert: {
          userId,
          totalCorrect: Number(record.totalCorrect || 0),
          totalQuestions: Number(record.totalQuestions || 0),
          totalQuizzes: Number(record.totalQuizzes || 0),
          lastCorrect: Number(record.lastCorrect || 0),
          lastTotal: Number(record.lastTotal || 0),
          createdAt: record.createdAt ? new Date(record.createdAt) : new Date(),
          updatedAt: record.updatedAt ? new Date(record.updatedAt) : new Date()
        }
      },
      { upsert: true }
    );
  }));
};

const seedMongo = async () => {
  const collections = await getCollections();
  const legacyData = await readLegacySeedData();
  await ensureIndexes(collections);
  await Promise.all([
    seedCollectionById(collections.topics, environmentalTopics),
    seedCollectionById(collections.articles, buildSeedArticles()),
    seedPageContentCollection(collections.pageContent, sourcePageContent),
    seedGalleryCollection(collections.galleryImages, sourceGalleryImages),
    collections.awarenessTips.updateOne(
      { key: 'default' },
      { $setOnInsert: { key: 'default', ...sourceAwarenessTips } },
      { upsert: true }
    ),
    seedUsersCollection(collections.users, legacyData.users),
    seedEngagementCollection(collections.engagement, legacyData.engagement),
    seedQuizStatsCollection(collections.quizStats, legacyData.quizStats),
    ensureDefaultUser(collections.users)
  ]);
};

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const { users } = await getCollections();
    const user = await users.findOne({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase()
    });

    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    res.json({ token: signToken(user), user: toUserResponse(user) });
  } catch (error) {
    res.status(500).json({ message: `Login failed: ${error.message}` });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    const normalizedName = String(name || '').trim();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedPassword = String(password || '');

    if (!normalizedName || !normalizedEmail || !normalizedPassword) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    if (normalizedPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const { users } = await getCollections();
    const existing = await users.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: 'An account already exists for that email' });
    }

    const now = new Date();
    const passwordHash = await bcrypt.hash(normalizedPassword, 10);
    const result = await users.insertOne({
      name: normalizedName,
      email: normalizedEmail,
      passwordHash,
      role: 'user',
      createdAt: now,
      updatedAt: now
    });

    const user = await users.findOne({ _id: result.insertedId });
    res.status(201).json({ token: signToken(user), user: toUserResponse(user) });
  } catch (error) {
    res.status(500).json({ message: `Registration failed: ${error.message}` });
  }
});

app.post('/api/auth/logout', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/auth/profile', requireAuth, async (req, res) => {
  try {
    const { users } = await getCollections();
    const user = await users.findOne({ _id: toDbUserId(req.auth.sub) });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user: toUserResponse(user) });
  } catch (error) {
    res.status(500).json({ message: `Failed to read profile: ${error.message}` });
  }
});

app.put('/api/auth/profile', requireAuth, async (req, res) => {
  try {
    const { name, password } = req.body || {};
    const normalizedName = String(name || '').trim();
    const nextPassword = String(password || '');
    if (!normalizedName) return res.status(400).json({ message: 'Name is required' });
    if (nextPassword && nextPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const update = { name: normalizedName, updatedAt: new Date() };
    if (nextPassword) update.passwordHash = await bcrypt.hash(nextPassword, 10);

    const { users } = await getCollections();
    const userId = toDbUserId(req.auth.sub);
    await users.updateOne({ _id: userId }, { $set: update });
    const user = await users.findOne({ _id: userId });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user: toUserResponse(user) });
  } catch (error) {
    res.status(500).json({ message: `Failed to update profile: ${error.message}` });
  }
});

app.get('/api/topics', async (_req, res) => {
  try {
    const { topics } = await getCollections();
    const data = await topics.find({}).toArray();
    res.json({ topics: data.map(stripMongoId) });
  } catch (error) {
    res.status(500).json({ message: `Failed to read topics: ${error.message}` });
  }
});

app.get('/api/topics/:id', async (req, res) => {
  try {
    const { topics } = await getCollections();
    const topic = await topics.findOne({ id: req.params.id });
    if (!topic) return res.status(404).json({ message: 'Topic not found' });
    res.json({ topic: stripMongoId(topic) });
  } catch (error) {
    res.status(500).json({ message: `Failed to read topic: ${error.message}` });
  }
});

app.get('/api/articles', async (_req, res) => {
  try {
    const { articles } = await getCollections();
    const data = await articles.find({ category: { $ne: 'news' } }).toArray();
    res.json({ articles: data.map(stripMongoId) });
  } catch (error) {
    res.status(500).json({ message: `Failed to read articles: ${error.message}` });
  }
});

app.get('/api/articles/:id', async (req, res) => {
  try {
    const { articles } = await getCollections();
    const article = await articles.findOne({ id: req.params.id, category: { $ne: 'news' } });
    if (!article) return res.status(404).json({ message: 'Article not found' });
    res.json({ article: stripMongoId(article) });
  } catch (error) {
    res.status(500).json({ message: `Failed to read article: ${error.message}` });
  }
});

app.get('/api/pages/:slug', async (req, res) => {
  try {
    const { pageContent } = await getCollections();
    const page = await pageContent.findOne({ slug: req.params.slug });
    if (!page) return res.status(404).json({ message: 'Page content not found' });
    res.json({ page: stripMongoId(page) });
  } catch (error) {
    res.status(500).json({ message: `Failed to read page content: ${error.message}` });
  }
});

app.get('/api/gallery', async (_req, res) => {
  try {
    const { galleryImages } = await getCollections();
    const images = await galleryImages.find({}).toArray();
    res.json({ images: images.map(stripMongoId) });
  } catch (error) {
    res.status(500).json({ message: `Failed to read gallery data: ${error.message}` });
  }
});

app.get('/api/tips', async (_req, res) => {
  try {
    const { awarenessTips } = await getCollections();
    const tips = await awarenessTips.findOne({ key: 'default' });
    if (!tips) return res.status(404).json({ message: 'Tips not found' });
    res.json({ tips: stripMongoId(tips) });
  } catch (error) {
    res.status(500).json({ message: `Failed to read awareness tips: ${error.message}` });
  }
});

app.get('/api/engagement/:userId', async (req, res) => {
  try {
    const scopedUserId = resolveScopedUserId(req, req.params.userId);
    if (scopedUserId === null) return res.status(401).json({ message: 'Unauthorized' });
    if (scopedUserId === false) return res.status(403).json({ message: 'Forbidden' });

    const { engagement } = await getCollections();
    let record = await engagement.findOne({ userId: scopedUserId });
    if (!record) {
      record = { userId: scopedUserId, ...defaultEngagement };
      await engagement.insertOne(record);
    }

    const normalized = {
      ecoScore: Number(record.ecoScore || 0),
      completedChallenges: Array.isArray(record.completedChallenges) ? record.completedChallenges : [],
      badges: normalizeBadges(Number(record.ecoScore || 0), record.badges)
    };

    await engagement.updateOne({ userId: scopedUserId }, { $set: normalized });
    res.json(normalized);
  } catch (error) {
    res.status(500).json({ message: `Failed to read engagement data: ${error.message}` });
  }
});

app.put('/api/engagement/:userId', async (req, res) => {
  try {
    const scopedUserId = resolveScopedUserId(req, req.params.userId);
    if (scopedUserId === null) return res.status(401).json({ message: 'Unauthorized' });
    if (scopedUserId === false) return res.status(403).json({ message: 'Forbidden' });

    const ecoScore = Number.isFinite(req.body?.ecoScore) ? req.body.ecoScore : 0;
    const completedChallenges = Array.isArray(req.body?.completedChallenges)
      ? Array.from(new Set(req.body.completedChallenges))
      : [];
    const badges = normalizeBadges(ecoScore, req.body?.badges);

    const { engagement } = await getCollections();
    await engagement.updateOne(
      { userId: scopedUserId },
      { $set: { ecoScore, completedChallenges, badges } },
      { upsert: true }
    );

    res.json({ ecoScore, completedChallenges, badges });
  } catch (error) {
    res.status(500).json({ message: `Failed to save engagement data: ${error.message}` });
  }
});

const readQuizStats = async (req, res, requestedUserId) => {
  try {
    const scopedUserId = resolveScopedUserId(req, requestedUserId);
    if (scopedUserId === null) return res.status(401).json({ message: 'Unauthorized' });
    if (scopedUserId === false) return res.status(403).json({ message: 'Forbidden' });

    const { quizStats } = await getCollections();
    const stats = await quizStats.findOne({ userId: scopedUserId });
    res.json({ stats: stripMongoId(stats) || emptyQuizStats(scopedUserId) });
  } catch (error) {
    res.status(500).json({ message: `Failed to read quiz stats: ${error.message}` });
  }
};

const submitQuizStats = async (req, res, requestedUserId) => {
  try {
    const scopedUserId = resolveScopedUserId(req, requestedUserId);
    if (scopedUserId === null) return res.status(401).json({ message: 'Unauthorized' });
    if (scopedUserId === false) return res.status(403).json({ message: 'Forbidden' });

    const correct = Number(req.body?.correct);
    const total = Number(req.body?.total);
    if (!Number.isFinite(correct) || !Number.isFinite(total) || correct < 0 || total <= 0 || correct > total) {
      return res.status(400).json({ message: 'Invalid quiz score' });
    }

    const { quizStats } = await getCollections();
    const now = new Date();
    await quizStats.updateOne(
      { userId: scopedUserId },
      {
        $inc: {
          totalCorrect: correct,
          totalQuestions: total,
          totalQuizzes: 1
        },
        $set: {
          lastCorrect: correct,
          lastTotal: total,
          updatedAt: now
        },
        $setOnInsert: {
          userId: scopedUserId,
          createdAt: now
        }
      },
      { upsert: true }
    );

    const stats = await quizStats.findOne({ userId: scopedUserId });
    res.json({ stats: stripMongoId(stats) });
  } catch (error) {
    res.status(500).json({ message: `Failed to save quiz score: ${error.message}` });
  }
};

app.get('/api/quiz/:userId', async (req, res) => readQuizStats(req, res, req.params.userId));
app.get('/api/quiz/me', requireAuth, async (req, res) => readQuizStats(req, res, req.auth.sub || req.auth.userId));
app.post('/api/quiz/:userId/submit', async (req, res) => submitQuizStats(req, res, req.params.userId));
app.post('/api/quiz/submit', requireAuth, async (req, res) => submitQuizStats(req, res, req.auth.sub || req.auth.userId));

app.get('/api/admin/users', requireAdmin, async (_req, res) => {
  try {
    const { users } = await getCollections();
    const data = await users.find({}).sort({ createdAt: -1 }).toArray();
    res.json({ users: data.map(toUserResponse) });
  } catch (error) {
    res.status(500).json({ message: `Failed to read users: ${error.message}` });
  }
});

app.put('/api/admin/users/:userId/role', requireAdmin, async (req, res) => {
  try {
    const { role } = req.body || {};
    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ message: 'Role must be admin or user' });
    }

    if (!isMongoUserId(req.params.userId)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const { users } = await getCollections();
    const userId = toDbUserId(req.params.userId);
    await users.updateOne({ _id: userId }, { $set: { role, updatedAt: new Date() } });
    const user = await users.findOne({ _id: userId });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user: toUserResponse(user) });
  } catch (error) {
    res.status(500).json({ message: `Failed to update role: ${error.message}` });
  }
});

app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Server error' });
});

const startServer = async () => {
  try {
    await connectMongoose();
    await seedMongo();
    app.listen(PORT, () => {
      console.log(`Backend listening on port ${PORT}`);
      console.log(`MongoDB connected: ${MONGO_URI}/${MONGO_DB_NAME}`);
    });
  } catch (error) {
    console.error(`Failed to start backend: ${error.message}`);
    process.exit(1);
  }
};

startServer();
