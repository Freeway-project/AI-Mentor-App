import { Router, Request, Response, NextFunction } from 'express';
import { UserRepository, MentorRepository, MeetingRepository, CreditRepository } from '@owl-mentors/database';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';

const router: Router = Router();

let userRepo: UserRepository;
let mentorRepo: MentorRepository;
let meetingRepo: MeetingRepository;
let creditRepo: CreditRepository;

function getUserRepo() { if (!userRepo) userRepo = new UserRepository(); return userRepo; }
function getMentorRepo() { if (!mentorRepo) mentorRepo = new MentorRepository(); return mentorRepo; }
function getMeetingRepo() { if (!meetingRepo) meetingRepo = new MeetingRepository(); return meetingRepo; }
function getCreditRepo() { if (!creditRepo) creditRepo = new CreditRepository(); return creditRepo; }

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

export default router;
