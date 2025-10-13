import { Router, Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import multer, { FileFilterCallback } from 'multer';
import fs from 'fs';
import { requireAdmin } from '../middleware/admin';
import {
  getNotesDir,
  buildNotesUrl,
  resolveAbsoluteFromUrl,
} from '../utils/uploads';

const router = Router();
const prisma = new PrismaClient();
const notesUploadDir = getNotesDir();

function normalizePyq(input: unknown): string | null {
  if (input === undefined || input === null) {
    return null;
  }

  const raw = String(input).trim();
  if (!raw) {
    return null;
  }

  const prefixed = raw.match(/pyq:\s*\[(.*)\]/i);
  if (prefixed?.[1]) {
    return prefixed[1].trim() || null;
  }

  const bracketed = raw.match(/^\[(.*)\]$/);
  if (bracketed?.[1]) {
    return bracketed[1].trim() || null;
  }

  return raw;
}

const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, notesUploadDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const topicId = req.params.id || 'topic';
    const timestamp = Date.now();
    const sanitizedOriginal = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
    cb(null, `${topicId}-${timestamp}-${sanitizedOriginal}`);
  },
});

const pdfFileFilter: multer.Options['fileFilter'] = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (file.mimetype !== 'application/pdf') {
    return cb(new Error('Only PDF files are allowed'));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter: pdfFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

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
          select: {
            id: true,
            name: true,
            subjectId: true,
            notesUrl: true,
            _count: { select: { questions: true } }
          },
          orderBy: { name: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

router.get('/subjects-with-topics', async (_req: Request, res: Response) => {
  try {
    const subjects = await prisma.subject.findMany({
      orderBy: { name: 'asc' },
      include: {
        topics: {
          orderBy: { name: 'asc' },
          include: {
            _count: { select: { questions: true } },
          },
        },
        _count: { select: { topics: true } },
      },
    });

    res.json(subjects);
  } catch (error) {
    console.error('Failed to fetch subjects with topics:', error);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

router.get('/subjects/:id', async (req: Request, res: Response) => {
  try {
    const subject = await prisma.subject.findUnique({
      where: { id: req.params.id },
      include: {
        topics: {
          include: {
            _count: { select: { questions: true } }
          },
          orderBy: { name: 'asc' }
        },
        _count: { select: { topics: true } },
      }
    });

    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    res.json(subject);
  } catch (error) {
    console.error('Get subject by id error:', error);
    res.status(500).json({ error: 'Failed to fetch subject' });
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
    const rawName = req.body?.name ?? '';
    const name = typeof rawName === 'string' ? rawName.trim() : '';

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const subject = await prisma.subject.update({
      where: { id },
      data: { name }
    });
    res.json(subject);
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ error: 'A subject with that name already exists' });
    }
    console.error('Rename subject error:', error);
    res.status(500).json({ error: 'Failed to rename subject' });
  }
});

router.delete('/subjects/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.$transaction(async (tx) => {
      await tx.quizAttempt.deleteMany({
        where: {
          topic: { subjectId: id }
        }
      });

      await tx.question.deleteMany({
        where: {
          topic: { subjectId: id }
        }
      });

      await tx.topic.deleteMany({ where: { subjectId: id } });
      await tx.subject.delete({ where: { id } });
    });

    res.json({ success: true });
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ error: 'Subject not found' });
    }
    console.error('Failed to delete subject:', error);
    res.status(500).json({ error: 'Failed to delete subject' });
  }
});

// Topic Management
router.get('/subjects/:id/topics', async (req: Request, res: Response) => {
  try {
    const subjectId = req.params.id;
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(String(req.query.pageSize ?? '12'), 10)));
    const search = String(req.query.q ?? '').trim();

    const where: Prisma.TopicWhereInput = { subjectId };
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      prisma.topic.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { name: 'asc' },
        include: { _count: { select: { questions: true } } }
      }),
      prisma.topic.count({ where })
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    res.json({ items, total, page, pageSize, totalPages });
  } catch (error) {
    console.error('Error fetching paginated topics:', error);
    res.status(500).json({ error: 'Failed to fetch topics' });
  }
});

router.post('/subjects/:id/topics/bulk', async (req: Request, res: Response) => {
  try {
    const subjectId = req.params.id;
    let { topics } = req.body as { topics: string[] };

    if (!Array.isArray(topics) || topics.length === 0) {
      return res.status(400).json({ error: 'topics must be a non-empty array of names' });
    }

    topics = topics
      .map((name) => String(name ?? '').trim())
      .filter(Boolean);

    const uniqueInput = Array.from(new Set(topics));

    if (uniqueInput.length === 0) {
      return res.status(400).json({ error: 'No valid topic names provided' });
    }

    if (uniqueInput.length > 1000) {
      return res.status(400).json({ error: 'Please import at most 1000 topics at a time' });
    }

    const existing = await prisma.topic.findMany({
      where: {
        subjectId,
        name: { in: uniqueInput }
      },
      select: { name: true }
    });

    const existingNames = new Set(existing.map((topic) => topic.name));
    const toCreate = uniqueInput.filter((name) => !existingNames.has(name));

    if (toCreate.length > 0) {
      await prisma.topic.createMany({
        data: toCreate.map((name) => ({ name, subjectId })),
        skipDuplicates: true,
      });
    }

    res.json({
      success: true,
      created: toCreate.length,
      duplicates: uniqueInput.filter((name) => existingNames.has(name)),
      message: `Created ${toCreate.length} topics${existingNames.size ? `, ${existingNames.size} duplicates skipped` : ''}`,
    });
  } catch (error) {
    console.error('Bulk topics error:', error);
    res.status(500).json({ error: 'Failed to bulk create topics' });
  }
});

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
    const { name, subjectId, notesUrl } = req.body;
    const trimmedName = typeof name === 'string' ? name.trim() : '';
    const trimmedSubjectId = typeof subjectId === 'string' ? subjectId.trim() : '';

    if (!trimmedName || !trimmedSubjectId) {
      return res.status(400).json({ error: 'name and subjectId are required' });
    }

    const topic = await prisma.topic.create({
      data: {
        name: trimmedName,
        subjectId: trimmedSubjectId,
        notesUrl: typeof notesUrl === 'string' ? notesUrl : undefined,
      },
      include: { subject: true }
    });
    res.json(topic);
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ error: 'Topic with this name already exists in this subject' });
    }
    console.error('Failed to create topic:', error);
    res.status(500).json({ error: 'Failed to create topic' });
  }
});

router.put('/topics/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, subjectId, notesUrl } = req.body;
    const trimmedName = typeof name === 'string' ? name.trim() : '';
    const trimmedSubjectId = typeof subjectId === 'string' ? subjectId.trim() : undefined;

    if (!trimmedName) {
      return res.status(400).json({ error: 'name is required' });
    }

    const topic = await prisma.topic.update({
      where: { id },
      data: {
        name: trimmedName,
        subjectId: trimmedSubjectId,
        notesUrl: typeof notesUrl === 'string' ? notesUrl : undefined,
      },
      include: { subject: true }
    });
    res.json(topic);
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ error: 'A topic with that name already exists in this subject' });
    }
    console.error('Failed to update topic:', error);
    res.status(500).json({ error: 'Failed to update topic' });
  }
});

router.delete('/topics/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.$transaction(async (tx) => {
      const existingTopic = await tx.topic.findUnique({ where: { id } });

      if (existingTopic?.notesUrl) {
        const existingPath = resolveAbsoluteFromUrl(existingTopic.notesUrl);
        fs.promises.unlink(existingPath).catch(() => undefined);
      }

      await tx.quizAttempt.deleteMany({ where: { topicId: id } });
      await tx.question.deleteMany({ where: { topicId: id } });
      await tx.topic.delete({ where: { id } });
    });

    res.json({ success: true });
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ error: 'Topic not found' });
    }
    console.error('Failed to delete topic:', error);
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
    res.json(
      questions.map((question) => ({
        ...question,
        pyq: question.pyq ?? null,
      }))
    );
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

router.post('/questions', async (req: Request, res: Response) => {
  try {
    const { text, options, correctAnswerId, explanation, difficulty, topicId, pyq } = req.body;

    const sanitizedExplanation = typeof explanation === 'string' ? explanation.trim() : null;
    const normalizedDifficulty = typeof difficulty === 'string' && difficulty.trim()
      ? difficulty.trim().toLowerCase()
      : 'medium';
    
    const question = await prisma.question.create({
      data: {
        text,
        options,
        correctAnswerId,
        explanation: sanitizedExplanation && sanitizedExplanation.length > 0 ? sanitizedExplanation : null,
        difficulty: normalizedDifficulty,
        topicId,
        pyq: normalizePyq(pyq),
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
    const { text, options, correctAnswerId, explanation, difficulty, topicId, pyq } = req.body;

    const sanitizedExplanation = typeof explanation === 'string' ? explanation.trim() : null;
    const normalizedDifficulty = typeof difficulty === 'string' && difficulty.trim()
      ? difficulty.trim().toLowerCase()
      : undefined;
    
    const question = await prisma.question.update({
      where: { id },
      data: {
        text,
        options,
        correctAnswerId,
        explanation: sanitizedExplanation !== null && sanitizedExplanation.length === 0 ? null : sanitizedExplanation ?? undefined,
        difficulty: normalizedDifficulty,
        topicId,
        pyq: normalizePyq(pyq),
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

router.post('/topics/:id/notes', upload.single('notes'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'Notes PDF is required' });
    }

    const topic = await prisma.topic.findUnique({ where: { id } });

    if (!topic) {
      await fs.promises.unlink(req.file.path).catch(() => undefined);
      return res.status(404).json({ error: 'Topic not found' });
    }

    if (topic.notesUrl) {
      const existingPath = resolveAbsoluteFromUrl(topic.notesUrl);
      fs.promises.unlink(existingPath).catch(() => undefined);
    }

    const notesUrl = buildNotesUrl(req.file.path);

    const updated = await prisma.topic.update({
      where: { id },
      data: { notesUrl },
      include: { subject: true },
    });

    res.json({ success: true, topic: updated });
  } catch (error: any) {
    console.error('Error uploading notes:', error);
    res.status(500).json({ error: error?.message || 'Failed to upload notes' });
  }
});

router.delete('/topics/:id/notes', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const topic = await prisma.topic.findUnique({ where: { id } });

    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    if (topic.notesUrl) {
      const existingPath = resolveAbsoluteFromUrl(topic.notesUrl);
      await fs.promises.unlink(existingPath).catch(() => undefined);
    }

    const updated = await prisma.topic.update({
      where: { id },
      data: { notesUrl: null },
      include: { subject: true },
    });

    res.json({ success: true, topic: updated });
  } catch (error) {
    console.error('Error removing notes:', error);
    res.status(500).json({ error: 'Failed to remove notes' });
  }
});

// Bulk Import Questions with override/per-row support
router.post('/questions/bulk', async (req: Request, res: Response) => {
  try {
    const {
      questions,
      mode = 'perRow',
      defaultSubjectId,
      defaultTopicId,
      defaultSubjectName,
      defaultTopicName
    } = req.body ?? {};

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

    const resolvePerRowTopicId = async (tx: Prisma.TransactionClient, question: any): Promise<string | null> => {
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
      let overrideTopicId: string | null = null;

      if (mode === 'override') {
        let subjectId: string | null = null;

        if (defaultSubjectId) {
          const subject = await tx.subject.findUnique({ where: { id: defaultSubjectId } });
          if (!subject) {
            throw new ImportValidationError('defaultSubjectId not found');
          }
          subjectId = subject.id;
        } else if (typeof defaultSubjectName === 'string' && defaultSubjectName.trim()) {
          const subject = await tx.subject.upsert({
            where: { name: defaultSubjectName.trim() },
            update: {},
            create: { name: defaultSubjectName.trim() }
          });
          subjectId = subject.id;
        } else {
          throw new ImportValidationError('Provide defaultSubjectId or defaultSubjectName in override mode');
        }

        if (defaultTopicId) {
          const topic = await tx.topic.findUnique({ where: { id: defaultTopicId } });
          if (!topic) {
            throw new ImportValidationError('defaultTopicId not found');
          }
          overrideTopicId = topic.id;
        } else if (typeof defaultTopicName === 'string' && defaultTopicName.trim()) {
          const topic = await tx.topic.upsert({
            where: { subjectId_name: { subjectId: subjectId!, name: defaultTopicName.trim() } },
            update: {},
            create: { subjectId: subjectId!, name: defaultTopicName.trim() }
          });
          overrideTopicId = topic.id;
        } else {
          throw new ImportValidationError('Provide defaultTopicId or defaultTopicName in override mode');
        }
      }

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

        let topicId: string | null = null;

        if (mode === 'override') {
          topicId = overrideTopicId;
        } else {
          topicId = await resolvePerRowTopicId(tx, question);
        }

        if (!topicId) {
          throw new ImportValidationError(`Question "${text.slice(0, 50)}" could not resolve a topic. Provide topicId or subjectName + topicName.`);
        }

        const explanation = typeof question?.explanation === 'string' ? question.explanation.trim() : null;
        const difficulty = normalizeDifficulty(question?.difficulty);
        const pyqLabel = normalizePyq(question?.pyq);

        await tx.question.create({
          data: {
            text,
            options,
            correctAnswerId: suppliedAnswer,
            explanation,
            difficulty,
            topicId: topicId!,
            pyq: pyqLabel,
          }
        });

        createdCount += 1;
      }
    });

    return res.json({
      success: true,
      created: createdCount,
      message: `Imported ${createdCount} questions`
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    if (error instanceof ImportValidationError) {
      return res.status(400).json({ error: error.message });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to import questions' });
  }
});

router.get('/topics/:id/questions', async (req: Request, res: Response) => {
  try {
    const topicId = req.params.id;
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(String(req.query.pageSize ?? '12'), 10)));
    const search = String(req.query.q ?? '').trim();

    const where: Prisma.QuestionWhereInput = { topicId };

    if (search) {
      where.OR = [
        { text: { contains: search, mode: 'insensitive' } },
        { explanation: { contains: search, mode: 'insensitive' } },
        { pyq: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      prisma.question.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          text: true,
          options: true,
          correctAnswerId: true,
          explanation: true,
          difficulty: true,
          pyq: true,
          topicId: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.question.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    res.json({
      items,
      total,
      page,
      pageSize,
      totalPages,
    });
  } catch (error) {
    console.error('Failed to fetch questions for topic:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
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
