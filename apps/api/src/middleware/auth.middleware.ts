import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRepository } from '@owl-mentors/database';
import { AppError } from './error.middleware';

interface JWTPayload {
  userId: string;
  email: string;
  roles: string[];
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
    req.userRoles = decoded.roles;

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

      if (roles.length > 0 && !decoded.roles.some(r => roles.includes(r))) {
        throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions');
      }

      req.userId = decoded.userId;
      req.userRoles = decoded.roles;
      next();
    } catch (error) {
      next(error);
    }
  };
}

let userRepo: UserRepository;
function getUserRepo() {
  if (!userRepo) userRepo = new UserRepository();
  return userRepo;
}

/**
 * Middleware that enforces email verification.
 * Must be placed AFTER authenticate().
 * Blocks the request with 403 EMAIL_NOT_VERIFIED if the user's email is not verified.
 */
export async function requireEmailVerified(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await getUserRepo().findById(req.userId!);
    if (!user?.emailVerified) {
      throw new AppError(403, 'EMAIL_NOT_VERIFIED', 'Please verify your email address before continuing');
    }
    next();
  } catch (error) {
    next(error);
  }
}
