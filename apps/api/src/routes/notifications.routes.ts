import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { logger } from '@owl-mentors/utils';
import { NotificationRepository } from '@owl-mentors/database';

const router: Router = Router();
let notifRepo: NotificationRepository;
function getRepo() { if (!notifRepo) notifRepo = new NotificationRepository(); return notifRepo; }

// GET /api/notifications
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { unreadOnly, limit, offset } = req.query;
    const notifications = await getRepo().list(req.userId!, {
      channel: 'in_app' as any,
      unreadOnly: unreadOnly === 'true',
      limit: Number(limit) || 20,
      offset: Number(offset) || 0,
    });
    res.json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
});

// GET /api/notifications/unread-count
router.get('/unread-count', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await getRepo().getUnreadCount(req.userId!);
    res.json({ success: true, data: { count } });
  } catch (error) {
    next(error);
  }
});

// POST /api/notifications/read-all
router.post('/read-all', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await getRepo().markAllRead(req.userId!);
    logger.info('[Notifications] Marked all read', { requestId: req.requestId, userId: req.userId });
    res.json({ success: true, data: { message: 'All notifications marked as read' } });
  } catch (error) {
    next(error);
  }
});

// POST /api/notifications/:id/read
router.post('/:id/read', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await getRepo().markAsRead(req.params.id, req.userId!);
    res.json({ success: true, data: { message: 'Notification marked as read' } });
  } catch (error) {
    next(error);
  }
});

export default router;
