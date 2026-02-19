import { Router, Request, Response, NextFunction } from 'express';
import { UserRepository, MentorRepository } from '@owl-mentors/database';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';

const router: Router = Router();

let userRepo: UserRepository;
let mentorRepo: MentorRepository;

function getUserRepo() {
  if (!userRepo) userRepo = new UserRepository();
  return userRepo;
}
function getMentorRepo() {
  if (!mentorRepo) mentorRepo = new MentorRepository();
  return mentorRepo;
}

// All admin routes require admin role
router.use(authenticate, authorize('admin'));

// Unpublish a mentor
router.put('/mentors/:id/unpublish', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mentor = await getMentorRepo().unpublish(req.params.id);
    res.json({ success: true, data: mentor });
  } catch (error) {
    next(error);
  }
});

// Suspend a user
router.put('/users/:id/suspend', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await getUserRepo().suspend(req.params.id);
    res.json({ success: true, data: { message: 'User suspended' } });
  } catch (error) {
    next(error);
  }
});

// Activate a user
router.put('/users/:id/activate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await getUserRepo().activate(req.params.id);
    res.json({ success: true, data: { message: 'User activated' } });
  } catch (error) {
    next(error);
  }
});

// List users
router.get('/users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role, isActive, limit, offset } = req.query;
    const result = await getUserRepo().findAll(
      {
        roles: role as any,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
      },
      Number(limit) || 20,
      Number(offset) || 0,
    );

    res.json({
      success: true,
      data: {
        users: result.users.map(u => ({
          id: u.id,
          email: u.email,
          name: u.name,
          roles: u.roles,
          isActive: u.isActive,
          emailVerified: u.emailVerified,
          createdAt: u.createdAt,
        })),
        total: result.total,
      },
    });
  } catch (error) {
    next(error);
  }
});

// List mentors
router.get('/mentors', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { isActive, limit, offset } = req.query;
    const result = await getMentorRepo().findAll(
      { isActive: isActive !== undefined ? isActive === 'true' : undefined },
      Number(limit) || 20,
      Number(offset) || 0,
    );

    res.json({
      success: true,
      data: {
        mentors: result.mentors,
        total: result.total,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
