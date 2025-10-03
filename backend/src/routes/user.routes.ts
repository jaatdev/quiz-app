import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { UserService } from '../services/user.service';

const router = Router();
const prisma = new PrismaClient();
const userService = new UserService(prisma);

// Sync user from Clerk
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const { clerkId, email, name, avatar } = req.body;
    
    if (!clerkId || !email) {
      return res.status(400).json({ error: 'ClerkId and email are required' });
    }

    const user = await userService.syncUser({ clerkId, email, name, avatar });
    res.json(user);
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({ error: 'Failed to sync user' });
  }
});

// Get user profile
router.get('/profile/:clerkId', async (req: Request, res: Response) => {
  try {
    const { clerkId } = req.params;
    const user = await userService.getUserByClerkId(clerkId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Save quiz attempt
router.post('/quiz-attempt', async (req: Request, res: Response) => {
  try {
    const { clerkId, ...attemptData } = req.body;
    
    if (!clerkId) {
      return res.status(400).json({ error: 'User authentication required' });
    }

    const attempt = await userService.saveQuizAttempt(clerkId, attemptData);
    res.json(attempt);
  } catch (error) {
    console.error('Error saving quiz attempt:', error);
    res.status(500).json({ error: 'Failed to save quiz attempt' });
  }
});

// Get user's quiz history
router.get('/history/:clerkId', async (req: Request, res: Response) => {
  try {
    const { clerkId } = req.params;
    const history = await userService.getUserQuizHistory(clerkId);
    res.json(history);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Get user statistics
router.get('/stats/:clerkId', async (req: Request, res: Response) => {
  try {
    const { clerkId } = req.params;
    const stats = await userService.getUserStats(clerkId);
    
    if (!stats) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
