import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '../../middleware/admin';
import multer from 'multer';
import Papa from 'papaparse';

const router = express.Router();
const prisma = new PrismaClient();

// Multer setup for file uploads (in-memory)
const upload = multer({ storage: multer.memoryStorage() });

// Apply authentication middleware
router.use(requireAdmin);

/**
 * GET /api/admin/translations/questions
 * Get all questions with their translations
 */
router.get('/questions', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      topicId,
      hasHindiTranslation
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (search) {
      where.OR = [
        { text: { path: ['en'], string_contains: search as string } },
        { text: { path: ['hi'], string_contains: search as string } }
      ];
    }

    if (topicId) {
      where.topicId = topicId;
    }

    const questions = await prisma.question.findMany({
      where,
      skip,
      take: Number(limit),
      include: {
        topic: {
          include: {
            subject: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const total = await prisma.question.count({ where });

    // Filter by translation status if requested
    let filteredQuestions = questions;
    if (hasHindiTranslation === 'true') {
      filteredQuestions = questions.filter(q => {
        const text = q.text as any;
        const options = q.options as any;
        return text.hi && text.hi.trim() !== '' &&
               options.hi && Array.isArray(options.hi) && options.hi.length > 0;
      });
    } else if (hasHindiTranslation === 'false') {
      filteredQuestions = questions.filter(q => {
        const text = q.text as any;
        return !text.hi || text.hi.trim() === '';
      });
    }

    const formattedQuestions = filteredQuestions.map(q => ({
      id: q.id,
      text: {
        en: (q.text as any).en || '',
        hi: (q.text as any).hi || ''
      },
      options: {
        en: (q.options as any).en || [],
        hi: (q.options as any).hi || []
      },
      explanation: q.explanation ? {
        en: (q.explanation as any).en || '',
        hi: (q.explanation as any).hi || ''
      } : null,
      correctAnswerId: q.correctAnswerId,
      difficulty: q.difficulty,
      topic: {
        id: q.topic.id,
        name: {
          en: (q.topic.name as any).en || '',
          hi: (q.topic.name as any).hi || ''
        },
        subject: {
          id: q.topic.subject.id,
          name: {
            en: (q.topic.subject.name as any).en || '',
            hi: (q.topic.subject.name as any).hi || ''
          }
        }
      },
      hasHindiTranslation: !!(q.text as any).hi && (q.text as any).hi.trim() !== ''
    }));

    res.json({
      success: true,
      data: {
        questions: formattedQuestions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch questions'
    });
  }
});

/**
 * GET /api/admin/translations/questions/:id
 * Get a single question with translations
 */
router.get('/questions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        topic: {
          include: {
            subject: true
          }
        }
      }
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: question.id,
        text: question.text,
        options: question.options,
        explanation: question.explanation,
        correctAnswerId: question.correctAnswerId,
        difficulty: question.difficulty,
        topic: question.topic
      }
    });
  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch question'
    });
  }
});

/**
 * PUT /api/admin/translations/questions/:id
 * Update question translation
 */
router.put('/questions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { text, options, explanation } = req.body;

    // Validate input
    if (!text || !text.en || !text.hi) {
      return res.status(400).json({
        success: false,
        error: 'Both English and Hindi text are required'
      });
    }

    if (!options || !options.en || !options.hi) {
      return res.status(400).json({
        success: false,
        error: 'Both English and Hindi options are required'
      });
    }

    // Update question
    const updatedQuestion = await prisma.question.update({
      where: { id },
      data: {
        text,
        options,
        explanation: explanation || null
      }
    });

    res.json({
      success: true,
      data: updatedQuestion
    });
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update question'
    });
  }
});

/**
 * GET /api/admin/translations/subjects
 * Get all subjects with translations
 */
router.get('/subjects', async (req, res) => {
  try {
    const subjects = await prisma.subject.findMany({
      include: {
        _count: {
          select: { topics: true }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    const formattedSubjects = subjects.map(s => ({
      id: s.id,
      name: s.name,
      description: s.description,
      slug: s.slug,
      topicCount: s._count.topics,
      hasHindiTranslation: !!(s.name as any).hi && (s.name as any).hi.trim() !== ''
    }));

    res.json({
      success: true,
      data: formattedSubjects
    });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subjects'
    });
  }
});

/**
 * PUT /api/admin/translations/subjects/:id
 * Update subject translation
 */
router.put('/subjects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name || !name.en || !name.hi) {
      return res.status(400).json({
        success: false,
        error: 'Both English and Hindi names are required'
      });
    }

    const updatedSubject = await prisma.subject.update({
      where: { id },
      data: {
        name,
        description: description || null
      }
    });

    res.json({
      success: true,
      data: updatedSubject
    });
  } catch (error) {
    console.error('Error updating subject:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update subject'
    });
  }
});

/**
 * GET /api/admin/translations/topics
 * Get all topics with translations
 */
router.get('/topics', async (req, res) => {
  try {
    const { subjectId } = req.query;

    const where: any = {};
    if (subjectId) {
      where.subjectId = subjectId;
    }

    const topics = await prisma.topic.findMany({
      where,
      include: {
        subject: true,
        _count: {
          select: { questions: true }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    const formattedTopics = topics.map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      slug: t.slug,
      subject: {
        id: t.subject.id,
        name: t.subject.name
      },
      questionCount: t._count.questions,
      hasHindiTranslation: !!(t.name as any).hi && (t.name as any).hi.trim() !== ''
    }));

    res.json({
      success: true,
      data: formattedTopics
    });
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch topics'
    });
  }
});

/**
 * PUT /api/admin/translations/topics/:id
 * Update topic translation
 */
router.put('/topics/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name || !name.en || !name.hi) {
      return res.status(400).json({
        success: false,
        error: 'Both English and Hindi names are required'
      });
    }

    const updatedTopic = await prisma.topic.update({
      where: { id },
      data: {
        name,
        description: description || null
      }
    });

    res.json({
      success: true,
      data: updatedTopic
    });
  } catch (error) {
    console.error('Error updating topic:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update topic'
    });
  }
});

/**
 * GET /api/admin/translations/stats
 * Get translation statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const [totalQuestions, totalSubjects, totalTopics] = await Promise.all([
      prisma.question.count(),
      prisma.subject.count(),
      prisma.topic.count()
    ]);

    // Count translated questions
    const questions = await prisma.question.findMany({
      select: { text: true, options: true }
    });

    const translatedQuestions = questions.filter(q => {
      const text = q.text as any;
      const options = q.options as any;
      return text.hi && text.hi.trim() !== '' &&
             options.hi && Array.isArray(options.hi) && options.hi.length > 0;
    }).length;

    // Count translated subjects
    const subjects = await prisma.subject.findMany({
      select: { name: true }
    });

    const translatedSubjects = subjects.filter(s => {
      const name = s.name as any;
      return name.hi && name.hi.trim() !== '';
    }).length;

    // Count translated topics
    const topics = await prisma.topic.findMany({
      select: { name: true }
    });

    const translatedTopics = topics.filter(t => {
      const name = t.name as any;
      return name.hi && name.hi.trim() !== '';
    }).length;

    res.json({
      success: true,
      data: {
        questions: {
          total: totalQuestions,
          translated: translatedQuestions,
          untranslated: totalQuestions - translatedQuestions,
          percentage: totalQuestions > 0
            ? Math.round((translatedQuestions / totalQuestions) * 100)
            : 0
        },
        subjects: {
          total: totalSubjects,
          translated: translatedSubjects,
          untranslated: totalSubjects - translatedSubjects,
          percentage: totalSubjects > 0
            ? Math.round((translatedSubjects / totalSubjects) * 100)
            : 0
        },
        topics: {
          total: totalTopics,
          translated: translatedTopics,
          untranslated: totalTopics - translatedTopics,
          percentage: totalTopics > 0
            ? Math.round((translatedTopics / totalTopics) * 100)
            : 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching translation stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch translation statistics'
    });
  }
});

/**
 * POST /api/admin/translations/auto-translate
 * Auto-translate using Google Translate API (optional)
 */
/**
 * POST /api/admin/translations/import
 * Bulk import translations via uploaded CSV or JSON file.
 * CSV expected columns (flexible):
 *  - type: 'question'|'subject'|'topic'
 *  - id: resource id
 *  - field: 'name'|'description'|'text'|'options'|'explanation'
 *  - lang: 'en'|'hi'
 *  - value: the translated text (for options use JSON array string)
 *
 * Or JSON array of objects with same keys.
 */
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded (use "file" field)' });
    }

    const text = req.file.buffer.toString('utf8').trim();
    let rows: any[] = [];

    // Try JSON first
    if (text.startsWith('[') || text.startsWith('{')) {
      try {
        const parsed = JSON.parse(text);
        rows = Array.isArray(parsed) ? parsed : [parsed];
      } catch (err) {
        // fall through to CSV parse
      }
    }

    // If not JSON, parse as CSV
    if (rows.length === 0) {
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
      if (parsed.errors && parsed.errors.length) {
        console.warn('CSV parse errors:', parsed.errors);
      }
      rows = parsed.data as any[];
    }

    if (!rows.length) {
      return res.status(400).json({ success: false, error: 'No rows found in uploaded file' });
    }

    const results: any[] = [];

    // Process rows sequentially (could be batched)
    for (const r of rows) {
      const type = (r.type || r.resource || '').toString().trim().toLowerCase();
      const id = (r.id || r.resourceId || '').toString().trim();
      const field = (r.field || '').toString().trim();
      const lang = (r.lang || 'hi').toString().trim();
      let value: any = r.value ?? r.text ?? r.name ?? '';

      if (!type || !id || !field) {
        results.push({ row: r, success: false, error: 'Missing type, id, or field' });
        continue;
      }

      // Normalize options/explanation/text which may be JSON
      if ((field === 'options' || field === 'text') && typeof value === 'string') {
        try {
          const maybe = JSON.parse(value);
          if (Array.isArray(maybe)) value = maybe;
        } catch (err) {
          // keep as string
        }
      }

      try {
        if (type === 'subject') {
          const existing = await prisma.subject.findUnique({ where: { id } });
          if (!existing) {
            results.push({ row: r, success: false, error: 'Subject not found' });
            continue;
          }

          const data: any = {};
          if (field === 'name') {
            const name = (existing.name as any) ? { ...(existing.name as any) } : { en: '', hi: '' };
            name[lang] = value;
            data.name = name;
          } else if (field === 'description') {
            const description = (existing.description as any) ? { ...(existing.description as any) } : { en: '', hi: '' };
            description[lang] = value;
            data.description = description;
          }

          await prisma.subject.update({ where: { id }, data });
          results.push({ row: r, success: true });
        } else if (type === 'topic') {
          const existing = await prisma.topic.findUnique({ where: { id } });
          if (!existing) {
            results.push({ row: r, success: false, error: 'Topic not found' });
            continue;
          }

          const data: any = {};
          if (field === 'name') {
            const name = (existing.name as any) ? { ...(existing.name as any) } : { en: '', hi: '' };
            name[lang] = value;
            data.name = name;
          } else if (field === 'description') {
            const description = (existing.description as any) ? { ...(existing.description as any) } : { en: '', hi: '' };
            description[lang] = value;
            data.description = description;
          }

          await prisma.topic.update({ where: { id }, data });
          results.push({ row: r, success: true });
        } else if (type === 'question') {
          const existing = await prisma.question.findUnique({ where: { id } });
          if (!existing) {
            results.push({ row: r, success: false, error: 'Question not found' });
            continue;
          }

          const data: any = {};
          if (field === 'text') {
            const textObj = (existing.text as any) ? { ...(existing.text as any) } : { en: '', hi: '' };
            textObj[lang] = value;
            data.text = textObj;
          } else if (field === 'explanation') {
            const expObj = (existing.explanation as any) ? { ...(existing.explanation as any) } : { en: '', hi: '' };
            expObj[lang] = value;
            data.explanation = expObj;
          } else if (field === 'options') {
            const opts = (existing.options as any) ? { ...(existing.options as any) } : { en: [], hi: [] };
            opts[lang] = Array.isArray(value) ? value : [value];
            data.options = opts;
          }

          await prisma.question.update({ where: { id }, data });
          results.push({ row: r, success: true });
        } else {
          results.push({ row: r, success: false, error: 'Unknown type' });
        }
      } catch (err) {
        console.error('Error processing row', r, err);
        results.push({ row: r, success: false, error: String(err) });
      }
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error('Error importing translations:', error);
    res.status(500).json({ success: false, error: 'Failed to import translations' });
  }
});

router.post('/auto-translate', async (req, res) => {
  try {
    const { questionId } = req.body;

    if (!process.env.GOOGLE_TRANSLATE_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Google Translate API key not configured'
      });
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId }
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }

    // Auto-translate logic here (requires Google Translate API)
    // This is a placeholder - implement based on your needs

    res.json({
      success: true,
      message: 'Auto-translation feature coming soon'
    });
  } catch (error) {
    console.error('Error auto-translating:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to auto-translate'
    });
  }
});

export default router;
