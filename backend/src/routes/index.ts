import { Router } from 'express';
import quizRoutes from './quiz.routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Mount quiz routes
router.use('/', quizRoutes);

export default router;
