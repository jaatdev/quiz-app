import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// Middleware to verify user is authenticated
const authenticateUser = async (req: any, res: Response, next: Function) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const clerkId = req.headers['x-clerk-user-id'] as string;

    if (!clerkId && !userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    // Get user by clerkId
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkId || '' }
    });

    if (!user && !userId) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    req.userId = user?.id || userId;
    req.clerkId = clerkId || user?.clerkId;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ success: false, error: 'Authentication failed' });
  }
};

interface AchievementData {
  unlocked: string[];
  progress: Record<string, { progress: number; maxProgress: number }>;
}

/**
 * GET /api/user/achievements
 * Get user's achievement data
 */
router.get('/user/achievements', authenticateUser, async (req: any, res: Response) => {
  try {
    const userId = req.userId;

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId: req.clerkId }
    });

    if (!user) {
      return res.status(200).json({
        success: true,
        data: {
          userId: null,
          achievements: {
            unlocked: [],
            progress: {}
          },
          lastUpdated: new Date()
        }
      });
    }

    // Get achievement progress
    let achievementProgress = await prisma.achievementProgress.findUnique({
      where: { userId: user.id }
    });

    if (!achievementProgress) {
      // Return empty if no progress record exists
      return res.status(200).json({
        success: true,
        data: {
          userId: user.id,
          achievements: {
            unlocked: [],
            progress: {}
          },
          lastUpdated: new Date()
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        userId: user.id,
        achievements: {
          unlocked: achievementProgress.unlocked,
          progress: achievementProgress.progress as any
        },
        lastUpdated: achievementProgress.updatedAt
      }
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch achievements'
    });
  }
});

/**
 * POST /api/user/achievements
 * Create or initialize user's achievement record
 */
router.post('/user/achievements', authenticateUser, async (req: any, res: Response) => {
  try {
    const { unlocked = [], progress = {} } = req.body;

    // Get or create user
    let user = await prisma.user.findUnique({
      where: { clerkId: req.clerkId }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkId: req.clerkId,
          email: req.body.email || 'no-email@example.com',
          name: req.body.name || 'Anonymous User'
        }
      });
    }

    // Create achievement progress record
    const achievementProgress = await prisma.achievementProgress.create({
      data: {
        userId: user.id,
        unlocked,
        progress
      }
    });

    res.status(201).json({
      success: true,
      data: {
        userId: user.id,
        achievements: {
          unlocked,
          progress
        },
        createdAt: achievementProgress.createdAt
      }
    });
  } catch (error) {
    console.error('Create achievements error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create achievement record'
    });
  }
});

/**
 * PUT /api/user/achievements
 * Update user's achievement data (sync from client)
 */
router.put('/user/achievements', authenticateUser, async (req: any, res: Response) => {
  try {
    const { unlocked = [], progress = {} } = req.body;

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId: req.clerkId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Find existing achievement progress
    let achievementProgress = await prisma.achievementProgress.findUnique({
      where: { userId: user.id }
    });

    if (!achievementProgress) {
      // Create new if doesn't exist
      achievementProgress = await prisma.achievementProgress.create({
        data: {
          userId: user.id,
          unlocked,
          progress
        }
      });
    } else {
      // Update existing
      achievementProgress = await prisma.achievementProgress.update({
        where: { userId: user.id },
        data: {
          unlocked,
          progress
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        userId: user.id,
        achievements: {
          unlocked,
          progress
        },
        updatedAt: achievementProgress.updatedAt
      },
      message: 'Achievements synced successfully'
    });
  } catch (error) {
    console.error('Update achievements error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update achievements'
    });
  }
});

/**
 * GET /api/user/achievements/leaderboard
 * Get leaderboard based on achievements
 * Query params: limit (default 10), offset (default 0)
 */
router.get('/user/achievements/leaderboard', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    // Get users with most achievements
    const achievements = await prisma.achievementProgress.findMany({
      take: limit,
      skip: offset,
      orderBy: {
        updatedAt: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Format leaderboard data
    const leaderboard = achievements.map((achievement) => {
      return {
        user: achievement.user,
        totalUnlocked: achievement.unlocked.length,
        unlockedAchievements: achievement.unlocked,
        progress: achievement.progress as any,
        updatedAt: achievement.updatedAt
      };
    });

    res.status(200).json({
      success: true,
      data: leaderboard,
      pagination: {
        limit,
        offset,
        total: await prisma.achievementProgress.count()
      }
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch achievement leaderboard'
    });
  }
});

/**
 * GET /api/user/achievements/stats
 * Get global achievement statistics
 */
router.get('/user/achievements/stats', async (req: Request, res: Response) => {
  try {
    const achievements = await prisma.achievementProgress.findMany();

    // Calculate statistics
    const totalAchievementTypes = 7;
    const stats: Record<string, any> = {
      totalUsers: await prisma.user.count(),
      totalAchievementRecords: achievements.length,
      unlockedByType: {}
    };

    // Count unlocks by achievement type
    achievements.forEach((achievement) => {
      achievement.unlocked.forEach((type) => {
        stats.unlockedByType[type] = (stats.unlockedByType[type] || 0) + 1;
      });
    });

    // Calculate average unlocked per user
    const totalUnlocked = Object.values(stats.unlockedByType).reduce((a: any, b: any) => (a as number) + (b as number), 0) || 0;
    stats.averageUnlockedPerUser = achievements.length > 0 ? ((totalUnlocked as number) / achievements.length).toFixed(2) : 0;
    stats.totalAchievementTypes = totalAchievementTypes;

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch achievement statistics'
    });
  }
});

/**
 * DELETE /api/user/achievements
 * Delete user's achievement record (admin only or own data)
 */
router.delete('/user/achievements', authenticateUser, async (req: any, res: Response) => {
  try {
    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId: req.clerkId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Delete achievement progress
    await prisma.achievementProgress.deleteMany({
      where: { userId: user.id }
    });

    res.status(200).json({
      success: true,
      message: 'Achievements deleted successfully'
    });
  } catch (error) {
    console.error('Delete achievements error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete achievements'
    });
  }
});

export default router;
