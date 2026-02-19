import { Request, Response, NextFunction } from 'express';
import { logger } from '@owl-mentors/utils';
import { randomBytes } from 'crypto';

// Extend Express Request to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      userId?: string;
      startTime?: number;
    }
  }
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  // Generate unique request ID
  req.requestId = randomBytes(8).toString('hex');
  req.startTime = Date.now();

  // Log incoming request
  logger.request({
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    userId: req.userId,
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = req.startTime ? Date.now() - req.startTime : 0;

    logger.request({
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      userId: req.userId,
      status: res.statusCode,
      duration,
    });
  });

  next();
}
