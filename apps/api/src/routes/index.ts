import { Router } from 'express';
import authRoutes from './auth.routes';
import providerRoutes from './provider.routes';

const router = Router();

// Mount route modules
router.use('/auth', authRoutes);
router.use('/providers', providerRoutes);

// Add more routes as needed:
// router.use('/meetings', meetingRoutes);
// router.use('/chat', chatRoutes);
// router.use('/notifications', notificationRoutes);

export default router;
