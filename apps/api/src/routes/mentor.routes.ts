import { Router, Request, Response, NextFunction } from 'express';
import { MentorRepository, UserRepository, OfferRepository, PolicyRepository } from '@owl-mentors/database';
import { updateMentorSchema, updateAvailabilitySchema, searchMentorsSchema, OnboardingStep } from '@owl-mentors/types';
import { validate, validateQuery } from '../middleware/validation.middleware';
import { authenticate, authorize, requireEmailVerified } from '../middleware/auth.middleware';
import { searchRateLimit } from '../middleware/rateLimit.middleware';
import { logger } from '@owl-mentors/utils';
import { AppError } from '../middleware/error.middleware';
import { EmailService } from '../services/email.service';
import { EmbeddingService } from '../services/embedding.service';
import { MentorSearchService, MentorWithReason, ParsedIntent } from '../services/mentor-search.service';

const embeddingService = new EmbeddingService();
const mentorSearchService = new MentorSearchService();

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

function getFirstString(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : undefined;
  }

  return typeof value === 'string' ? value : undefined;
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
    const profileStepNext: Partial<Record<OnboardingStep, OnboardingStep>> = {
      basics: 'expertise',
      expertise: 'verification',
      verification: 'offers',
    };
    const nextStep = profileStepNext[mentor.onboardingStep];
    if (nextStep) {
      await getMentorRepo().updateOnboardingStep(mentor.id, nextStep);
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
    const offset = Number(params.offset) || 0;

    if (typeof params.languages === 'string') {
      params.languages = [params.languages];
    }
    if (typeof params.specialties === 'string') {
      params.specialties = [params.specialties];
    }
    if (params.maxRate != null) {
      params.maxRate = Number(params.maxRate);
    }
    if (params.minRating != null) {
      params.minRating = Number(params.minRating);
    }
    params.limit = limit;
    params.offset = offset;

    if (params.query) {
      const query = params.query as string;
      logger.info('[MentorSearch] Query received', {
        requestId: req.requestId,
        query,
        limit,
        offset,
        userId: req.userId,
      });
      const parsedIntent: ParsedIntent = await mentorSearchService.parseIntent(query)
        .catch(() => mentorSearchService.buildLocalIntent(query));
      logger.info('[MentorSearch] Intent parsed', {
        requestId: req.requestId,
        query,
        semanticQuery: parsedIntent.semanticQuery,
        maxRate: parsedIntent.maxRate,
        language: parsedIntent.language,
        topic: parsedIntent.topic,
      });

      const structuredFilters = {
        maxRate: parsedIntent.maxRate ?? (params.maxRate ? Number(params.maxRate) : undefined),
        language: parsedIntent.language ?? params.language,
        minRating: params.minRating ? Number(params.minRating) : undefined,
      };

      const keywordQuery = mentorSearchService.buildKeywordQuery(parsedIntent);

      let vectorMentors: MentorWithReason[] = [];
      let semantic = false;
      let llmEnhanced = false;

      try {
        const raw = await embeddingService.searchMentors(parsedIntent.semanticQuery, limit);
        if (raw.length > 0) {
          semantic = true;
          vectorMentors = mentorSearchService.applyStructuredFilters(raw, structuredFilters);
          logger.info('[MentorSearch] Vector search completed', {
            requestId: req.requestId,
            query,
            rawCount: raw.length,
            filteredCount: vectorMentors.length,
          });
        } else {
          logger.info('[MentorSearch] Vector search returned no results', {
            requestId: req.requestId,
            query,
          });
        }
      } catch (vectorErr) {
        logger.warn(`[VectorSearch] Falling back to keyword search: ${(vectorErr as Error).message}`);
      }

      let keywordMentors: MentorWithReason[] = [];
      try {
        const raw = await getMentorRepo().search({ ...params, limit, query: keywordQuery });
        keywordMentors = mentorSearchService.attachHeuristicReasons(
          mentorSearchService.applyStructuredFilters(raw, structuredFilters),
          parsedIntent
        );
        logger.info('[MentorSearch] Keyword search completed', {
          requestId: req.requestId,
          query,
          keywordQuery,
          rawCount: raw.length,
          filteredCount: keywordMentors.length,
        });
      } catch (keywordErr) {
        logger.warn(`[KeywordSearch] Failed: ${(keywordErr as Error).message}`);
      }

      let mentors: MentorWithReason[] = mentorSearchService.mergeResults(vectorMentors, keywordMentors, limit);

      if (mentors.length > 0) {
        try {
          mentors = await mentorSearchService.rerankAndExplain(query, mentors);
          llmEnhanced = true;
          logger.info('[MentorSearch] LLM reranking completed', {
            requestId: req.requestId,
            query,
            count: mentors.length,
          });
        } catch (rankErr) {
          logger.warn(`[MentorSearch] Re-ranking failed, using hybrid order: ${(rankErr as Error).message}`);
        }
      }

      mentors = mentorSearchService.attachHeuristicReasons(mentors, parsedIntent);

      return res.json({
        success: true,
        data: {
          mentors,
          total: mentors.length,
          query: params.query,
          queryAnalysis: mentorSearchService.summarizeIntent(parsedIntent as any),
          semantic,
          hybrid: semantic && keywordMentors.length > 0,
          llmEnhanced,
        },
      });
    }

    const mentors = await getMentorRepo().search(params);
    logger.info('[MentorSearch] Standard search completed', {
      requestId: req.requestId,
      query: params.query,
      total: mentors.length,
      limit,
      offset,
    });
    return res.json({
      success: true,
      data: { mentors, total: mentors.length, query: params.query, semantic: false },
    });
  } catch (error) {
    next(error);
  }
});

// Get all mentor profiles for the authenticated user (for shared-email / multi-profile scenario)
router.get('/me/profiles', authenticate, requireEmailVerified, authorize('mentor'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mentors = await getMentorRepo().findManyByUserId(req.userId!);
    res.json({ success: true, data: mentors });
  } catch (error) {
    next(error);
  }
});

export default router;
