import { Router, Request, Response, NextFunction } from 'express';
import { MentorRepository, UserRepository, OfferRepository, PolicyRepository } from '@owl-mentors/database';
import { updateMentorSchema, updateAvailabilitySchema, searchMentorsSchema } from '@owl-mentors/types';
import { validate, validateQuery } from '../middleware/validation.middleware';
import { authenticate, authorize, requireEmailVerified } from '../middleware/auth.middleware';
import { searchRateLimit } from '../middleware/rateLimit.middleware';
import { logger } from '@owl-mentors/utils';
import { AppError } from '../middleware/error.middleware';
import { EmailService } from '../services/email.service';
import { EmbeddingService } from '../services/embedding.service';
import { LLMSearchService } from '../services/llm-search.service';

const embeddingService = new EmbeddingService();
const llmSearchService = new LLMSearchService();

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

    // Any profile change requires re-review and should not stay live until approved again
    const updatePayload = { ...req.body, approvalStatus: 'pending', isActive: false };
    await getMentorRepo().update(mentor.id, updatePayload);

    // Advance onboarding step through the profile-building steps
    const profileStepNext: Record<string, string> = {
      basics: 'expertise',
      expertise: 'verification',
      verification: 'offers',
    };
    if (profileStepNext[mentor.onboardingStep]) {
      await getMentorRepo().updateOnboardingStep(mentor.id, profileStepNext[mentor.onboardingStep]);
    }

    const updated = await getMentorRepo().findById(mentor.id);
    res.json({ success: true, data: updated });

    // Re-embed the updated profile in the background — non-blocking
    embeddingService.embedMentor(mentor.id).catch(err =>
      logger.error(`[Embedding] Failed to embed mentor ${mentor.id}: ${err.message}`)
    );
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
    await getMentorRepo().update(mentor.id, { approvalStatus: 'pending', isActive: false } as any);

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

    // Notify admin — non-blocking, failure must not affect the response
    const user = await getUserRepo().findById(req.userId!);
    EmailService.notifyAdminProfileComplete({
      name: user.name,
      email: user.email,
      mentorId: mentor.id,
    }).catch(() => { });

    res.json({
      success: true,
      data: published,
    });

    // Embed the published profile so it's indexed and ready when admin approves — non-blocking
    embeddingService.embedMentor(mentor.id).catch(err =>
      logger.error(`[Embedding] Failed to embed mentor ${mentor.id} on publish: ${err.message}`)
    );
  } catch (error) {
    next(error);
  }
});

// Get mentor by ID (public)
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mentor = await getMentorRepo().findById(req.params.id);
    const user = await getUserRepo().findById(mentor.userId).catch(() => null);

    res.json({
      success: true,
      data: {
        ...mentor,
        avatarUrl: user?.avatar || null,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Search mentors (public)
// Supports natural language queries via Atlas Vector Search (semantic) with keyword fallback.
// LLM layer adds intent parsing (budget/language extraction) and re-ranking with explanations.
router.get('/', searchRateLimit, validateQuery(searchMentorsSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = req.query as any;
    const limit = Number(params.limit) || 20;

    // --- Vector search path ---
    // When a free-text query is provided, attempt semantic vector search first.
    // Falls back to keyword search if the vector index isn't set up or the embedding fails.
    if (params.query) {
      // Step 1: Parse intent — extract structured filters from natural language (non-blocking)
      let parsedIntent = { semanticQuery: params.query as string, maxRate: undefined as number | undefined, language: undefined as string | undefined };
      try {
        parsedIntent = await llmSearchService.parseIntent(params.query);
        if (parsedIntent.maxRate != null && !params.maxRate) params.maxRate = parsedIntent.maxRate;
        if (parsedIntent.language && !params.language) params.language = parsedIntent.language;
      } catch {
        // graceful — proceed without parsed intent
      }

      // Step 2: Vector search
      try {
        const vectorMentors = await embeddingService.searchMentors(params.query, limit);
        if (vectorMentors.length > 0) {
          // Step 3: Re-rank and attach explanations (non-blocking — degrades gracefully)
          let enrichedMentors: typeof vectorMentors = vectorMentors;
          let llmEnhanced = false;
          try {
            enrichedMentors = await llmSearchService.rerankAndExplain(params.query, vectorMentors);
            llmEnhanced = true;
          } catch (rankErr) {
            logger.warn(`[LLMSearch] Re-ranking failed, using original order: ${(rankErr as Error).message}`);
          }

          return res.json({
            success: true,
            data: { mentors: enrichedMentors, total: enrichedMentors.length, query: params.query, semantic: true, llmEnhanced },
          });
        }
      } catch (vectorErr) {
        logger.warn(`[VectorSearch] Falling back to keyword search: ${(vectorErr as Error).message}`);
      }
    }

    // --- Keyword search fallback ---
    const mentors = await getMentorRepo().search(params);
    return res.json({
      success: true,
      data: { mentors, total: mentors.length, query: params.query, semantic: false, llmEnhanced: false },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
