import { Router } from 'express';
import quizRoutes from './quiz.routes';
import userRoutes from './user.routes';
import adminRoutes from './admin.routes';
import multilingualRoutes from './multilingual.routes';
import achievementRoutes from './achievements.routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Mount routes
router.use('/', quizRoutes);
router.use('/user', userRoutes);
router.use('/admin', adminRoutes);
router.use('/', multilingualRoutes);
router.use('/', achievementRoutes);

export default router;
