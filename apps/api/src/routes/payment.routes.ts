import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireEmailVerified } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import { MentorRepository, OfferRepository } from '@owl-mentors/database';
import { StripeService } from '../services/stripe.service';

const router: Router = Router();
const mentorRepo = new MentorRepository();
const offerRepo = new OfferRepository();
const stripeService = new StripeService();

// POST /api/payments/create-payment-intent
router.post('/create-payment-intent', authenticate, requireEmailVerified, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { mentorId, offerId, scheduledAt, duration } = req.body;

    if (!mentorId || !scheduledAt) {
      throw new AppError(400, 'VALIDATION_ERROR', 'mentorId and scheduledAt are required');
    }

    const mentor = await mentorRepo.findById(mentorId);

    let amountUsd: number;
    let sessionTitle: string;
    const durationMin = Number(duration) || 30;

    if (offerId) {
      const offer = await offerRepo.findById(offerId);
      if (offer.mentorId !== mentorId) {
        throw new AppError(400, 'INVALID_OFFER', 'Offer does not belong to this mentor');
      }
      amountUsd = offer.price;
      sessionTitle = offer.title;
    } else {
      // Fall back to hourly rate
      const rate = mentor.hourlyRate ?? 50;
      amountUsd = durationMin <= 30 ? rate / 2 : rate;
      sessionTitle = 'Mentoring Session';
    }

    const amountCents = Math.round(amountUsd * 100);
    if (amountCents < 50) {
      throw new AppError(400, 'INVALID_AMOUNT', 'Session price must be at least $0.50');
    }

    const { clientSecret, paymentIntentId } = await stripeService.createPaymentIntent({
      amountCents,
      metadata: {
        mentorId,
        menteeId: req.userId!,
        offerId: offerId ?? '',
        scheduledAt,
        duration: String(durationMin),
        title: sessionTitle,
      },
    });

    res.json({
      success: true,
      data: { clientSecret, paymentIntentId, amountUsd, sessionTitle },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
