import app from './app';
import { connectDatabase } from '@mentor-app/database';
import { logger } from '@mentor-app/utils';

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    logger.info('Starting server...');

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is required');
    }

    await connectDatabase(mongoUri);
    logger.info('Connected to MongoDB successfully');

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`, {
        port: PORT,
        env: process.env.NODE_ENV || 'development',
      });
    });
  } catch (error) {
    logger.error('Failed to start server', error as Error);
    process.exit(1);
  }
}

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();
