import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error.middleware';

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'UNAUTHORIZED', 'No authentication token provided');
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, secret) as JWTPayload;
    req.userId = decoded.userId;

    next();
  } catch (error) {
    next(error);
  }
}

export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AppError(401, 'UNAUTHORIZED', 'No authentication token provided');
      }

      const token = authHeader.substring(7);
      const secret = process.env.JWT_SECRET;

      if (!secret) {
        throw new Error('JWT_SECRET not configured');
      }

      const decoded = jwt.verify(token, secret) as JWTPayload;

      if (roles.length > 0 && !roles.includes(decoded.role)) {
        throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions');
      }

      req.userId = decoded.userId;
      next();
    } catch (error) {
      next(error);
    }
  };
}
