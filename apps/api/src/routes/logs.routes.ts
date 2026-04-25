import { Router, Request, Response } from 'express';
import { logger } from '@owl-mentors/utils';

const router: Router = Router();

const MAX_MESSAGE_LENGTH = 1000;

router.post('/client-logs', (req: Request, res: Response) => {
  const { level, message, context, url, userAgent } = req.body ?? {};

  if (typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'message is required' },
    });
  }

  const normalizedMessage = message.slice(0, MAX_MESSAGE_LENGTH);
  const normalizedLevel = typeof level === 'string' ? level.toLowerCase() : 'info';
  const logContext = {
    type: 'client',
    requestId: req.requestId,
    ip: req.ip,
    url: typeof url === 'string' ? url : undefined,
    userAgent: typeof userAgent === 'string' ? userAgent : undefined,
    context: typeof context === 'object' && context !== null ? context : undefined,
  };

  if (normalizedLevel === 'error') {
    logger.error(`[Client] ${normalizedMessage}`, undefined, logContext);
  } else if (normalizedLevel === 'warn') {
    logger.warn(`[Client] ${normalizedMessage}`, logContext);
  } else {
    logger.info(`[Client] ${normalizedMessage}`, logContext);
  }

  return res.status(202).json({ success: true, data: { accepted: true } });
});

export default router;
