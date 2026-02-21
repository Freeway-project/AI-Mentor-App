import mongoose from 'mongoose';
import { logger } from '@owl-mentors/utils';

export async function connectDatabase(uri: string): Promise<void> {
  try {
    logger.info('Connecting to MongoDB via Mongoose...');
    const startTime = Date.now();

    await mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB_NAME || 'mentor-app',
    });

    const duration = Date.now() - startTime;
    logger.info(`Connected to MongoDB`, { duration });
  } catch (error) {
    logger.error('Failed to connect to MongoDB', error as Error);
    throw error;
  }
}

export function getDatabase() {
  if (!mongoose.connection.db) {
    throw new Error('Database not connected. Call connectDatabase first.');
  }
  return mongoose.connection.db;
}

export async function closeDatabase(): Promise<void> {
  logger.info('Closing database connection...');
  await mongoose.disconnect();
  logger.info('Database connection closed');
}
