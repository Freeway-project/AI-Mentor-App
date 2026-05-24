import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import {
  UserRepository,
  MentorRepository,
  MeetingRepository,
  CreditRepository,
  OfferRepository,
  PolicyRepository,
  ServiceUsageRepository,
  ServiceUsageStatus,
} from '@owl-mentors/database';
import { ReviewMessageModel, toReviewMessage } from '../../../../packages/database/src/models/review-message.model';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import { logger } from '@owl-mentors/utils';
import { uploadResume } from '../middleware/upload.middleware';
import { ResumeParserService } from '../services/resume-parser.service';
import { MentorProfileExtractorService } from '../services/mentor-profile-extractor.service';

let resumeParser: ResumeParserService;
let mentorExtractor: MentorProfileExtractorService;
function getResumeParser() { if (!resumeParser) resumeParser = new ResumeParserService(); return resumeParser; }
function getMentorExtractor() { if (!mentorExtractor) mentorExtractor = new MentorProfileExtractorService(); return mentorExtractor; }

const router: Router = Router();

let userRepo: UserRepository;
let mentorRepo: MentorRepository;
let meetingRepo: MeetingRepository;
let creditRepo: CreditRepository;
let offerRepo: OfferRepository;
let policyRepo: PolicyRepository;
let serviceUsageRepo: ServiceUsageRepository;

function getUserRepo() { if (!userRepo) userRepo = new UserRepository(); return userRepo; }
function getMentorRepo() { if (!mentorRepo) mentorRepo = new MentorRepository(); return mentorRepo; }
function getMeetingRepo() { if (!meetingRepo) meetingRepo = new MeetingRepository(); return meetingRepo; }
function getCreditRepo() { if (!creditRepo) creditRepo = new CreditRepository(); return creditRepo; }
function getOfferRepo() { if (!offerRepo) offerRepo = new OfferRepository(); return offerRepo; }
function getPolicyRepo() { if (!policyRepo) policyRepo = new PolicyRepository(); return policyRepo; }
function getServiceUsageRepo() { if (!serviceUsageRepo) serviceUsageRepo = new ServiceUsageRepository(); return serviceUsageRepo; }

// All admin routes require admin role
router.use(authenticate, authorize('admin'));

// ─── Mentor approval ────────────────────────────────────────────────────────

// GET /admin/coaches/pending
router.get('/coaches/pending', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit, offset } = req.query;
    const result = await getMentorRepo().findPendingApproval(Number(limit) || 20, Number(offset) || 0);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// PUT /admin/coaches/:id/approve
router.put('/coaches/:id/approve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { note } = req.body;
    const mentor = await getMentorRepo().approve(req.params.id, req.userId!, note);
    res.json({ success: true, data: mentor });
  } catch (error) {
    next(error);
  }
});

// PUT /admin/coaches/:id/reject
router.put('/coaches/:id/reject', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { note } = req.body;
    if (!note) throw new AppError(400, 'VALIDATION_ERROR', 'Rejection note is required');
    const mentor = await getMentorRepo().reject(req.params.id, req.userId!, note);
    res.json({ success: true, data: mentor });
  } catch (error) {
    next(error);
  }
});

// PUT /admin/coaches/:id/verify
router.put('/coaches/:id/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mentor = await getMentorRepo().setVerified(req.params.id, true);
    logger.info('[Admin] Mentor verified', { requestId: req.requestId, mentorId: req.params.id, adminId: req.userId });
    res.json({ success: true, data: mentor });
  } catch (error) {
    next(error);
  }
});

// PUT /admin/coaches/:id/unverify
router.put('/coaches/:id/unverify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mentor = await getMentorRepo().setVerified(req.params.id, false);
    logger.info('[Admin] Mentor unverified', { requestId: req.requestId, mentorId: req.params.id, adminId: req.userId });
    res.json({ success: true, data: mentor });
  } catch (error) {
    next(error);
  }
});

// ─── Stats ───────────────────────────────────────────────────────────────────

// GET /admin/stats
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      usersResult,
      mentorsResult,
      pendingResult,
      statusCounts,
      creditStats,
    ] = await Promise.all([
      getUserRepo().findAll({}, 1, 0),
      getMentorRepo().findAll({ isActive: true }, 1, 0),
      getMentorRepo().findPendingApproval(1, 0),
      getMeetingRepo().getStatusCounts(),
      getCreditRepo().getCirculationStats(),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers: usersResult.total,
        activeCoaches: mentorsResult.total,
        pendingApproval: pendingResult.total,
        sessionsByStatus: statusCounts,
        credits: creditStats,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── Sessions ────────────────────────────────────────────────────────────────

// GET /admin/sessions
router.get('/sessions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, mentorId, menteeId, startDate, endDate, limit, offset } = req.query;

    const result = await getMeetingRepo().listAll({
      status: status as any,
      mentorId: mentorId as string,
      menteeId: menteeId as string,
      startDate: startDate as string,
      endDate: endDate as string,
      limit: Number(limit) || 20,
      offset: Number(offset) || 0,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// ─── Credits ─────────────────────────────────────────────────────────────────

// GET /admin/credits
router.get('/credits', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, type, limit, offset } = req.query;
    const result = await getCreditRepo().listTransactions(
      { userId: userId as string, type: type as any },
      Number(limit) || 20,
      Number(offset) || 0
    );
    const stats = await getCreditRepo().getCirculationStats();
    res.json({ success: true, data: { ...result, stats } });
  } catch (error) {
    next(error);
  }
});

// ─── Service Usage ───────────────────────────────────────────────────────────

// GET /admin/service-usage
router.get('/service-usage', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { days, service, provider, status, limit, offset } = req.query;
    const parsedDays = Math.max(1, Math.min(Number(days) || 30, 365));
    const parsedLimit = Math.max(1, Math.min(Number(limit) || 25, 100));
    const parsedOffset = Math.max(0, Number(offset) || 0);
    const allowedStatuses: ServiceUsageStatus[] = ['success', 'failed'];
    const parsedStatus = typeof status === 'string' && allowedStatuses.includes(status as ServiceUsageStatus)
      ? status as ServiceUsageStatus
      : undefined;
    const since = new Date(Date.now() - parsedDays * 24 * 60 * 60 * 1000);
    const filters = {
      since,
      service: typeof service === 'string' && service.trim() ? service.trim() : undefined,
      provider: typeof provider === 'string' && provider.trim() ? provider.trim() : undefined,
      status: parsedStatus,
    };

    const [overview, services, recordsResult] = await Promise.all([
      getServiceUsageRepo().getOverview(filters),
      getServiceUsageRepo().getServiceBreakdown(filters),
      getServiceUsageRepo().list(filters, parsedLimit, parsedOffset),
    ]);

    res.json({
      success: true,
      data: {
        overview,
        services,
        records: recordsResult.records,
        total: recordsResult.total,
        filters: {
          ...filters,
          days: parsedDays,
          since,
          limit: parsedLimit,
          offset: parsedOffset,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── Users ───────────────────────────────────────────────────────────────────

// GET /admin/users
router.get('/users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role, isActive, search, limit, offset } = req.query;

    // Never show admin accounts in user management
    if (role === 'admin') {
      return res.json({ success: true, data: { users: [], total: 0 } });
    }

    const result = await getUserRepo().findAll(
      {
        roles: role as any,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        search: search as string,
      },
      Number(limit) || 20,
      Number(offset) || 0,
    );

    // Strip out any admin accounts that slipped through
    const nonAdminUsers = result.users.filter(u => !u.roles.includes('admin'));

    res.json({
      success: true,
      data: {
        users: nonAdminUsers.map(u => ({
          id: u.id,
          email: u.email,
          name: u.name,
          roles: u.roles,
          isActive: u.isActive,
          emailVerified: u.emailVerified,
          createdAt: u.createdAt,
        })),
        total: nonAdminUsers.length < result.users.length
          ? result.total - (result.users.length - nonAdminUsers.length)
          : result.total,
      },
    });
  } catch (error) {
    next(error);
  }
});

// PUT /admin/users/:id/suspend
router.put('/users/:id/suspend', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await getUserRepo().suspend(req.params.id);
    res.json({ success: true, data: { message: 'User suspended' } });
  } catch (error) {
    next(error);
  }
});

// PUT /admin/users/:id/activate
router.put('/users/:id/activate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await getUserRepo().activate(req.params.id);
    res.json({ success: true, data: { message: 'User activated' } });
  } catch (error) {
    next(error);
  }
});

// ─── Mentors/Coaches ─────────────────────────────────────────────────────────

// GET /admin/coaches/:id — full mentor profile for the admin review page
router.get('/coaches/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mentor = await getMentorRepo().findById(req.params.id);
    if (!mentor) throw new AppError(404, 'NOT_FOUND', 'Mentor not found');

    const [offersResult, policyResult, userResult] = await Promise.allSettled([
      getOfferRepo().findByMentorId(mentor.id),
      getPolicyRepo().findByMentorId(mentor.id),
      getUserRepo().findById(mentor.userId),
    ]);

    const dataWarnings: string[] = [];

    const offers = offersResult.status === 'fulfilled'
      ? offersResult.value
      : (() => {
          logger.warn('Admin coach detail: failed to load offers', {
            mentorId: mentor.id,
            error: offersResult.reason instanceof Error ? offersResult.reason.message : String(offersResult.reason),
          });
          dataWarnings.push('Session offers could not be loaded');
          return [];
        })();

    const policy = policyResult.status === 'fulfilled'
      ? policyResult.value
      : (() => {
          logger.warn('Admin coach detail: failed to load policy', {
            mentorId: mentor.id,
            error: policyResult.reason instanceof Error ? policyResult.reason.message : String(policyResult.reason),
          });
          dataWarnings.push('Cancellation policy could not be loaded');
          return null;
        })();

    const user = userResult.status === 'fulfilled'
      ? userResult.value
      : (() => {
          logger.warn('Admin coach detail: failed to load linked user', {
            mentorId: mentor.id,
            userId: mentor.userId,
            error: userResult.reason instanceof Error ? userResult.reason.message : String(userResult.reason),
          });
          dataWarnings.push('Linked account contact details could not be loaded');
          return null;
        })();

    res.json({
      success: true,
      data: {
        ...mentor,
        offers,
        policy,
        avatarUrl: user?.avatar || null,
        email: user?.email || null,
        phone: user?.phone || null,
        dataWarnings,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /admin/mentors (legacy) + /admin/coaches
router.get('/mentors', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { isActive, approvalStatus, limit, offset } = req.query;
    const result = await getMentorRepo().findAll(
      {
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        approvalStatus: approvalStatus as any,
      },
      Number(limit) || 20,
      Number(offset) || 0,
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.get('/coaches', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { isActive, approvalStatus, limit, offset } = req.query;
    const result = await getMentorRepo().findAll(
      {
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        approvalStatus: approvalStatus as any,
      },
      Number(limit) || 20,
      Number(offset) || 0,
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// PUT /admin/mentors/:id/unpublish (legacy)
router.put('/mentors/:id/unpublish', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mentor = await getMentorRepo().unpublish(req.params.id);
    res.json({ success: true, data: mentor });
  } catch (error) {
    next(error);
  }
});

// ─── Review Chat (Admin ↔ Mentor) ────────────────────────────────────────────────────

// GET /admin/coaches/:id/messages  — list review thread for a mentor
router.get('/coaches/:id/messages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const msgs = await ReviewMessageModel
      .find({ mentorId: req.params.id })
      .sort({ createdAt: 1 })
      .lean();
    res.json({ success: true, data: (msgs as any[]).map(toReviewMessage) });
  } catch (error) { next(error); }
});

// POST /admin/coaches/:id/messages  — admin sends a message
router.post('/coaches/:id/messages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) throw new AppError(400, 'VALIDATION_ERROR', 'Message content is required');
    const trimmedContent = content.trim();
    const msg = await ReviewMessageModel.create({
      mentorId: req.params.id,
      senderId: req.userId!,
      senderRole: 'admin',
      content: trimmedContent,
      readByAdmin: true,
      readByMentor: false,
    });

    // Notify mentor by email (non-blocking) so they know there is review feedback to address
    (async () => {
      try {
        const mentor = await getMentorRepo().findById(req.params.id);
        const user = await getUserRepo().findById(mentor.userId);
        await EmailService.notifyMentorReviewMessage({
          mentorName: mentor.name || user.name,
          mentorEmail: user.email,
          mentorId: mentor.id,
          message: trimmedContent,
        });
      } catch (err) {
        logger.warn('Admin review message email notification failed', {
          mentorId: req.params.id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    })();

    res.status(201).json({ success: true, data: toReviewMessage(msg) });
  } catch (error) { next(error); }
});

// PATCH /admin/coaches/:id/messages/read  — mark all messages as read by admin
router.patch('/coaches/:id/messages/read', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await ReviewMessageModel.updateMany(
      { mentorId: _req.params.id, readByAdmin: false },
      { $set: { readByAdmin: true } }
    );
    res.json({ success: true });
  } catch (error) { next(error); }
});

// ─── Marketing: Email Templates ───────────────────────────────────────────────
import { EmailTemplateModel, toEmailTemplate } from '../../../../packages/database/src/models/email-template.model';
import { CampaignRunModel as CRModel, toCampaignRun as toCR } from '../../../../packages/database/src/models/campaign-run.model';
import { EmailService } from '../services/email.service';

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// GET /admin/marketing/templates
router.get('/marketing/templates', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const templates = await EmailTemplateModel.find().sort({ createdAt: -1 });
    res.json({ success: true, data: templates.map(toEmailTemplate) });
  } catch (error) { next(error); }
});

// POST /admin/marketing/templates
router.post('/marketing/templates', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, subject, bodyHtml } = req.body as { name?: string; subject?: string; bodyHtml?: string };
    if (!name || !subject || !bodyHtml) throw new AppError(400, 'VALIDATION_ERROR', 'name, subject, and bodyHtml are required');
    const doc = await EmailTemplateModel.create({ name, subject, bodyHtml });
    res.status(201).json({ success: true, data: toEmailTemplate(doc) });
  } catch (error) { next(error); }
});

// PUT /admin/marketing/templates/:id
router.put('/marketing/templates/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, subject, bodyHtml } = req.body as { name?: string; subject?: string; bodyHtml?: string };
    const doc = await EmailTemplateModel.findByIdAndUpdate(
      req.params.id,
      { ...(name && { name }), ...(subject && { subject }), ...(bodyHtml && { bodyHtml }) },
      { new: true }
    );
    if (!doc) throw new AppError(404, 'NOT_FOUND', 'Template not found');
    res.json({ success: true, data: toEmailTemplate(doc) });
  } catch (error) { next(error); }
});

// DELETE /admin/marketing/templates/:id
router.delete('/marketing/templates/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doc = await EmailTemplateModel.findByIdAndDelete(req.params.id);
    if (!doc) throw new AppError(404, 'NOT_FOUND', 'Template not found');
    res.json({ success: true, data: { message: 'Template deleted' } });
  } catch (error) { next(error); }
});

// ─── Marketing: Campaign Send (non-blocking background) ───────────────────────

// POST /admin/marketing/send
router.post('/marketing/send', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { templateId, recipients } = req.body as {
      templateId?: string;
      recipients?: { name: string; email: string }[];
    };

    if (!templateId || !Array.isArray(recipients) || recipients.length === 0) {
      throw new AppError(400, 'VALIDATION_ERROR', 'templateId and at least one recipient are required');
    }

    const template = await EmailTemplateModel.findById(templateId);
    if (!template) throw new AppError(404, 'NOT_FOUND', 'Template not found');

    // Create the campaign run document
    const run = await CRModel.create({
      templateId: template._id.toString(),
      templateName: template.name,
      subject: template.subject,
      recipients: recipients.map((r) => ({ name: r.name, email: r.email, status: 'pending' })),
      total: recipients.length,
      sent: 0,
      failed: 0,
      status: 'running',
      startedAt: new Date(),
    });

    // Respond immediately — fire and forget the background loop
    res.status(202).json({ success: true, data: { campaignRunId: run._id.toString(), total: recipients.length } });

    // ─ Background send loop (no external queue needed) ─
    ; (async () => {
      let sent = 0;
      let failed = 0;

      for (let i = 0; i < recipients.length; i++) {
        const { name, email } = recipients[i];
        try {
          await EmailService.sendMarketing(email, name, template.subject, template.bodyHtml);
          sent++;
          await CRModel.findByIdAndUpdate(run._id, {
            $set: { [`recipients.${i}.status`]: 'sent', sent, failed },
          });
        } catch (err) {
          failed++;
          await CRModel.findByIdAndUpdate(run._id, {
            $set: {
              [`recipients.${i}.status`]: 'failed',
              [`recipients.${i}.errorMessage`]: (err as Error).message,
              sent,
              failed,
            },
          });
        }

        // Delay between sends to avoid SMTP throttling
        if (i < recipients.length - 1) {
          await sleep(1000);
        }
      }

      // Mark campaign as complete
      await CRModel.findByIdAndUpdate(run._id, {
        $set: { status: 'complete', completedAt: new Date(), sent, failed },
      });
    })();
  } catch (error) { next(error); }
});

// GET /admin/marketing/campaigns
router.get('/marketing/campaigns', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const runs = await CRModel.find().sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: runs.map(toCR) });
  } catch (error) { next(error); }
});

// GET /admin/marketing/campaigns/:runId
router.get('/marketing/campaigns/:runId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const run = await CRModel.findById(req.params.runId);
    if (!run) throw new AppError(404, 'NOT_FOUND', 'Campaign run not found');
    res.json({ success: true, data: toCR(run) });
  } catch (error) { next(error); }
});

// ─── Admin Mentor Creation ───────────────────────────────────────────────────

// POST /admin/coaches/parse-resume
router.post('/coaches/parse-resume', uploadResume.single('resume'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) throw new AppError(400, 'MISSING_FILE', 'No resume file uploaded');

    const rawText = await getResumeParser().extractText(req.file.buffer, req.file.mimetype);
    const mentorFields = await getMentorExtractor().extractMentorFields(rawText);

    res.json({ success: true, data: { mentorFields } });
  } catch (error) {
    next(error);
  }
});

// POST /admin/coaches
router.post('/coaches', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name, headline, bio, specialties, expertise, languages, hourlyRate } = req.body;

    if (!email || !name) throw new AppError(400, 'MISSING_FIELDS', 'email and name are required');

    const normalizedEmail = email.toLowerCase().trim();

    let existingUser = await getUserRepo().findByEmail(normalizedEmail);
    let isExistingUser = false;
    let generatedPassword: string | undefined;
    let userId: string;

    if (existingUser) {
      isExistingUser = true;
      userId = existingUser.id;
      // Ensure mentor role is present
      if (!existingUser.roles.includes('mentor')) {
        await getUserRepo().addRole(userId, 'mentor');
      }
    } else {
      // Generate password if not provided
      const plainPassword = password || crypto.randomBytes(12).toString('hex');
      if (!password) generatedPassword = plainPassword;

      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      const newUser = await getUserRepo().create({
        email: normalizedEmail,
        password: hashedPassword,
        name,
        roles: ['mentor'],
        emailVerified: true,
      });
      userId = newUser.id;
    }

    const mentor = await getMentorRepo().createFull({
      userId,
      name,
      headline,
      bio,
      specialties: Array.isArray(specialties) ? specialties : [],
      expertise: Array.isArray(expertise) ? expertise : [],
      languages: Array.isArray(languages) && languages.length > 0 ? languages : ['English'],
      hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
      approvalStatus: 'approved',
      isActive: true,
      onboardingStep: 'published',
      createdBy: req.userId,
    });

    const user = await getUserRepo().findById(userId);

    logger.info(`[Admin] Created mentor profile ${mentor.id} for user ${userId} (existingUser=${isExistingUser})`);

    res.status(201).json({
      success: true,
      data: {
        mentor,
        user: { id: user.id, email: user.email, name: user.name },
        isExistingUser,
        ...(generatedPassword ? { generatedPassword } : {}),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
