import { MongoClient, Db } from 'mongodb';
import { logger } from '@owl-mentors/utils';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectDatabase(uri: string): Promise<Db> {
  if (db) {
    logger.debug('Using existing database connection');
    return db;
  }

  try {
    logger.info('Connecting to MongoDB...');
    const startTime = Date.now();

    client = new MongoClient(uri);
    await client.connect();

    const dbName = process.env.MONGODB_DB_NAME || 'mentor-app';
    db = client.db(dbName);

    const duration = Date.now() - startTime;
    logger.info(`Connected to MongoDB database: ${dbName}`, { duration });

    // Create indexes
    await createIndexes(db);

    return db;
  } catch (error) {
    logger.error('Failed to connect to MongoDB', error as Error);
    throw error;
  }
}

export function getDatabase(): Db {
  if (!db) {
    throw new Error('Database not connected. Call connectDatabase first.');
  }
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (client) {
    logger.info('Closing database connection...');
    await client.close();
    client = null;
    db = null;
    logger.info('Database connection closed');
  }
}

async function createIndexes(database: Db): Promise<void> {
  try {
    logger.debug('Creating database indexes...');

    // Users indexes
    await database.collection('users').createIndexes([
      { key: { email: 1 }, unique: true },
      { key: { roles: 1 } },
      { key: { resetToken: 1 }, sparse: true },
      { key: { verifyToken: 1 }, sparse: true },
    ]);

    // Providers (mentors) indexes
    await database.collection('providers').createIndexes([
      { key: { userId: 1 }, unique: true },
      { key: { specialties: 1 } },
      { key: { expertise: 1 } },
      { key: { languages: 1 } },
      { key: { rating: -1 } },
      { key: { isActive: 1 } },
      { key: { onboardingStep: 1 } },
    ]);

    // Meetings indexes
    await database.collection('meetings').createIndexes([
      { key: { menteeId: 1 } },
      { key: { mentorId: 1 } },
      { key: { scheduledAt: 1 } },
      { key: { status: 1 } },
      { key: { menteeId: 1, status: 1 } },
      { key: { mentorId: 1, status: 1 } },
    ]);

    // Conversations indexes
    await database.collection('conversations').createIndexes([
      { key: { menteeId: 1 } },
      { key: { mentorId: 1 } },
      { key: { lastMessageAt: -1 } },
      { key: { menteeId: 1, mentorId: 1 }, unique: true },
    ]);

    // Messages indexes
    await database.collection('messages').createIndexes([
      { key: { conversationId: 1 } },
      { key: { conversationId: 1, createdAt: -1 } },
      { key: { senderId: 1 } },
    ]);

    // Notifications indexes
    await database.collection('notifications').createIndexes([
      { key: { userId: 1 } },
      { key: { status: 1 } },
      { key: { scheduledAt: 1 } },
      { key: { userId: 1, status: 1 } },
      { key: { status: 1, scheduledAt: 1 } },
    ]);

    // Offers indexes
    await database.collection('offers').createIndexes([
      { key: { mentorId: 1 } },
      { key: { mentorId: 1, isActive: 1 } },
    ]);

    // Policies indexes
    await database.collection('policies').createIndexes([
      { key: { mentorId: 1 }, unique: true },
    ]);

    logger.debug('Database indexes created successfully');
  } catch (error) {
    logger.warn('Error creating indexes', error as Error);
  }
}
