import { Router, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { authenticate } from '../middleware/auth.middleware';
import { NotificationModel } from '../../../../packages/database/src/models/notification.model';

const router: Router = Router();

// GET /api/notifications — list current user's notifications (unread first, limit 30)
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const docs = await NotificationModel.find({ userId: new mongoose.Types.ObjectId(req.userId!) })
      .sort({ readAt: 1, createdAt: -1 })
      .limit(30)
      .lean();

    const notifications = docs.map(doc => ({
      id: (doc._id as mongoose.Types.ObjectId).toString(),
      type: doc.type,
      title: doc.title,
      message: doc.message,
      data: doc.data,
      read: Boolean(doc.readAt),
      createdAt: doc.createdAt,
    }));

    const unreadCount = notifications.filter(n => !n.read).length;

    res.json({ success: true, data: { notifications, unreadCount } });
  } catch (error) {
    next(error);
  }
});

// POST /api/notifications/read — mark all (or specific) notifications as read
router.post('/read', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ids } = req.body as { ids?: string[] };

    const filter: any = {
      userId: new mongoose.Types.ObjectId(req.userId!),
      readAt: { $exists: false },
    };

    if (ids?.length) {
      filter._id = { $in: ids.map(id => new mongoose.Types.ObjectId(id)) };
    }

    await NotificationModel.updateMany(filter, { $set: { readAt: new Date() } });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
