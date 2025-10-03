import { Router } from 'express';
import quizRoutes from './quiz.routes';
import userRoutes from './user.routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Mount routes
router.use('/', quizRoutes);
router.use('/user', userRoutes);

export default router;
