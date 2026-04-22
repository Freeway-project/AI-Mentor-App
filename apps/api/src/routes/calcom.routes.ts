import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';

const router = Router();

// DELETE /api/calcom/booking/:uid — cancel a Cal.com booking (called when payment fails)
router.delete('/calcom/booking/:uid', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { uid } = req.params;
    const apiKey = process.env.CAL_API_KEY;

    if (!apiKey) {
      throw new AppError(500, 'CONFIG_ERROR', 'CAL_API_KEY is not configured');
    }

    const response = await fetch(`https://api.cal.com/v1/bookings/${uid}/cancel?apiKey=${apiKey}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Payment failed' }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new AppError(502, 'CALCOM_ERROR', `Cal.com cancellation failed: ${body}`);
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
