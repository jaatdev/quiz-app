import { Router, Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import multer, { FileFilterCallback } from 'multer';
import fs from 'fs';
import { requireAdmin } from '../middleware/admin';
import { PRIMARY_ADMIN_EMAIL, isPrimaryAdmin } from '../config/admin.config';
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
            _count: { select: { questions: true, subTopics: true } }
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
            _count: { select: { questions: true, subTopics: true } },
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
            _count: { select: { questions: true, subTopics: true } }
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
        include: { _count: { select: { questions: true, subTopics: true } } }
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
    const { text, options, correctAnswerId, explanation, difficulty, topicId, subTopicId, pyq } = req.body;

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
        subTopicId: subTopicId || null,
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
    const { text, options, correctAnswerId, explanation, difficulty, topicId, subTopicId, pyq } = req.body;

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
        subTopicId: subTopicId !== undefined ? (subTopicId || null) : undefined,
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

    // Helper: get preferred language code array
    const preferredLangs = ['en', 'hi'];

    // Helper: pick a string from multilingual or plain string
    const pickLangString = (value: unknown): string => {
      if (typeof value === 'string') return value.trim();
      if (value && typeof value === 'object') {
        const obj = value as Record<string, unknown>;
        for (const lang of preferredLangs) {
          const v = obj[lang];
          if (typeof v === 'string' && v.trim()) return v.trim();
        }
        // fall back to first string value
        for (const k of Object.keys(obj)) {
          const v = obj[k];
          if (typeof v === 'string' && v.trim()) return v.trim();
        }
      }
      return '';
    };

    // Helper: map 0..3 to a..d
    const indexToOptionId = (idx: number): string => defaultOptionIds[idx] ?? String(idx);

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

      // NEW FORMAT: options as multilingual object { en: [..], hi: [..] }
      if (question?.options && typeof question.options === 'object') {
        const obj = question.options as Record<string, unknown>;
        // choose a language array
        let list: unknown = undefined;
        for (const lang of preferredLangs) {
          if (Array.isArray((obj as any)[lang])) { list = (obj as any)[lang]; break; }
        }
        if (!list) {
          // pick first array in object
          for (const k of Object.keys(obj)) {
            if (Array.isArray((obj as any)[k])) { list = (obj as any)[k]; break; }
          }
        }
        if (Array.isArray(list)) {
          return (list as unknown[])
            .map((text, index) => ({
              id: defaultOptionIds[index] ?? `option${index + 1}`,
              text: typeof text === 'string' ? text.trim() : String(text ?? '').trim(),
            }))
            .filter((o) => o.text.length > 0);
        }
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
      let defaultSubTopicIdResolved: string | null = null;

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

        // Handle default subTopic for override mode
        const defaultSubTopicId = req.body?.defaultSubTopicId;
        const defaultSubTopicName = req.body?.defaultSubTopicName;

        if (defaultSubTopicId) {
          const st = await tx.subTopic.findUnique({ where: { id: defaultSubTopicId } });
          if (!st) throw new ImportValidationError('defaultSubTopicId not found');
          defaultSubTopicIdResolved = st.id;
        } else if (defaultSubTopicName && String(defaultSubTopicName).trim()) {
          const st = await tx.subTopic.upsert({
            where: { topicId_name: { topicId: overrideTopicId!, name: String(defaultSubTopicName).trim() } },
            update: {},
            create: { name: String(defaultSubTopicName).trim(), topicId: overrideTopicId! }
          });
          defaultSubTopicIdResolved = st.id;
        }
      }

      for (const question of questions) {
        // Accept both old and new (multilingual) formats
        let text = '';
        if (typeof question?.text === 'string') {
          text = question.text.trim();
        } else if (typeof question?.question === 'string') {
          text = question.question.trim();
        } else if (question?.question && typeof question.question === 'object') {
          text = pickLangString(question.question);
        }
        if (!text) {
          throw new ImportValidationError('Each question must include text');
        }

        const options: Array<{ id: string; text: string }> = normalizeOptions(question);
        if (!options.length) {
          throw new ImportValidationError(`Question "${text.slice(0, 50)}" must include at least one option with text`);
        }

        // Accept correctAnswerId (a,b,...) or correctAnswer (0..3 or '0'..'3')
        let suppliedAnswer = '';
        if (typeof question?.correctAnswerId === 'string') {
          suppliedAnswer = question.correctAnswerId.trim().toLowerCase();
        } else if (typeof question?.correctAnswer === 'number') {
          suppliedAnswer = indexToOptionId(question.correctAnswer);
        } else if (typeof question?.correctAnswer === 'string') {
          const trimmed = question.correctAnswer.trim();
          if (/^\d+$/.test(trimmed)) {
            suppliedAnswer = indexToOptionId(parseInt(trimmed, 10));
          } else {
            suppliedAnswer = trimmed.toLowerCase();
          }
        }

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

        // Resolve subTopicId
        let subTopicId: string | null = null;

        if (mode === 'override') {
          subTopicId = defaultSubTopicIdResolved;
        } else {
          // Per-row subtopic resolution
          if (question.subTopicId && typeof question.subTopicId === 'string' && question.subTopicId.length >= 8) {
            const st = await tx.subTopic.findUnique({ where: { id: question.subTopicId } });
            if (st) subTopicId = st.id;
          } else if (question.subTopicName) {
            const st = await tx.subTopic.upsert({
              where: { topicId_name: { topicId: topicId!, name: String(question.subTopicName).trim() } },
              update: {},
              create: { name: String(question.subTopicName).trim(), topicId: topicId! }
            });
            subTopicId = st.id;
          }
        }

        let explanation: string | null = null;
        if (typeof question?.explanation === 'string') {
          explanation = question.explanation.trim();
        } else if (question?.explanation && typeof question.explanation === 'object') {
          const picked = pickLangString(question.explanation);
          explanation = picked ? picked : null;
        }
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
            subTopicId: subTopicId,
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

// Topic metadata
router.get('/topics/:id', async (req: Request, res: Response) => {
  try {
    const topic = await prisma.topic.findUnique({
      where: { id: req.params.id },
      include: { subject: true }
    });
    if (!topic) return res.status(404).json({ error: 'Topic not found' });
    res.json(topic);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch topic' });
  }
});

// SubTopic CRUD routes
router.get('/topics/:id/subtopics', async (req: Request, res: Response) => {
  try {
    const topicId = req.params.id;
    const page = Math.max(1, parseInt(String(req.query.page || '1')));
    const pageSize = Math.max(1, Math.min(100, parseInt(String(req.query.pageSize || '50'))));
    const q = String(req.query.q || '').trim();

    const where: Prisma.SubTopicWhereInput = { topicId };
    if (q) {
      where.name = { contains: q, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      prisma.subTopic.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: 'asc' },
        include: { _count: { select: { questions: true } } }
      }),
      prisma.subTopic.count({ where })
    ]);

    res.json({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize))
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch sub-topics' });
  }
});

router.post('/subtopics', async (req: Request, res: Response) => {
  try {
    const name = String(req.body?.name || '').trim();
    const topicId = String(req.body?.topicId || '').trim();
    if (!name || !topicId) {
      return res.status(400).json({ error: 'name and topicId are required' });
    }
    const sub = await prisma.subTopic.create({ data: { name, topicId } });
    res.json(sub);
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return res.status(409).json({ error: 'Sub-topic already exists in this topic' });
    }
    res.status(500).json({ error: 'Failed to create sub-topic' });
  }
});

router.put('/subtopics/:id', async (req: Request, res: Response) => {
  try {
    const name = String(req.body?.name || '').trim();
    if (!name) return res.status(400).json({ error: 'name required' });
    const sub = await prisma.subTopic.update({
      where: { id: req.params.id },
      data: { name }
    });
    res.json(sub);
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return res.status(409).json({ error: 'Duplicate sub-topic in this topic' });
    }
    res.status(500).json({ error: 'Failed to update sub-topic' });
  }
});

router.delete('/subtopics/:id', async (req: Request, res: Response) => {
  try {
    await prisma.subTopic.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete sub-topic' });
  }
});

router.post('/topics/:id/subtopics/bulk', async (req: Request, res: Response) => {
  try {
    const topicId = req.params.id;
    let { names } = req.body as { names: string[] };
    if (!Array.isArray(names) || names.length === 0) {
      return res.status(400).json({ error: 'names must be a non-empty array' });
    }
    names = Array.from(new Set(names.map(s => String(s || '').trim()).filter(Boolean)));
    const existing = await prisma.subTopic.findMany({
      where: { topicId, name: { in: names } },
      select: { name: true }
    });
    const exists = new Set(existing.map(e => e.name));
    const toCreate = names.filter(n => !exists.has(n));
    if (toCreate.length) {
      await prisma.subTopic.createMany({
        data: toCreate.map(n => ({ name: n, topicId })),
        skipDuplicates: true
      });
    }
    res.json({
      success: true,
      created: toCreate.length,
      duplicates: names.filter(n => exists.has(n))
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to bulk create sub-topics' });
  }
});

// Bulk subjects by names
router.post('/subjects/bulk', async (req: Request, res: Response) => {
  try {
    let { names } = req.body as { names: string[] };
    if (!Array.isArray(names) || !names.length) {
      return res.status(400).json({ error: 'names must be a non-empty array' });
    }
    names = Array.from(new Set(names.map(n => String(n || '').trim()).filter(Boolean)));
    const existing = await prisma.subject.findMany({
      where: { name: { in: names } },
      select: { name: true }
    });
    const exists = new Set(existing.map(s => s.name));
    const toCreate = names.filter(n => !exists.has(n));
    if (toCreate.length) {
      await prisma.subject.createMany({
        data: toCreate.map(n => ({ name: n })),
        skipDuplicates: true
      });
    }
    res.json({
      success: true,
      created: toCreate.length,
      duplicates: names.filter(n => exists.has(n))
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to bulk create subjects' });
  }
});

// Bulk topics by subjectName + topicName
router.post('/topics/bulk', async (req: Request, res: Response) => {
  try {
    let { rows } = req.body as { rows: Array<{ subjectName: string; topicName: string }> };
    if (!Array.isArray(rows) || !rows.length) {
      return res.status(400).json({ error: 'rows must be non-empty' });
    }

    // Normalize & unique pairs
    const pairs = Array.from(
      new Set(rows.map(r => `${String(r.subjectName || '').trim()}::${String(r.topicName || '').trim()}`))
    ).map(p => {
      const [s, t] = p.split('::');
      return { subjectName: s, topicName: t };
    }).filter(r => r.subjectName && r.topicName);

    let created = 0;
    const duplicates: string[] = [];

    await prisma.$transaction(async (tx) => {
      for (const r of pairs) {
        const subj = await tx.subject.upsert({
          where: { name: r.subjectName },
          update: {},
          create: { name: r.subjectName }
        });
        try {
          await tx.topic.create({ data: { name: r.topicName, subjectId: subj.id } });
          created++;
        } catch (e: any) {
          if (e?.code === 'P2002') {
            duplicates.push(`${r.subjectName}::${r.topicName}`);
          } else {
            throw e;
          }
        }
      }
    });

    res.json({ success: true, created, duplicates });
  } catch (e) {
    res.status(500).json({ error: 'Failed to bulk create topics' });
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

    // Fetch the user to check their email
    const targetUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 🛡️ PROTECTION: Prevent revoking PRIMARY_ADMIN status
    if (isPrimaryAdmin(targetUser.email) && role !== 'admin') {
      return res.status(403).json({
        error: 'Cannot revoke admin status from primary admin',
        details: `${PRIMARY_ADMIN_EMAIL} is the permanent primary administrator and cannot be downgraded`,
        code: 'PRIMARY_ADMIN_PROTECTED'
      });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role }
    });

    // Log admin role changes for audit trail
    console.log(`[AUDIT] User role updated: ${targetUser.email} → ${role}`);

    res.json(user);
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

export default router;
// ==========================
// Quiz Import
// ==========================
// POST /admin/import-quiz
// Accepts a normalized quiz payload and stores it as questions in the database
router.post('/import-quiz', async (req: Request, res: Response) => {
  try {
    const body = req.body ?? {};
    const { subjectId, topicId, subTopicId, quizJson } = body;

    if (!subjectId || !topicId || !subTopicId) {
      return res.status(400).json({ error: 'Subject, Topic, and Sub-topic are required fields.' });
    }

    // Validate that subject, topic, and subtopic exist
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    const topic = await prisma.topic.findUnique({ where: { id: topicId } });
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const subTopic = await prisma.subTopic.findUnique({ where: { id: subTopicId } });
    if (!subTopic) {
      return res.status(404).json({ error: 'Sub-topic not found' });
    }

    // Validate quiz structure
    if (!quizJson || typeof quizJson !== 'object') {
      return res.status(400).json({ error: 'Invalid quiz data' });
    }

    const { questions, title, description, timeLimit, totalPoints, settings } = quizJson;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Quiz must contain at least one question' });
    }

    // Create questions in a transaction
    const createdQuestions = await prisma.$transaction(async (tx) => {
      const results = [];

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];

        // Validate question structure
        if (!q.question || !Array.isArray(q.options) || q.options.length < 2) {
          throw new Error(`Question ${i + 1}: Invalid question structure`);
        }

        if (typeof q.correctIndex !== 'number' || q.correctIndex < 0 || q.correctIndex >= q.options.length) {
          throw new Error(`Question ${i + 1}: Invalid correct answer index`);
        }

        // Create the question
        const question = await tx.question.create({
          data: {
            text: String(q.question),
            options: q.options.map(opt => ({
              id: typeof opt.id === 'string' ? opt.id : `option_${Date.now()}_${Math.random()}`,
              text: String(opt.text || opt)
            })),
            correctAnswerId: q.options[q.correctIndex]?.id || `option_${Date.now()}_${Math.random()}`,
            explanation: q.explanation ? String(q.explanation) : null,
            difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium',
            topicId,
            subTopicId,
            pyq: q.pyq ? String(q.pyq) : null,
          }
        });

        results.push(question);
      }

      return results;
    });

    // Generate a quiz ID for reference
    const quizId = `quiz_${subjectId}_${topicId}_${subTopicId}_${Date.now()}`;

    console.log(`✅ Successfully imported quiz with ${createdQuestions.length} questions`);

    return res.json({
      success: true,
      quizId,
      questionsCreated: createdQuestions.length,
      subject: subject.name,
      topic: topic.name,
      subTopic: subTopic.name
    });

  } catch (error) {
    console.error('❌ Quiz Import Error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Import failed'
    });
  }
});

// ==========================
// Multilingual Quiz Import
// ==========================
// POST /admin/multilingual/import
// Accepts a flexible multilingual quiz payload and stores it into MultilingualQuiz tables.
// Requirements:
// - Detect at least two languages across title/description/question/options/explanation
// - Normalize answers to zero-based index
// - Preserve timeLimit (minutes) and include total questions in response
router.post('/multilingual/import', async (req: Request, res: Response) => {
  try {
    const body = req.body ?? {};

    // Helper: collect language keys from a multilingual object { en: string | string[], hi: ... }
    const collectLangs = (value: unknown): Set<string> => {
      const langs = new Set<string>();
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
          if (typeof v === 'string') {
            if (v.trim()) langs.add(k);
          } else if (Array.isArray(v)) {
            if ((v as unknown[]).length) langs.add(k);
          } else if (v && typeof v === 'object') {
            // Nested objects aren't expected here, but be permissive
            langs.add(k);
          }
        }
      }
      return langs;
    };

    // Helper: normalize string or multilingual object into object form
    const toMultilangObject = (value: unknown): Record<string, unknown> => {
      if (typeof value === 'string') return { en: value };
      if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
      return { en: '' };
    };

    // Helper: ensure value conforms to Prisma JSON input type
    const toInputJson = (val: unknown) => val as unknown as Prisma.InputJsonValue;

    // Helper: normalize options into { en: string[], hi: string[], ... }
    const normalizeOptions = (value: unknown): Record<string, string[]> => {
      if (Array.isArray(value)) {
        return { en: (value as unknown[]).map((v) => String(v ?? '').trim()).filter(Boolean) };
      }
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const result: Record<string, string[]> = {};
        for (const [lang, arr] of Object.entries(value as Record<string, unknown>)) {
          if (Array.isArray(arr)) {
            result[lang] = arr.map((v) => String(v ?? '').trim()).filter(Boolean);
          }
        }
        return result;
      }
      return { en: [] };
    };

    // Helper: map a|b|c|d or numeric to zero-based index
    const toAnswerIndex = (ans: unknown): number => {
      if (typeof ans === 'number' && Number.isFinite(ans)) return Math.max(0, Math.floor(ans));
      if (typeof ans === 'string') {
        const s = ans.trim().toLowerCase();
        if (/^\d+$/.test(s)) return Math.max(0, parseInt(s, 10));
        const map: Record<string, number> = { a: 0, b: 1, c: 2, d: 3 };
        if (s in map) return map[s];
      }
      return 0; // default to first option if ambiguous
    };

    // Extract quiz-level fields (flexible)
  const title = toMultilangObject(body.title ?? { en: 'Imported Quiz' });
  const description = toMultilangObject(body.description ?? { en: 'Imported multilingual quiz' });
    const category = typeof body.category === 'string' && body.category.trim() ? body.category.trim() : 'General';
    const allowedDifficulties = new Set(['easy', 'medium', 'hard']);
    const difficultyRaw = String(body.difficulty ?? 'medium').toLowerCase();
    const difficulty = allowedDifficulties.has(difficultyRaw) ? difficultyRaw : 'medium';
    const timeLimit = Number.isFinite(body.timeLimit) ? Number(body.timeLimit) : 30; // minutes
    const tags: string[] = Array.isArray(body.tags) ? (body.tags as unknown[]).map((t) => String(t)).slice(0, 30) : [];

    // Questions can be at body.questions or body itself might be an array
    const questionsInput: any[] = Array.isArray(body)
      ? body
      : Array.isArray(body.questions)
        ? body.questions
        : [];

    if (!questionsInput.length) {
      return res.status(400).json({ error: 'questions array is required for multilingual import' });
    }

    // Detect languages across quiz metadata and questions
    const langSet = new Set<string>();
    for (const l of collectLangs(title)) langSet.add(l);
    for (const l of collectLangs(description)) langSet.add(l);

    for (const q of questionsInput) {
      // question: object or text
      const qValue = q?.question ?? q?.text ?? '';
      if (qValue && typeof qValue === 'object' && !Array.isArray(qValue)) {
        for (const l of collectLangs(qValue)) langSet.add(l);
      }
      // options: arrays per language or single array
      if (q?.options) {
        const o = q.options;
        if (o && typeof o === 'object' && !Array.isArray(o)) {
          for (const l of collectLangs(o)) langSet.add(l);
        }
      }
      // explanation
      if (q?.explanation && typeof q.explanation === 'object' && !Array.isArray(q.explanation)) {
        for (const l of collectLangs(q.explanation)) langSet.add(l);
      }
    }

    // If availableLanguages explicitly provided, union it
    if (Array.isArray(body.availableLanguages)) {
      for (const l of body.availableLanguages as string[]) {
        if (typeof l === 'string' && l.trim()) langSet.add(l.trim());
      }
    }

    const availableLanguages = Array.from(langSet);
    if (availableLanguages.length < 2) {
      return res.status(400).json({ error: 'At least two languages must be present to import as multilingual quiz' });
    }

    const defaultLanguage = availableLanguages.includes('en') ? 'en' : availableLanguages[0];

    // Create quiz and questions in a transaction
    const quiz = await prisma.$transaction(async (tx) => {
      const createdQuiz = await tx.multilingualQuiz.create({
        data: {
          title: toInputJson(title),
          description: toInputJson(description),
          category,
          difficulty,
          timeLimit,
          availableLanguages,
          defaultLanguage,
          tags,
          createdBy: (req as any).user?.id || null,
        },
      });

      // Create questions with sequence numbers
      let sequence = 1;
      for (const q of questionsInput) {
        const questionObj = toMultilangObject(q?.question ?? q?.text ?? { en: '' });
        const optionsObj = normalizeOptions(q?.options ?? []);
        const explanationObj = toMultilangObject(q?.explanation ?? { en: '' });
        const correctIndex = toAnswerIndex(q?.correctAnswer ?? q?.correctAnswerId);

        await tx.multilingualQuestion.create({
          data: {
            quizId: createdQuiz.id,
            sequenceNumber: sequence++,
            question: toInputJson(questionObj),
            options: toInputJson(optionsObj),
            correctAnswer: correctIndex,
            explanation: toInputJson(explanationObj),
            points: typeof q?.points === 'number' ? q.points : 10,
            category: typeof q?.category === 'string' ? q.category : null,
          },
        });
      }

      return createdQuiz;
    });

    const totalQuestions = await prisma.multilingualQuestion.count({ where: { quizId: quiz.id } });

    return res.status(201).json({
      success: true,
      data: {
        quizId: quiz.id,
        timeLimit: quiz.timeLimit,
        totalQuestions,
        availableLanguages: quiz.availableLanguages,
        difficulty: quiz.difficulty,
      },
      message: `Imported multilingual quiz with ${totalQuestions} questions (${availableLanguages.join(', ')})`,
    });
  } catch (error) {
    console.error('Multilingual import error:', error);
    return res.status(500).json({ error: 'Failed to import multilingual quiz' });
  }
});
