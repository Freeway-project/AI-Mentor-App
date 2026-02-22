import express, { type Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from '@owl-mentors/utils';
import routes from './routes';
import { errorHandler } from './middleware/error.middleware';
import { requestLogger } from './middleware/logger.middleware';
import { generalRateLimit } from './middleware/rateLimit.middleware';

const app: Application = express();

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()) || [];
const isDev = process.env.NODE_ENV !== 'production';

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, curl, etc.)
      if (!origin) return callback(null, true);
      // In dev, allow any localhost origin
      if (isDev && /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      // Allow explicitly listed origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
  })
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(generalRateLimit);

// Request logging middleware
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
    },
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
