import { Router, Request, Response, NextFunction } from 'express';
import { MentorRepository, UserRepository, OfferRepository, PolicyRepository } from '@owl-mentors/database';
import { updateMentorSchema, updateAvailabilitySchema, searchMentorsSchema } from '@owl-mentors/types';
import { validate, validateQuery } from '../middleware/validation.middleware';
import { authenticate, authorize, requireEmailVerified } from '../middleware/auth.middleware';
import { createLLMClient, buildProviderRankingPrompt } from '@owl-mentors/llm';
import { logger } from '@owl-mentors/utils';
import { AppError } from '../middleware/error.middleware';

const router: Router = Router();

let mentorRepo: MentorRepository;
let userRepo: UserRepository;
let offerRepo: OfferRepository;
let policyRepo: PolicyRepository;

function getMentorRepo() {
  if (!mentorRepo) mentorRepo = new MentorRepository();
  return mentorRepo;
}
function getUserRepo() {
  if (!userRepo) userRepo = new UserRepository();
  return userRepo;
}
function getOfferRepo() {
  if (!offerRepo) offerRepo = new OfferRepository();
  return offerRepo;
}
function getPolicyRepo() {
  if (!policyRepo) policyRepo = new PolicyRepository();
  return policyRepo;
}

// Become a mentor
router.post('/become', authenticate, requireEmailVerified, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await getMentorRepo().findByUserId(req.userId!);
    if (existing) {
      throw new AppError(409, 'ALREADY_MENTOR', 'You already have a mentor profile');
    }

    const user = await getUserRepo().findById(req.userId!);
    const mentor = await getMentorRepo().create({ userId: req.userId!, name: user.name });
    await getUserRepo().addRole(req.userId!, 'mentor');

    res.status(201).json({
      success: true,
      data: mentor,
    });
  } catch (error) {
    next(error);
  }
});

// Get own mentor profile
router.get('/me', authenticate, requireEmailVerified, authorize('mentor'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mentor = await getMentorRepo().findByUserId(req.userId!);
    if (!mentor) {
      throw new AppError(404, 'NOT_FOUND', 'Mentor profile not found');
    }

    res.json({
      success: true,
      data: mentor,
    });
  } catch (error) {
    next(error);
  }
});

// Update own mentor profile
router.put('/me', authenticate, requireEmailVerified, authorize('mentor'), validate(updateMentorSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mentor = await getMentorRepo().findByUserId(req.userId!);
    if (!mentor) {
      throw new AppError(404, 'NOT_FOUND', 'Mentor profile not found');
    }

    // Any profile change resets approval to pending (requires re-review)
    const updatePayload = { ...req.body, approvalStatus: 'pending' };
    await getMentorRepo().update(mentor.id, updatePayload);

    // Advance onboarding step if on profile step
    if (mentor.onboardingStep === 'profile') {
      await getMentorRepo().updateOnboardingStep(mentor.id, 'offers');
    }

    res.json({
      success: true,
      data: await getMentorRepo().findById(mentor.id),
    });
  } catch (error) {
    next(error);
  }
});

// Update availability
router.put('/me/availability', authenticate, requireEmailVerified, authorize('mentor'), validate(updateAvailabilitySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mentor = await getMentorRepo().findByUserId(req.userId!);
    if (!mentor) {
      throw new AppError(404, 'NOT_FOUND', 'Mentor profile not found');
    }

    await getMentorRepo().updateAvailability(mentor.id, req.body);

    if (mentor.onboardingStep === 'availability') {
      await getMentorRepo().updateOnboardingStep(mentor.id, 'review');
    }

    res.json({
      success: true,
      data: await getMentorRepo().findById(mentor.id),
    });
  } catch (error) {
    next(error);
  }
});

// Publish profile
router.post('/me/publish', authenticate, requireEmailVerified, authorize('mentor'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mentor = await getMentorRepo().findByUserId(req.userId!);
    if (!mentor) {
      throw new AppError(404, 'NOT_FOUND', 'Mentor profile not found');
    }

    // Validate all steps complete
    if (!mentor.bio && !mentor.headline) {
      throw new AppError(400, 'INCOMPLETE_PROFILE', 'Please complete your profile before publishing');
    }

    const offers = await getOfferRepo().findByMentorId(mentor.id);
    if (offers.length === 0) {
      throw new AppError(400, 'NO_OFFERS', 'Please add at least one session offer before publishing');
    }

    const policy = await getPolicyRepo().findByMentorId(mentor.id);
    if (!policy) {
      throw new AppError(400, 'NO_POLICY', 'Please set your policies before publishing');
    }

    if (!mentor.availability) {
      throw new AppError(400, 'NO_AVAILABILITY', 'Please set your availability before publishing');
    }

    const published = await getMentorRepo().publish(mentor.id);

    res.json({
      success: true,
      data: published,
    });
  } catch (error) {
    next(error);
  }
});

// Get mentor by ID (public)
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mentor = await getMentorRepo().findById(req.params.id);

    res.json({
      success: true,
      data: mentor,
    });
  } catch (error) {
    next(error);
  }
});

// Search mentors (public)
router.get('/', validateQuery(searchMentorsSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = req.query as any;

    const mentors = await getMentorRepo().search(params);

    if (params.query && mentors.length > 0) {
      try {
        const llm = createLLMClient();
        const messages = buildProviderRankingPrompt(params.query, mentors);

        const response = await llm.chat(messages, {
          temperature: 0.3,
          maxTokens: 1000,
        });

        const ranking = JSON.parse(response.content);

        const rankedMentors = mentors
          .map((mentor) => {
            const rank = ranking.find((r: any) => r.providerId === mentor.id);
            return {
              ...mentor,
              aiScore: rank?.score || 0,
              aiReason: rank?.reason,
            };
          })
          .sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));

        res.json({
          success: true,
          data: {
            mentors: rankedMentors,
            total: mentors.length,
            query: params.query,
          },
        });
      } catch (llmError) {
        logger.error('LLM ranking failed, returning unranked results', llmError as Error);
        res.json({
          success: true,
          data: {
            mentors,
            total: mentors.length,
            query: params.query,
          },
        });
      }
    } else {
      res.json({
        success: true,
        data: {
          mentors,
          total: mentors.length,
        },
      });
    }
  } catch (error) {
    next(error);
  }
});

export default router;
