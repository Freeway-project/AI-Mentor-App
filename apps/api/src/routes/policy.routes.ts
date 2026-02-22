import { Router, Request, Response, NextFunction } from 'express';
import { MentorRepository, PolicyRepository } from '@owl-mentors/database';
import { upsertPolicySchema } from '@owl-mentors/types';
import { validate } from '../middleware/validation.middleware';
import { authenticate, authorize, requireEmailVerified } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';

const router: Router = Router();

let mentorRepo: MentorRepository;
let policyRepo: PolicyRepository;

function getMentorRepo() {
  if (!mentorRepo) mentorRepo = new MentorRepository();
  return mentorRepo;
}
function getPolicyRepo() {
  if (!policyRepo) policyRepo = new PolicyRepository();
  return policyRepo;
}

// Get own policies
router.get('/', authenticate, requireEmailVerified, authorize('mentor'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mentor = await getMentorRepo().findByUserId(req.userId!);
    if (!mentor) {
      throw new AppError(404, 'NOT_FOUND', 'Mentor profile not found');
    }

    const policy = await getPolicyRepo().findByMentorId(mentor.id);

    res.json({
      success: true,
      data: policy,
    });
  } catch (error) {
    next(error);
  }
});

// Upsert policies
router.put('/', authenticate, requireEmailVerified, authorize('mentor'), validate(upsertPolicySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mentor = await getMentorRepo().findByUserId(req.userId!);
    if (!mentor) {
      throw new AppError(404, 'NOT_FOUND', 'Mentor profile not found');
    }

    const policy = await getPolicyRepo().upsert(mentor.id, req.body);

    // Advance onboarding step
    if (mentor.onboardingStep === 'policies') {
      await getMentorRepo().updateOnboardingStep(mentor.id, 'availability');
    }

    res.json({
      success: true,
      data: policy,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
