import { Router, Request, Response, NextFunction } from 'express';
import { ChatRepository } from '@owl-mentors/database';
import { authenticate } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';

const router: Router = Router();

let chatRepo: ChatRepository;
function getChatRepo() {
  if (!chatRepo) chatRepo = new ChatRepository();
  return chatRepo;
}

// GET /chat/conversations
router.get('/conversations', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const conversations = await getChatRepo().listConversations((req as any).user.id);
    res.json({ success: true, data: conversations });
  } catch (error) {
    next(error);
  }
});

// POST /chat/conversations — start or return existing conversation (mentee only)
router.post('/conversations', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'mentee') throw new AppError(403, 'FORBIDDEN', 'Only mentees can start conversations');

    const { mentorId } = req.body;
    if (!mentorId) throw new AppError(400, 'VALIDATION_ERROR', 'mentorId is required');

    const existing = (await getChatRepo().listConversations(user.id)).find(c => c.mentorId === mentorId);
    if (existing) return res.json({ success: true, data: existing });

    const conversation = await getChatRepo().createConversation(user.id, { mentorId });
    res.status(201).json({ success: true, data: conversation });
  } catch (error) {
    next(error);
  }
});

// GET /chat/conversations/:id/messages
router.get('/conversations/:id/messages', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { before, limit } = req.query;
    const messages = await getChatRepo().listMessages({
      conversationId: req.params.id,
      before: before as string | undefined,
      limit: Number(limit) || 50,
      offset: 0,
    });
    res.json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
});

// POST /chat/conversations/:id/messages
router.post('/conversations/:id/messages', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) throw new AppError(400, 'VALIDATION_ERROR', 'content is required');

    const user = (req as any).user;
    const senderRole: 'mentee' | 'mentor' = user.role === 'mentor' ? 'mentor' : 'mentee';

    const message = await getChatRepo().sendMessage(user.id, senderRole, {
      conversationId: req.params.id,
      content: content.trim(),
      type: 'text',
    });
    res.status(201).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
});

// POST /chat/conversations/:id/read
router.post('/conversations/:id/read', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await getChatRepo().markAsRead(req.params.id, (req as any).user.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
