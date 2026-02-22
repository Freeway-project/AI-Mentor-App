import { Router, Request, Response, NextFunction } from 'express';
import { MentorRepository, OfferRepository } from '@owl-mentors/database';
import { createOfferSchema, updateOfferSchema } from '@owl-mentors/types';
import { validate } from '../middleware/validation.middleware';
import { authenticate, authorize, requireEmailVerified } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';

const router: Router = Router();

let mentorRepo: MentorRepository;
let offerRepo: OfferRepository;

function getMentorRepo() {
  if (!mentorRepo) mentorRepo = new MentorRepository();
  return mentorRepo;
}
function getOfferRepo() {
  if (!offerRepo) offerRepo = new OfferRepository();
  return offerRepo;
}

// List own offers
router.get('/', authenticate, requireEmailVerified, authorize('mentor'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mentor = await getMentorRepo().findByUserId(req.userId!);
    if (!mentor) {
      throw new AppError(404, 'NOT_FOUND', 'Mentor profile not found');
    }

    const offers = await getOfferRepo().findByMentorId(mentor.id);

    res.json({
      success: true,
      data: offers,
    });
  } catch (error) {
    next(error);
  }
});

// Create offer
router.post('/', authenticate, requireEmailVerified, authorize('mentor'), validate(createOfferSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mentor = await getMentorRepo().findByUserId(req.userId!);
    if (!mentor) {
      throw new AppError(404, 'NOT_FOUND', 'Mentor profile not found');
    }

    const offer = await getOfferRepo().create(mentor.id, req.body);

    // Advance onboarding step
    if (mentor.onboardingStep === 'offers') {
      await getMentorRepo().updateOnboardingStep(mentor.id, 'policies');
    }

    res.status(201).json({
      success: true,
      data: offer,
    });
  } catch (error) {
    next(error);
  }
});

// Update offer
router.put('/:offerId', authenticate, requireEmailVerified, authorize('mentor'), validate(updateOfferSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mentor = await getMentorRepo().findByUserId(req.userId!);
    if (!mentor) {
      throw new AppError(404, 'NOT_FOUND', 'Mentor profile not found');
    }

    const offer = await getOfferRepo().findById(req.params.offerId);
    if (offer.mentorId !== mentor.id) {
      throw new AppError(403, 'FORBIDDEN', 'You can only edit your own offers');
    }

    const updated = await getOfferRepo().update(req.params.offerId, req.body);

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
});

// Delete offer
router.delete('/:offerId', authenticate, requireEmailVerified, authorize('mentor'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mentor = await getMentorRepo().findByUserId(req.userId!);
    if (!mentor) {
      throw new AppError(404, 'NOT_FOUND', 'Mentor profile not found');
    }

    const offer = await getOfferRepo().findById(req.params.offerId);
    if (offer.mentorId !== mentor.id) {
      throw new AppError(403, 'FORBIDDEN', 'You can only delete your own offers');
    }

    await getOfferRepo().delete(req.params.offerId);

    res.json({
      success: true,
      data: { message: 'Offer deleted' },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
