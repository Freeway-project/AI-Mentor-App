import app from './app';
import { connectDatabase } from '@owl-mentors/database';
import { logger } from '@owl-mentors/utils';
import { startReminderJob, stopReminderJob } from './jobs/reminder.job';
import type { Server } from 'http';

const PORT = process.env.PORT || 3001;
let httpServer: Server | undefined;

function shutdown(exitCode: number, reason: string) {
  logger.info(reason);
  stopReminderJob();

  if (httpServer) {
    httpServer.close(() => process.exit(exitCode));
    setTimeout(() => process.exit(exitCode), 5_000).unref();
    return;
  }

  process.exit(exitCode);
}

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

    // Start background jobs
    startReminderJob();

    // Start Express server
    httpServer = app.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`, {
        port: PORT,
        env: process.env.NODE_ENV || 'development',
      });
    });
  } catch (error) {
    logger.error('Failed to start server', error as Error);
    shutdown(1, 'Startup failed, exiting');
  }
}

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  shutdown(0, 'SIGTERM received, shutting down gracefully');
});

process.on('SIGINT', () => {
  shutdown(0, 'SIGINT received, shutting down gracefully');
});

process.on('unhandledRejection', (reason) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  logger.error('Unhandled promise rejection', error);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', error);
  shutdown(1, 'Uncaught exception received, shutting down');
});

startServer();
