import { Router, Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { requireAdmin } from '../middleware/admin';

const router = Router();
const prisma = new PrismaClient();

class ImportValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImportValidationError';
  }
}

// All routes here require admin access
router.use(requireAdmin);

// Dashboard stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      totalQuizzes,
      totalQuestions,
      totalSubjects,
      totalTopics,
      recentUsers,
      recentQuizzes
    ] = await Promise.all([
      prisma.user.count(),
      prisma.quizAttempt.count(),
      prisma.question.count(),
      prisma.subject.count(),
      prisma.topic.count(),
      prisma.user.findMany({ 
        take: 5, 
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, createdAt: true }
      }),
      prisma.quizAttempt.findMany({ 
        take: 5, 
        orderBy: { completedAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          topic: { include: { subject: true } }
        }
      })
    ]);

    res.json({
      totalUsers,
      totalQuizzes,
      totalQuestions,
      totalSubjects,
      totalTopics,
      recentUsers,
      recentQuizzes
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Subject Management
router.get('/subjects', async (req: Request, res: Response) => {
  try {
    const subjects = await prisma.subject.findMany({
      include: {
        topics: {
          include: {
            _count: { select: { questions: true } }
          }
        }
      }
    });
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

router.post('/subjects', async (req: Request, res: Response) => {
  try {
    const rawName = req.body?.name ?? '';
    const name = typeof rawName === 'string' ? rawName.trim() : '';

    if (!name) {
      return res.status(400).json({ error: 'Subject name is required' });
    }

    const subject = await prisma.subject.create({
      data: { name }
    });
    res.json(subject);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ error: 'Subject already exists' });
    }
    console.error('Error creating subject:', error);
    res.status(500).json({ error: 'Failed to create subject' });
  }
});

router.put('/subjects/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const subject = await prisma.subject.update({
      where: { id },
      data: { name }
    });
    res.json(subject);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update subject' });
  }
});

router.delete('/subjects/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.subject.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete subject' });
  }
});

// Topic Management
router.get('/topics', async (req: Request, res: Response) => {
  try {
    const topics = await prisma.topic.findMany({
      include: {
        subject: true,
        _count: { select: { questions: true } }
      }
    });
    res.json(topics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch topics' });
  }
});

router.post('/topics', async (req: Request, res: Response) => {
  try {
    const { name, subjectId } = req.body;
    const topic = await prisma.topic.create({
      data: { name, subjectId },
      include: { subject: true }
    });
    res.json(topic);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create topic' });
  }
});

router.put('/topics/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, subjectId } = req.body;
    const topic = await prisma.topic.update({
      where: { id },
      data: { name, subjectId },
      include: { subject: true }
    });
    res.json(topic);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update topic' });
  }
});

router.delete('/topics/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.topic.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete topic' });
  }
});

// Question Management
router.get('/questions', async (req: Request, res: Response) => {
  try {
    const { topicId } = req.query;
    const where = topicId ? { topicId: topicId as string } : {};
    
    const questions = await prisma.question.findMany({
      where,
      include: {
        topic: { include: { subject: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

router.post('/questions', async (req: Request, res: Response) => {
  try {
    const { text, options, correctAnswerId, explanation, difficulty, topicId } = req.body;
    
    const question = await prisma.question.create({
      data: {
        text,
        options,
        correctAnswerId,
        explanation,
        difficulty: difficulty || 'medium',
        topicId
      },
      include: {
        topic: { include: { subject: true } }
      }
    });
    res.json(question);
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({ error: 'Failed to create question' });
  }
});

router.put('/questions/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { text, options, correctAnswerId, explanation, difficulty, topicId } = req.body;
    
    const question = await prisma.question.update({
      where: { id },
      data: {
        text,
        options,
        correctAnswerId,
        explanation,
        difficulty,
        topicId
      },
      include: {
        topic: { include: { subject: true } }
      }
    });
    res.json(question);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update question' });
  }
});

router.delete('/questions/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.question.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

// Bulk Import Questions
router.post('/questions/bulk', async (req: Request, res: Response) => {
  try {
    const { questions } = req.body ?? {};

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'questions must be a non-empty array' });
    }

    const allowedDifficulties = new Set(['easy', 'medium', 'hard']);
    const defaultOptionIds = ['a', 'b', 'c', 'd'];

    const normalizeDifficulty = (value: unknown) => {
      const difficulty = String(value ?? 'medium').toLowerCase();
      return allowedDifficulties.has(difficulty) ? difficulty : 'medium';
    };

  const normalizeOptions = (question: any): Array<{ id: string; text: string }> => {
      if (Array.isArray(question?.options) && question.options.length) {
        return question.options
          .map((option: any, index: number) => ({
            id: typeof option?.id === 'string' && option.id.trim() ? option.id.trim().toLowerCase() : defaultOptionIds[index] ?? `option${index + 1}`,
            text: typeof option?.text === 'string' ? option.text.trim() : ''
          }))
          .filter((option: { id: string; text: string }) => option.text.length > 0);
      }

      const fallbackOptions = defaultOptionIds
        .map((id) => ({
          id,
          text: String(question?.[`option${id.toUpperCase()}`] ?? '').trim()
        }))
        .filter((option) => option.text.length > 0);

      return fallbackOptions;
    };

    const resolveTopicId = async (tx: Prisma.TransactionClient, question: any): Promise<string | null> => {
      const rawTopicId = typeof question?.topicId === 'string' ? question.topicId.trim() : '';
      if (rawTopicId) {
        const existingTopic = await tx.topic.findUnique({ where: { id: rawTopicId } });
        if (existingTopic) {
          return existingTopic.id;
        }
      }

      const subjectName = typeof question?.subjectName === 'string' ? question.subjectName.trim() : '';
      const topicName = typeof question?.topicName === 'string' ? question.topicName.trim() : '';

      if (subjectName && topicName) {
        const subject = await tx.subject.upsert({
          where: { name: subjectName },
          update: {},
          create: { name: subjectName }
        });

        const topic = await tx.topic.upsert({
          where: { subjectId_name: { subjectId: subject.id, name: topicName } },
          update: {},
          create: { name: topicName, subjectId: subject.id }
        });

        return topic.id;
      }

      if (topicName) {
        const defaultSubject = await tx.subject.upsert({
          where: { name: 'General' },
          update: {},
          create: { name: 'General' }
        });

        const topic = await tx.topic.upsert({
          where: { subjectId_name: { subjectId: defaultSubject.id, name: topicName } },
          update: {},
          create: { name: topicName, subjectId: defaultSubject.id }
        });

        return topic.id;
      }

      if (rawTopicId) {
        const subject = await tx.subject.upsert({
          where: { name: 'General Knowledge' },
          update: {},
          create: { name: 'General Knowledge' }
        });

        const topic = await tx.topic.upsert({
          where: { subjectId_name: { subjectId: subject.id, name: rawTopicId } },
          update: {},
          create: { name: rawTopicId, subjectId: subject.id }
        });

        return topic.id;
      }

      return null;
    };

    let createdCount = 0;

    await prisma.$transaction(async (tx) => {
      for (const question of questions) {
        const textSource = typeof question?.text === 'string' ? question.text : question?.question;
        const text = typeof textSource === 'string' ? textSource.trim() : '';
        if (!text) {
          throw new ImportValidationError('Each question must include text');
        }

  const options: Array<{ id: string; text: string }> = normalizeOptions(question);
        if (!options.length) {
          throw new ImportValidationError(`Question "${text.slice(0, 50)}" must include at least one option with text`);
        }

        const suppliedAnswer = String(question?.correctAnswerId ?? question?.correctAnswer ?? '').trim().toLowerCase();
        if (!suppliedAnswer) {
          throw new ImportValidationError(`Question "${text.slice(0, 50)}" is missing correctAnswerId`);
        }

        if (!options.some((option) => option.id === suppliedAnswer)) {
          throw new ImportValidationError(`Question "${text.slice(0, 50)}" has a correctAnswerId that does not match any option`);
        }

        const topicId = await resolveTopicId(tx, question);
        if (!topicId) {
          throw new ImportValidationError(`Question "${text.slice(0, 50)}" could not resolve a topic. Provide topicId or subjectName + topicName.`);
        }

        const explanation = typeof question?.explanation === 'string' ? question.explanation.trim() : null;
        const difficulty = normalizeDifficulty(question?.difficulty);

        await tx.question.create({
          data: {
            text,
            options,
            correctAnswerId: suppliedAnswer,
            explanation,
            difficulty,
            topicId
          }
        });

        createdCount += 1;
      }
    });

    return res.json({
      success: true,
      created: createdCount,
      message: `Successfully imported ${createdCount} questions`
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    if (error instanceof ImportValidationError) {
      return res.status(400).json({ error: error.message });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to import questions' });
  }
});

// User Management
router.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: { quizAttempts: true, achievements: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.put('/users/:id/role', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

export default router;
