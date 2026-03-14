import { Router } from 'express';
import authRoutes from './auth.routes';
import mentorRoutes from './mentor.routes';
import offerRoutes from './offer.routes';
import policyRoutes from './policy.routes';
import adminRoutes from './admin.routes';
import creditRoutes from './credit.routes';
import topicRoutes from './topic.routes';
import mentorAuthRoutes from './mentor-auth.routes';
import uploadRoutes from './upload.routes';
import integrationRoutes from './integrations.routes';
import bookingRoutes from './booking.routes';
import webhookRoutes from './webhook.routes';
import paymentRoutes from './payment.routes';

const router: Router = Router();

// Mount route modules
router.use('/auth', authRoutes);
router.use('/mentors', mentorRoutes);
router.use('/mentors/me/offers', offerRoutes);
router.use('/mentors/me/policies', policyRoutes);
router.use('/admin', adminRoutes);
router.use('/credits', creditRoutes);
router.use('/topics', topicRoutes);
router.use('/mentor-auth', mentorAuthRoutes);
router.use('/upload', uploadRoutes);
router.use('/integrations', integrationRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/payments', paymentRoutes);
router.use('/', bookingRoutes);

export default router;
