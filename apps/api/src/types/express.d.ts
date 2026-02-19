import 'express';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRoles?: string[];
      requestId?: string;
    }
  }
}
