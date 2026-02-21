import { Router, Request, Response, NextFunction } from 'express';
import { TopicRepository } from '@owl-mentors/database';
import { createTopicSchema, updateTopicSchema } from '@owl-mentors/types';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';

const router: Router = Router();

let topicRepo: TopicRepository;

function getTopicRepo() {
  if (!topicRepo) topicRepo = new TopicRepository();
  return topicRepo;
}

// GET /topics — list topics (public; admin can pass includeInactive=true)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, limit, offset, includeInactive } = req.query;
    const result = await getTopicRepo().findAll(
      { category: category as string | undefined, isActive: includeInactive === 'true' ? undefined : true },
      Number(limit) || 20,
      Number(offset) || 0
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// GET /topics/:id — get topic (public)
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const topic = await getTopicRepo().findById(req.params.id);
    if (!topic) {
      throw new AppError(404, 'NOT_FOUND', 'Topic not found');
    }
    res.json({ success: true, data: topic });
  } catch (error) {
    next(error);
  }
});

// POST /topics — create topic (admin only)
router.post('/', authenticate, authorize('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createTopicSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
    }

    const topic = await getTopicRepo().create(parsed.data);
    res.status(201).json({ success: true, data: topic });
  } catch (error) {
    next(error);
  }
});

// PUT /topics/:id — update topic (admin only)
router.put('/:id', authenticate, authorize('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = updateTopicSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
    }

    const topic = await getTopicRepo().update(req.params.id, parsed.data);
    if (!topic) {
      throw new AppError(404, 'NOT_FOUND', 'Topic not found');
    }
    res.json({ success: true, data: topic });
  } catch (error) {
    next(error);
  }
});

// DELETE /topics/:id — deactivate topic (admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const topic = await getTopicRepo().update(req.params.id, { isActive: false });
    if (!topic) {
      throw new AppError(404, 'NOT_FOUND', 'Topic not found');
    }
    res.json({ success: true, data: { message: 'Topic deactivated' } });
  } catch (error) {
    next(error);
  }
});

export default router;
