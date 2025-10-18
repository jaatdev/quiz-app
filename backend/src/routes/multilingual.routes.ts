import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { normalizeQuiz } from '../utils/quizNormalizer';

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
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ success: false, error: 'Authentication failed' });
  }
};

/**
 * GET /api/quizzes/multilingual
 * Get all multilingual quizzes with advanced filters
 * Query params: search, difficulty, languages, tags, dateFrom, dateTo, minScore, maxScore, limit, offset
 */
router.get('/quizzes/multilingual', async (req: Request, res: Response) => {
  try {
    const {
      search,
      difficulty,
      languages,
      tags,
      dateFrom,
      dateTo,
      minScore,
      maxScore,
      limit = 10,
      offset = 0
    } = req.query;

    // Build where clause for filters
    const where: any = {};

    // Search filter (across all languages)
    if (search) {
      where.OR = [
        { title: { hasSome: [search as string] } },
        { description: { hasSome: [search as string] } },
        { category: { contains: search as string, mode: 'insensitive' } },
        { tags: { hasSome: [search as string] } }
      ];
    }

    // Difficulty filter (single or multiple)
    if (difficulty) {
      const diffArray = Array.isArray(difficulty) ? difficulty : [difficulty];
      where.difficulty = { in: diffArray };
    }

    // Language availability filter
    if (languages) {
      const langArray = Array.isArray(languages) ? languages : [languages];
      where.availableLanguages = { hasSome: langArray };
    }

    // Tags filter
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      where.tags = { hasSome: tagArray };
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom as string);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo as string);
      }
    }

    // Get quizzes with count
    const [quizzes, total] = await Promise.all([
      prisma.multilingualQuiz.findMany({
        where,
        include: {
          questions: {
            select: {
              id: true,
              sequenceNumber: true,
              points: true
            }
          },
          attempts: {
            select: {
              percentage: true
            }
          }
        },
        take: parseInt(limit as string, 10),
        skip: parseInt(offset as string, 10),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.multilingualQuiz.count({ where })
    ]);

    // Calculate average scores and apply score range filter
    const filteredQuizzes = quizzes
      .map((quiz) => {
        const avgScore =
          quiz.attempts.length > 0
            ? (quiz.attempts as any[]).reduce((sum, a) => sum + (a.percentage || 0), 0) / quiz.attempts.length
            : 0;

        return {
          ...quiz,
          averageScore: Math.round(avgScore)
        };
      })
      .filter((quiz) => {
        const min = minScore ? parseInt(minScore as string, 10) : 0;
        const max = maxScore ? parseInt(maxScore as string, 10) : 100;
        return quiz.averageScore >= min && quiz.averageScore <= max;
      });

    res.json({
      success: true,
      data: filteredQuizzes,
      pagination: {
        total,
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
        hasMore: parseInt(offset as string, 10) + parseInt(limit as string, 10) < total
      }
    });
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch quizzes' });
  }
});

/**
 * GET /api/quizzes/multilingual/:quizId
 * Get a specific multilingual quiz with all questions
 */
router.get('/quizzes/multilingual/:quizId', async (req: Request, res: Response) => {
  try {
    const { quizId } = req.params;

    const quiz = await prisma.multilingualQuiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          orderBy: { sequenceNumber: 'asc' }
        }
      }
    });

    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }

    res.json({ success: true, data: quiz });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch quiz' });
  }
});

/**
 * POST /api/quizzes/multilingual
 * Create a new multilingual quiz (admin only)
 */
router.post('/quizzes/multilingual', authenticateUser, async (req: Request, res: Response) => {
  try {
    let payload = req.body ?? {};
    // If old format (array) provided, wrap
    if (Array.isArray(payload)) payload = { title: { en: 'Imported Quiz' }, description: { en: '' }, questions: payload };

    const normalized = normalizeQuiz(payload as any);
    const { title, description, category, difficulty, timeLimit, questions, availableLanguages } = normalized;

    // Validate required fields
    if (!title || !description || !category || !difficulty || !timeLimit) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, description, category, difficulty, timeLimit'
      });
    }

    if (!questions || questions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one question is required'
      });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: (req as any).userId }
    });

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only admins can create quizzes' });
    }

    // Create quiz with normalized questions
    const quiz = await prisma.multilingualQuiz.create({
      data: {
        title: title as any,
        description: description as any,
        category,
        difficulty,
        timeLimit,
        availableLanguages,
        defaultLanguage: normalized.defaultLanguage,
        createdBy: (req as any).userId,
        questions: {
          create: (questions || []).map((q: any, index: number) => ({
            sequenceNumber: index + 1,
            question: q.question as any,
            options: q.options as any,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation as any,
            points: q.points || 10,
            category: q.category
          }))
        }
      },
      include: {
        questions: true
      }
    });

    res.status(201).json({
      success: true,
      data: quiz,
      message: 'Quiz created successfully'
    });
  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(500).json({ success: false, error: 'Failed to create quiz' });
  }
});

/**
 * PUT /api/quizzes/multilingual/:quizId
 * Update a multilingual quiz (admin only)
 */
router.put('/quizzes/multilingual/:quizId', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { quizId } = req.params;
    let payload = req.body ?? {};
    // Merge existing with incoming and normalize
    const existing = await prisma.multilingualQuiz.findUnique({ where: { id: quizId }, include: { questions: true } });
    if (!existing) return res.status(404).json({ success: false, error: 'Quiz not found' });

    const merged = { ...existing, ...payload, questions: payload.questions ?? existing.questions };
    const normalized = normalizeQuiz(merged as any);
    const { title, description, category, difficulty, timeLimit, questions } = normalized;

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: (req as any).userId }
    });

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only admins can update quizzes' });
    }

    // Update quiz metadata
    const quiz = await prisma.multilingualQuiz.update({
      where: { id: quizId },
      data: {
        title: title as any,
        description: description as any,
        category,
        difficulty,
        timeLimit,
        availableLanguages: normalized.availableLanguages,
        defaultLanguage: normalized.defaultLanguage
      },
      include: { questions: true }
    });

    // Update questions if provided
    if (questions && questions.length > 0) {
      // Delete existing questions
      await prisma.multilingualQuestion.deleteMany({
        where: { quizId }
      });

      // Create new questions
      await prisma.multilingualQuestion.createMany({
        data: questions.map((q: any, index: number) => ({
          quizId,
          sequenceNumber: index + 1,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          points: q.points || 10,
          category: q.category
        }))
      });
    }

    res.json({
      success: true,
      data: quiz,
      message: 'Quiz updated successfully'
    });
  } catch (error) {
    console.error('Error updating quiz:', error);
    res.status(500).json({ success: false, error: 'Failed to update quiz' });
  }
});

/**
 * POST /api/quizzes/multilingual/:quizId/convert
 * Convert stored quiz between multilingual and single-language modes
 */
router.post('/quizzes/multilingual/:quizId/convert', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { quizId } = req.params;
    const { to = 'multi', lang = 'en' } = req.body;

    const quiz = await prisma.multilingualQuiz.findUnique({ where: { id: quizId }, include: { questions: true } });
    if (!quiz) return res.status(404).json({ success: false, error: 'Quiz not found' });

    if (to === 'single') {
      // Set availableLanguages to single and leave content (frontend can render single language)
      const updated = await prisma.multilingualQuiz.update({ where: { id: quizId }, data: { availableLanguages: [lang], defaultLanguage: lang } });
      return res.json({ success: true, data: updated });
    }

    if (to === 'multi') {
      // Ensure questions have both en/hi: duplicate missing values
      for (const q of quiz.questions) {
        const question = q.question as any;
        const options = q.options as any;
        const explanation = q.explanation as any;
        const newQuestion = { en: question?.en || question?.hi || '', hi: question?.hi || question?.en || '' };
        const newOptions = {
          en: (options?.en && options.en.length ? options.en : (options?.hi || []) ),
          hi: (options?.hi && options.hi.length ? options.hi : (options?.en || []) ),
        };
        const newExplanation = { en: explanation?.en || explanation?.hi || '', hi: explanation?.hi || explanation?.en || '' };

        await prisma.multilingualQuestion.update({ where: { id: q.id }, data: { question: newQuestion, options: newOptions, explanation: newExplanation } });
      }

      const updated = await prisma.multilingualQuiz.update({ where: { id: quizId }, data: { availableLanguages: ['en', 'hi'], defaultLanguage: 'en' } });
      return res.json({ success: true, data: updated });
    }

    return res.status(400).json({ success: false, error: 'Invalid conversion target' });
  } catch (e) {
    console.error('Conversion error:', e);
    return res.status(500).json({ success: false, error: 'Conversion failed' });
  }
});

/**
 * DELETE /api/quizzes/multilingual/:quizId
 * Delete a multilingual quiz (admin only)
 */
router.delete('/quizzes/multilingual/:quizId', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { quizId } = req.params;

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: (req as any).userId }
    });

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only admins can delete quizzes' });
    }

    await prisma.multilingualQuiz.delete({
      where: { id: quizId }
    });

    res.json({
      success: true,
      message: 'Quiz deleted successfully'
    });
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }
    console.error('Error deleting quiz:', error);
    res.status(500).json({ success: false, error: 'Failed to delete quiz' });
  }
});

/**
 * POST /api/quizzes/multilingual/:quizId/attempt
 * Submit a multilingual quiz attempt
 */
router.post(
  '/quizzes/multilingual/:quizId/attempt',
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const { quizId } = req.params;
      const { languageCode, userAnswers, timeSpent } = req.body;

      if (!languageCode || !userAnswers || timeSpent === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: languageCode, userAnswers, timeSpent'
        });
      }

      // Get quiz with questions
      const quiz = await prisma.multilingualQuiz.findUnique({
        where: { id: quizId },
        include: {
          questions: true
        }
      });

      if (!quiz) {
        return res.status(404).json({ success: false, error: 'Quiz not found' });
      }

      // Calculate score
      let correctAnswers = 0;
      let totalScore = 0;

      quiz.questions.forEach((question: any) => {
        const userAnswer = userAnswers[question.id];
        if (userAnswer === question.correctAnswer) {
          correctAnswers++;
          totalScore += question.points;
        }
      });

      const percentage = Math.round((correctAnswers / quiz.questions.length) * 100);

      // Create attempt record
      const attempt = await prisma.multilingualQuizAttempt.create({
        data: {
          userId: (req as any).userId,
          quizId,
          languageCode,
          score: totalScore,
          totalQuestions: quiz.questions.length,
          correctAnswers,
          percentage,
          timeSpent,
          userAnswers
        }
      });

      res.status(201).json({
        success: true,
        data: {
          attemptId: attempt.id,
          score: totalScore,
          correctAnswers,
          totalQuestions: quiz.questions.length,
          percentage,
          timeSpent
        },
        message: 'Quiz attempt submitted successfully'
      });
    } catch (error) {
      console.error('Error submitting quiz attempt:', error);
      res.status(500).json({ success: false, error: 'Failed to submit quiz attempt' });
    }
  }
);

/**
 * GET /api/quizzes/multilingual/:quizId/attempts
 * Get user's attempts for a specific quiz
 */
router.get(
  '/quizzes/multilingual/:quizId/attempts',
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const { quizId } = req.params;
      const { limit = 10, offset = 0 } = req.query;

      const attempts = await prisma.multilingualQuizAttempt.findMany({
        where: {
          userId: (req as any).userId,
          quizId
        },
        orderBy: { completedAt: 'desc' },
        take: parseInt(limit as string, 10),
        skip: parseInt(offset as string, 10)
      });

      const total = await prisma.multilingualQuizAttempt.count({
        where: {
          userId: (req as any).userId,
          quizId
        }
      });

      res.json({
        success: true,
        data: attempts,
        pagination: {
          total,
          limit: parseInt(limit as string, 10),
          offset: parseInt(offset as string, 10)
        }
      });
    } catch (error) {
      console.error('Error fetching attempts:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch attempts' });
    }
  }
);

/**
 * GET /api/user/multilingual-stats
 * Get user's multilingual quiz statistics
 */
router.get('/user/multilingual-stats', authenticateUser, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const stats = await prisma.multilingualQuizAttempt.groupBy({
      by: ['languageCode'],
      where: { userId },
      _count: true,
      _avg: {
        percentage: true,
        timeSpent: true,
        score: true
      }
    });

    const totalAttempts = await prisma.multilingualQuizAttempt.count({
      where: { userId }
    });

    const averagePercentage =
      stats.length > 0 ? stats.reduce((sum: number, s: any) => sum + (s._avg.percentage || 0), 0) / stats.length : 0;

    res.json({
      success: true,
      data: {
        totalAttempts,
        averagePercentage: Math.round(averagePercentage),
        byLanguage: stats.map((s: any) => ({
          language: s.languageCode,
          attempts: s._count,
          averagePercentage: Math.round(s._avg.percentage || 0),
          averageTime: Math.round(s._avg.timeSpent || 0),
          totalScore: Math.round(s._avg.score || 0)
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch statistics' });
  }
});

/**
 * GET /api/user/quiz-recommendations
 * Get personalized quiz recommendations based on user profile
 * Query params: language, limit (default 5), offset
 */
router.get('/user/quiz-recommendations', authenticateUser, async (req: any, res: Response) => {
  try {
    const language = (req.query.language || 'en') as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 5, 20);
    const offset = parseInt(req.query.offset as string) || 0;

    // Get user's quiz attempts to understand preferences
    const attempts = await prisma.multilingualQuizAttempt.findMany({
      where: { userId: req.userId },
      orderBy: { completedAt: 'desc' },
      take: 20
    });

    // Get quizzes user hasn't attempted yet
    const attemptedQuizIds = attempts.map((a) => a.quizId);

    const quizzes = await prisma.multilingualQuiz.findMany({
      where: {
        id: {
          notIn: attemptedQuizIds.length > 0 ? attemptedQuizIds : undefined
        }
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' }
    });

    // Calculate match scores based on user history
    const recommendations = quizzes.map((quiz: any) => {
      let matchScore = 50;

      // Language match
      const availableLangs = quiz.availableLanguages || [];
      if (availableLangs.includes(language)) {
        matchScore += 15;
      }

      // Difficulty progression
      const userAverage =
        attempts.length > 0
          ? (attempts as any[]).reduce((sum, a) => sum + (a.percentage || 0), 0) / attempts.length
          : 65;

      if (userAverage < 60) {
        if (quiz.difficulty === 'easy') matchScore += 20;
        if (quiz.difficulty === 'medium') matchScore += 10;
      } else if (userAverage < 80) {
        if (quiz.difficulty === 'medium') matchScore += 20;
        if (quiz.difficulty === 'hard') matchScore += 10;
      } else {
        if (quiz.difficulty === 'hard') matchScore += 20;
      }

      // Category interest (if they've done similar categories before)
      const categoryAttempts = attempts.filter(
        (a: any) =>
          a.quiz?.category === quiz.category
      );
      if (categoryAttempts.length > 0) {
        matchScore += 15;
      }

      return {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        category: quiz.category,
        difficulty: quiz.difficulty,
        timeLimit: quiz.timeLimit,
        availableLanguages: quiz.availableLanguages,
        matchScore: Math.min(100, matchScore),
        reason:
          matchScore > 80
            ? 'Highly recommended'
            : matchScore > 60
              ? 'Good match for you'
              : 'New quiz to explore'
      };
    });

    res.json({
      success: true,
      data: recommendations,
      pagination: { limit, offset, hasMore: recommendations.length === limit }
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch recommendations' });
  }
});

export default router;
