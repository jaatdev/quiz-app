import { PrismaClient } from '@prisma/client';

export class LeaderboardService {
  constructor(private prisma: PrismaClient) {}

  // Get global leaderboard
  async getGlobalLeaderboard(period: 'weekly' | 'monthly' | 'allTime' = 'allTime') {
    let dateFilter = {};
    const now = new Date();
    
    if (period === 'weekly') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = { completedAt: { gte: weekAgo } };
    } else if (period === 'monthly') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFilter = { completedAt: { gte: monthAgo } };
    }

    // Get aggregated user scores
    const userScores = await this.prisma.quizAttempt.groupBy({
      by: ['userId'],
      where: dateFilter,
      _count: {
        id: true,
      },
      _avg: {
        percentage: true,
        score: true,
      },
      _sum: {
        score: true,
        correctAnswers: true,
      },
    });

    // Get user details
    const userIds = userScores.map(score => score.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
    });

    // Combine and sort
    const leaderboard = userScores.map(score => {
      const user = users.find(u => u.id === score.userId);
      return {
        userId: score.userId,
        userName: user?.name || 'Anonymous',
        userEmail: user?.email,
        userAvatar: user?.avatar,
        totalQuizzes: score._count.id,
        averageScore: score._avg.percentage || 0,
        totalPoints: score._sum.score || 0,
        totalCorrect: score._sum.correctAnswers || 0,
      };
    }).sort((a, b) => b.totalPoints - a.totalPoints);

    // Add rank
    return leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }

  // Get subject-specific leaderboard
  async getSubjectLeaderboard(subjectName: string, period: 'weekly' | 'monthly' | 'allTime' = 'allTime') {
    let dateFilter = {};
    const now = new Date();
    
    if (period === 'weekly') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = { completedAt: { gte: weekAgo } };
    } else if (period === 'monthly') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFilter = { completedAt: { gte: monthAgo } };
    }

    // Get subject
    const subject = await this.prisma.subject.findUnique({
      where: { name: subjectName },
      include: { topics: true },
    });

    if (!subject) {
      return [];
    }

    const topicIds = subject.topics.map(t => t.id);

    // Get scores for this subject
    const userScores = await this.prisma.quizAttempt.groupBy({
      by: ['userId'],
      where: {
        topicId: { in: topicIds },
        ...dateFilter,
      },
      _count: {
        id: true,
      },
      _avg: {
        percentage: true,
      },
      _sum: {
        score: true,
        correctAnswers: true,
      },
    });

    // Get user details
    const userIds = userScores.map(score => score.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
    });

    // Combine and sort
    const leaderboard = userScores.map(score => {
      const user = users.find(u => u.id === score.userId);
      return {
        userId: score.userId,
        userName: user?.name || 'Anonymous',
        userEmail: user?.email,
        userAvatar: user?.avatar,
        subject: subjectName,
        totalQuizzes: score._count.id,
        averageScore: score._avg.percentage || 0,
        totalPoints: score._sum.score || 0,
        totalCorrect: score._sum.correctAnswers || 0,
      };
    }).sort((a, b) => b.totalPoints - a.totalPoints);

    // Add rank
    return leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }

  // Get user's rank
  async getUserRank(userId: string) {
    const leaderboard = await this.getGlobalLeaderboard('allTime');
    const userEntry = leaderboard.find(entry => entry.userId === userId);
    return userEntry || null;
  }
}
