import { Router, Request, Response, NextFunction } from 'express';
import { CareerProfileRepository } from '@owl-mentors/database';
import { careerGoalInputSchema } from '@owl-mentors/types';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { uploadResume } from '../middleware/upload.middleware';
import { AppError } from '../middleware/error.middleware';
import { ResumeParserService } from '../services/resume-parser.service';
import { CareerAnalysisService } from '../services/career-analysis.service';

const router: Router = Router();

const repo = new CareerProfileRepository();
const resumeParserService = new ResumeParserService();
const careerAnalysisService = new CareerAnalysisService();

// Public endpoint — parse a resume without saving, no auth required
router.post(
  '/parse',
  uploadResume.single('resume'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) throw new AppError(400, 'NO_FILE', 'No resume file provided');
      const rawText = await resumeParserService.extractText(req.file.buffer, req.file.mimetype);
      const extractedProfile = await careerAnalysisService.extractCareerProfile(rawText);
      res.json({ success: true, data: { extractedProfile } });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await repo.findByUserId(req.userId!);
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/resume',
  authenticate,
  uploadResume.single('resume'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) throw new AppError(400, 'NO_FILE', 'No resume file provided');

      const rawText = await resumeParserService.extractText(req.file.buffer, req.file.mimetype);
      const extractedProfile = await careerAnalysisService.extractCareerProfile(rawText);
      const profile = await repo.upsertResume(req.userId!, {
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        rawText,
        extractedProfile,
      });

      res.status(201).json({ success: true, data: profile });
    } catch (error) {
      await repo.markFailed(req.userId!, (error as Error).message).catch(() => {});
      next(error);
    }
  }
);

router.post(
  '/analyze',
  authenticate,
  validate(careerGoalInputSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await repo.findByUserId(req.userId!);
      if (!profile?.extractedProfile) {
        throw new AppError(404, 'CAREER_PROFILE_NOT_FOUND', 'Upload a resume before running analysis');
      }

      const goalProfile = await careerAnalysisService.normalizeGoal(req.body, profile.extractedProfile);
      const latestAnalysis = await careerAnalysisService.analyzeCareerProfile(profile.extractedProfile, goalProfile);
      const mentorRecommendations = await careerAnalysisService.recommendMentors(latestAnalysis, goalProfile);
      const updated = await repo.updateAnalysis(req.userId!, {
        goalProfile,
        latestAnalysis,
        mentorRecommendations,
      });

      res.json({ success: true, data: updated });
    } catch (error) {
      await repo.markFailed(req.userId!, (error as Error).message).catch(() => {});
      next(error);
    }
  }
);

export default router;
