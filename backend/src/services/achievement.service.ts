import { PrismaClient } from '@prisma/client';

export class AchievementService {
  constructor(private prisma: PrismaClient) {}

  // Check and award achievements after each quiz
  async checkAchievements(userId: string, quizData: any) {
    const achievements = [];

    // Get user's quiz history
    const userQuizzes = await this.prisma.quizAttempt.findMany({
      where: { userId },
    });

    // First Quiz Achievement
    if (userQuizzes.length === 1) {
      achievements.push({
        userId,
        type: 'first_quiz',
        title: 'First Steps',
        description: 'Complete your first quiz',
        icon: '🎯',
      });
    }

    // Perfect Score Achievement
    if (quizData.percentage === 100) {
      achievements.push({
        userId,
        type: `perfect_${quizData.topicId}`,
        title: 'Perfect Score',
        description: `Score 100% in a quiz`,
        icon: '⭐',
      });
    }

    // Speed Demon Achievement
    if (quizData.timeSpent < 120 && quizData.totalQuestions >= 10) {
      achievements.push({
        userId,
        type: 'speed_demon',
        title: 'Speed Demon',
        description: 'Complete a 10-question quiz in under 2 minutes',
        icon: '⚡',
      });
    }

    // Quiz Master Achievement (10 quizzes)
    if (userQuizzes.length === 10) {
      achievements.push({
        userId,
        type: 'quiz_master_10',
        title: 'Quiz Enthusiast',
        description: 'Complete 10 quizzes',
        icon: '🏆',
      });
    }

    // Subject Master Achievement
    const subjectQuizzes = await this.prisma.quizAttempt.findMany({
      where: { 
        userId,
        topic: {
          subject: {
            name: quizData.subjectName,
          },
        },
      },
    });

    if (subjectQuizzes.length === 5) {
      achievements.push({
        userId,
        type: `subject_master_${quizData.subjectName}`,
        title: `${quizData.subjectName} Explorer`,
        description: `Complete 5 quizzes in ${quizData.subjectName}`,
        icon: '📚',
      });
    }

    // High Scorer Achievement
    const avgScore = userQuizzes.reduce((acc, q) => acc + q.percentage, 0) / userQuizzes.length;
    if (avgScore >= 90 && userQuizzes.length >= 5) {
      achievements.push({
        userId,
        type: 'high_scorer',
        title: 'High Scorer',
        description: 'Maintain 90%+ average over 5 quizzes',
        icon: '🌟',
      });
    }

    // Save achievements
    for (const achievement of achievements) {
      try {
        await this.prisma.achievement.upsert({
          where: {
            userId_type: {
              userId: achievement.userId,
              type: achievement.type,
            },
          },
          update: {},
          create: achievement,
        });
      } catch (error) {
        console.error('Error creating achievement:', error);
      }
    }

    return achievements;
  }

  // Get user achievements
  async getUserAchievements(userId: string) {
    return await this.prisma.achievement.findMany({
      where: { userId },
      orderBy: { unlockedAt: 'desc' },
    });
  }
}
