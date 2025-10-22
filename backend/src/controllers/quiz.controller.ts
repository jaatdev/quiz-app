import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import { QuizService } from '../services/quiz.service';
import { resolveAbsoluteFromUrl } from '../utils/uploads';

const prisma = new PrismaClient();

export class QuizController {
  // GET /api/subjects
  async getSubjects(req: Request, res: Response) {
    try {
      const language = (req.query.language as string) || 'en';
      const subjects = await QuizService.getSubjectsWithTopics(language as any);
      res.json(subjects);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      res.status(500).json({ error: 'Failed to fetch subjects' });
    }
  }

  // GET /api/topics/:topicId
  async getTopic(req: Request, res: Response) {
    try {
      const { topicId } = req.params;
      const language = (req.query.language as string) || 'en';
      const topic = await QuizService.getTopicById(topicId, language as any);

      if (!topic) {
        return res.status(404).json({ error: 'Topic not found' });
      }

      res.json(topic);
    } catch (error) {
      console.error('Error fetching topic:', error);
      res.status(500).json({ error: 'Failed to fetch topic' });
    }
  }

  async getSubjectByName(req: Request, res: Response) {
    try {
      const raw = req.params.name || '';
      const name = decodeURIComponent(raw);
      const language = (req.query.language as string) || 'en';

      if (!name.trim()) {
        return res.status(400).json({ error: 'Subject name is required' });
      }

      const subject = await QuizService.getSubjectByName(name, language as any);
      if (!subject) {
        return res.status(404).json({ error: 'Subject not found' });
      }

      res.json(subject);
    } catch (error) {
      console.error('Error fetching subject by name:', error);
      res.status(500).json({ error: 'Failed to fetch subject' });
    }
  }

  async downloadNotes(req: Request, res: Response) {
    try {
      const { topicId } = req.params;
      const clerkUserId = (req.headers['x-clerk-user-id'] ?? '') as string;
      const language = (req.query.language as string) || 'en';

      if (!clerkUserId.trim()) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      const topic = await QuizService.getTopicById(topicId, language as any);

      if (!topic || !topic.notesUrl) {
        return res.status(404).json({ error: 'Notes not found for this topic' });
      }

      const absolutePath = resolveAbsoluteFromUrl(topic.notesUrl);
      if (!fs.existsSync(absolutePath)) {
        return res.status(404).json({ error: 'Notes file not found' });
      }

      const baseName = topic.name || 'notes';
      const sanitizedName =
        baseName
          .replace(/[\r\n\t]/g, ' ')
          .replace(/[^a-zA-Z0-9._-]+/g, '_')
          .replace(/_{2,}/g, '_')
          .replace(/^_+|_+$/g, '') || 'notes';
      const filename = `${sanitizedName}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Cache-Control', 'private, no-store');
      res.setHeader('X-Content-Type-Options', 'nosniff');

      const stream = fs.createReadStream(absolutePath);
      stream.on('error', (error) => {
        console.error('Error streaming notes file:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to stream notes file' });
        } else {
          res.end();
        }
      });

      stream.pipe(res);
    } catch (error) {
      console.error('Error downloading notes:', error);
      res.status(500).json({ error: 'Failed to download notes' });
    }
  }

  // GET /api/quiz/session/:topicId
  async startQuizSession(req: Request, res: Response) {
    try {
      const { topicId } = req.params;
      const language = (req.query.language as string) || 'en';

      const countParam = req.query.count;
      let questionCount = 10;
      if (typeof countParam === 'string') {
        const parsed = parseInt(countParam, 10);
        if (!Number.isNaN(parsed) && parsed > 0) {
          questionCount = parsed;
        }
      }

      const session = await QuizService.getQuizSession(topicId, 'medium', language as any);

      if (session.questions.length === 0) {
        return res.status(404).json({ error: 'No questions found for this topic' });
      }

      res.json(session);
    } catch (error) {
      if (error instanceof Error && error.message === 'Topic not found') {
        return res.status(404).json({ error: 'Topic not found' });
      }
      console.error('Error starting quiz session:', error);
      res.status(500).json({ error: 'Failed to start quiz session' });
    }
  }

  // GET /api/quiz/subtopics (public metadata endpoint)
  async getSubTopicsByIds(req: Request, res: Response) {
    try {
      const raw = String(req.query.ids || '');
      const ids = raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const language = (req.query.language as string) || 'en';
      if (!ids.length) return res.json([]);
      const subs = await QuizService.getSubTopicsByIds(ids, language as any);
      res.json(subs);
    } catch (e) {
      console.error('getSubTopicsByIds error:', e);
      res.status(500).json({ error: 'Failed to fetch sub-topics' });
    }
  }

  // GET /api/quiz/session (with subTopicIds support)
  async startCustomQuizSession(req: Request, res: Response) {
    try {
      const subTopicIds = String(req.query.subTopicIds || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const count = parseInt(String(req.query.count || '10'));
      const language = (req.query.language as string) || 'en';

      if (subTopicIds.length) {
        const session = await QuizService.getQuizBySubTopics(
          subTopicIds,
          isNaN(count) ? 10 : count,
          language as any
        );
        if (session.questions.length === 0) {
          return res.status(404).json({ error: 'No questions for these sub-topics' });
        }
        return res.json(session);
      }

      return res.status(400).json({ error: 'Provide subTopicIds' });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to start quiz' });
    }
  }

  // POST /api/quiz/submit
  async submitQuiz(req: Request, res: Response) {
    try {
      const submission = req.body;
      const clerkUserId = (req.headers['x-clerk-user-id'] ?? '') as string;
      const language = (req.query.language as string) || 'en';

      // Validate submission
      if (!submission.topicId || !submission.answers || !Array.isArray(submission.answers)) {
        return res.status(400).json({ error: 'Invalid submission format' });
      }

      if (!clerkUserId.trim()) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const result = await QuizService.submitQuiz(
        clerkUserId,
        submission.topicId,
        submission.answers.reduce((acc: any, ans: any) => {
          acc[ans.questionId] = ans.answerId;
          return acc;
        }, {}),
        submission.timeSpent || 0,
        language as any
      );
      res.json(result);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      res.status(500).json({ error: 'Failed to submit quiz' });
    }
  }

  // POST /api/quiz/review
  async getReviewQuestions(req: Request, res: Response) {
    try {
      const { questionIds } = req.body;
      const language = (req.query.language as string) || 'en';

      if (!Array.isArray(questionIds) || questionIds.length === 0) {
        return res.status(400).json({ error: 'Invalid question IDs' });
      }

      const questions = await QuizService.getQuestionsForReview(questionIds, language as any);
      res.json(questions);
    } catch (error) {
      console.error('Error fetching review questions:', error);
      res.status(500).json({ error: 'Failed to fetch review questions' });
    }
  }
}
