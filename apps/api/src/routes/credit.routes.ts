import { Router, Request, Response, NextFunction } from 'express';
import { CreditRepository } from '@owl-mentors/database';
import { purchaseCreditsSchema, listTransactionsSchema } from '@owl-mentors/types';
import { authenticate, requireEmailVerified } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';

const router: Router = Router();

let creditRepo: CreditRepository;

function getCreditRepo() {
  if (!creditRepo) creditRepo = new CreditRepository();
  return creditRepo;
}

// All credit routes require authentication AND email verification
router.use(authenticate, requireEmailVerified);

// GET /credits/balance
router.get('/balance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const account = await getCreditRepo().getBalance(req.userId!);
    res.json({ success: true, data: account });
  } catch (error) {
    next(error);
  }
});

// POST /credits/purchase
router.post('/purchase', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = purchaseCreditsSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
    }

    const { amount } = parsed.data;
    const description = `Purchased ${amount} credit${amount !== 1 ? 's' : ''}`;
    const transaction = await getCreditRepo().purchaseCredits(req.userId!, amount, description);
    const account = await getCreditRepo().getBalance(req.userId!);

    res.status(201).json({ success: true, data: { transaction, account } });
  } catch (error) {
    next(error);
  }
});

// GET /credits/transactions
router.get('/transactions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, limit, offset } = req.query;

    const parsed = listTransactionsSchema.safeParse({
      type,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });

    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
    }

    const result = await getCreditRepo().listTransactions(
      { userId: req.userId!, type: parsed.data.type },
      parsed.data.limit,
      parsed.data.offset
    );

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

export default router;
