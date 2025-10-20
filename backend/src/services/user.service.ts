import { PrismaClient } from '@prisma/client';
import { AchievementService } from './achievement.service';

export class UserService {
  constructor(private prisma: PrismaClient) {}

  // Create or update user from Clerk
  async syncUser(userData: { clerkId: string; email: string; name?: string; avatar?: string }) {
    try {
      const user = await this.prisma.user.upsert({
        where: { clerkId: userData.clerkId },
        update: {
          email: userData.email,
          name: userData.name,
          avatar: userData.avatar,
        },
        create: {
          clerkId: userData.clerkId,
          email: userData.email,
          name: userData.name || 'Anonymous',
          avatar: userData.avatar,
        },
      });

      return user;
    } catch (error) {
      console.error('Error syncing user:', error);
      throw error;
    }
  }

  // Get user by Clerk ID
  async getUserByClerkId(clerkId: string) {
    return await this.prisma.user.findUnique({
      where: { clerkId },
      include: {
        quizAttempts: {
          orderBy: { completedAt: 'desc' },
          take: 10,
        },
      },
    });
  }

  // Save quiz attempt for authenticated user
  async saveQuizAttempt(
    clerkId: string,
    attemptData: {
      topicId: string;
      score: number;
      totalQuestions: number;
      correctAnswers: number;
      percentage: number;
      timeSpent: number;
      difficulty?: string;
      subjectName?: string;
      topicName?: string;
    }
  ) {
    // First get the user
    const user = await this.prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Save the quiz attempt
    const attempt = await this.prisma.quizAttempt.create({
      data: {
        userId: user.id,
        topicId: attemptData.topicId,
        score: attemptData.score,
        totalQuestions: attemptData.totalQuestions,
        correctAnswers: attemptData.correctAnswers,
        percentage: attemptData.percentage,
        timeSpent: attemptData.timeSpent,
        difficulty: attemptData.difficulty || 'medium',
      },
      include: {
        topic: {
          include: {
            subject: true,
          },
        },
      },
    });

    let achievements: Awaited<ReturnType<AchievementService['checkAchievements']>> = [];

    try {
      const achievementService = new AchievementService(this.prisma);
      achievements = await achievementService.checkAchievements(user.id, {
        topicId: attempt.topicId,
        percentage: attempt.percentage,
        timeSpent: attempt.timeSpent,
        totalQuestions: attempt.totalQuestions,
        subjectName: attemptData.subjectName || attempt.topic?.subject?.name,
        topicName: attemptData.topicName || attempt.topic?.name,
      });
    } catch (error) {
      console.error('Error checking achievements:', error);
    }

    return { attempt, achievements };
  }

  // Get user's quiz history
  async getUserQuizHistory(clerkId: string) {
    const user = await this.prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return [];
    }

    return await this.prisma.quizAttempt.findMany({
      where: { userId: user.id },
      include: {
        topic: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
      take: 50,
    });
  }

  // Get user statistics
  async getUserStats(clerkId: string) {
    const user = await this.prisma.user.findUnique({
      where: { clerkId },
      include: {
        quizAttempts: true,
      },
    });

    if (!user) {
      return null;
    }

    const totalQuizzes = user.quizAttempts.length;
    const totalScore = user.quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0);
    const totalQuestions = user.quizAttempts.reduce(
      (sum, attempt) => sum + attempt.totalQuestions,
      0
    );
    const correctAnswers = user.quizAttempts.reduce(
      (sum, attempt) => sum + attempt.correctAnswers,
      0
    );
    const averageScore = totalQuizzes > 0 ? totalScore / totalQuizzes : 0;
    const averagePercentage =
      totalQuizzes > 0
        ? user.quizAttempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / totalQuizzes
        : 0;

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
      stats: {
        totalQuizzes,
        totalQuestions,
        correctAnswers,
        averageScore: averageScore.toFixed(2),
        averagePercentage: averagePercentage.toFixed(2),
      },
    };
  }
}
