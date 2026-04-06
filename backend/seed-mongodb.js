import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';
import {
  environmentalTopics,
  articles as sourceArticles,
  galleryImages,
  awarenessTips
} from '../frontend/src/data.js';
import { articleContentById } from '../frontend/src/articleContent.js';
import { pageContent } from './page-content.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.MONGO_DB_NAME || 'environment';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_JSON_PATH = path.join(__dirname, 'db.json');

const now = () => new Date();

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

const upsertById = async (collection, docs) => {
  if (!docs.length) return;

  const operations = docs.map((doc) => ({
    updateOne: {
      filter: { id: doc.id },
      update: {
        $setOnInsert: {
          ...doc,
          createdAt: now(),
          updatedAt: now()
        }
      },
      upsert: true
    }
  }));

  await collection.bulkWrite(operations, { ordered: false });
};

const upsertUsers = async (collection, users) => {
  if (!users.length) return;

  const operations = users
    .map((user) => {
      const email = String(user.email || '').trim().toLowerCase();
      const name = String(user.name || '').trim();
      if (!email || !name || !user.passwordHash) return null;

      return {
        updateOne: {
          filter: { email },
          update: {
            $setOnInsert: {
              name,
              email,
              passwordHash: user.passwordHash,
              role: user.role || 'user',
              createdAt: user.createdAt ? new Date(user.createdAt) : now(),
              updatedAt: user.updatedAt ? new Date(user.updatedAt) : now()
            }
          },
          upsert: true
        }
      };
    })
    .filter(Boolean);

  if (operations.length) {
    await collection.bulkWrite(operations, { ordered: false });
  }
};

const upsertEngagement = async (collection, engagementMap) => {
  const operations = Object.entries(engagementMap).map(([userId, record]) => ({
    updateOne: {
      filter: { userId },
      update: {
        $setOnInsert: {
          userId,
          ecoScore: Number(record?.ecoScore || 0),
          completedChallenges: Array.isArray(record?.completedChallenges) ? record.completedChallenges : [],
          badges: Array.isArray(record?.badges) ? record.badges : ['Beginner']
        }
      },
      upsert: true
    }
  }));

  if (operations.length) {
    await collection.bulkWrite(operations, { ordered: false });
  }
};

const upsertQuizStats = async (collection, quizStats) => {
  const operations = quizStats
    .map((record) => {
      const userId = String(record?.userId || '').trim();
      if (!userId) return null;

      return {
        updateOne: {
          filter: { userId },
          update: {
            $setOnInsert: {
              userId,
              totalCorrect: Number(record.totalCorrect || 0),
              totalQuestions: Number(record.totalQuestions || 0),
              totalQuizzes: Number(record.totalQuizzes || 0),
              lastCorrect: Number(record.lastCorrect || 0),
              lastTotal: Number(record.lastTotal || 0),
              createdAt: record.createdAt ? new Date(record.createdAt) : now(),
              updatedAt: record.updatedAt ? new Date(record.updatedAt) : now()
            }
          },
          upsert: true
        }
      };
    })
    .filter(Boolean);

  if (operations.length) {
    await collection.bulkWrite(operations, { ordered: false });
  }
};

const upsertGallery = async (collection, docs) => {
  if (!docs.length) return;

  const operations = docs.map((doc) => ({
    updateOne: {
      filter: { title: doc.title },
      update: {
        $setOnInsert: {
          ...doc,
          createdAt: now(),
          updatedAt: now()
        }
      },
      upsert: true
    }
  }));

  await collection.bulkWrite(operations, { ordered: false });
};

const ensureIndexes = async (db) => {
  await Promise.all([
    db.collection('users').createIndex({ email: 1 }, { unique: true }),
    db.collection('topics').createIndex({ id: 1 }, { unique: true }),
    db.collection('articles').createIndex({ id: 1 }, { unique: true }),
    db.collection('pageContent').createIndex({ slug: 1 }, { unique: true }),
    db.collection('galleryImages').createIndex({ title: 1 }, { unique: true }),
    db.collection('engagement').createIndex({ userId: 1 }, { unique: true }),
    db.collection('quizStats').createIndex({ userId: 1 }, { unique: true })
  ]);
};

const upsertPageContent = async (collection, docs) => {
  if (!docs.length) return;

  const operations = docs.map((doc) => ({
    updateOne: {
      filter: { slug: doc.slug },
      update: {
        $setOnInsert: {
          ...doc,
          createdAt: now(),
          updatedAt: now()
        }
      },
      upsert: true
    }
  }));

  await collection.bulkWrite(operations, { ordered: false });
};

const run = async () => {
  const client = new MongoClient(MONGO_URI);

  try {
    const legacyData = await readLegacySeedData();
    await client.connect();
    const db = client.db(DB_NAME);

    await ensureIndexes(db);

    await Promise.all([
      upsertById(db.collection('topics'), environmentalTopics),
      upsertById(db.collection('articles'), buildSeedArticles()),
      upsertPageContent(db.collection('pageContent'), pageContent),
      upsertGallery(db.collection('galleryImages'), galleryImages),
      db.collection('awarenessTips').updateOne(
        { key: 'default' },
        {
          $setOnInsert: {
            key: 'default',
            ...awarenessTips,
            createdAt: now(),
            updatedAt: now()
          }
        },
        { upsert: true }
      ),
      upsertUsers(db.collection('users'), legacyData.users),
      upsertEngagement(db.collection('engagement'), legacyData.engagement),
      upsertQuizStats(db.collection('quizStats'), legacyData.quizStats)
    ]);

    console.log(`Seed completed in "${DB_NAME}"`);
    console.log(`topics: ${environmentalTopics.length}`);
    console.log(`articles: ${buildSeedArticles().length}`);
    console.log(`pageContent: ${pageContent.length}`);
    console.log(`galleryImages: ${galleryImages.length}`);
    console.log('awarenessTips: 1');
    console.log(`users: ${legacyData.users.length}`);
    console.log(`engagement: ${Object.keys(legacyData.engagement).length}`);
    console.log(`quizStats: ${legacyData.quizStats.length}`);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
};

run();
