import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '../middleware/admin';

const router = Router();
const prisma = new PrismaClient();

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
    const { name } = req.body;
    const subject = await prisma.subject.create({
      data: { name }
    });
    res.json(subject);
  } catch (error) {
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
    const { questions } = req.body;
    
    if (!Array.isArray(questions)) {
      return res.status(400).json({ error: 'Questions must be an array' });
    }

    const created = await prisma.question.createMany({
      data: questions,
      skipDuplicates: true
    });

    res.json({ 
      success: true, 
      created: created.count,
      message: `Successfully imported ${created.count} questions` 
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({ error: 'Failed to import questions' });
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
