import { Router } from 'express';
import authRoutes from './auth.routes';
import mentorRoutes from './mentor.routes';
import offerRoutes from './offer.routes';
import policyRoutes from './policy.routes';
import adminRoutes from './admin.routes';

const router: Router = Router();

// Mount route modules
router.use('/auth', authRoutes);
router.use('/mentors', mentorRoutes);
router.use('/mentors/me/offers', offerRoutes);
router.use('/mentors/me/policies', policyRoutes);
router.use('/admin', adminRoutes);

export default router;
