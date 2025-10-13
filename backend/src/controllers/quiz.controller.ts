import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { QuizService } from '../services/quiz.service';

const prisma = new PrismaClient();
const quizService = new QuizService(prisma);

export class QuizController {
  // GET /api/subjects
  async getSubjects(req: Request, res: Response) {
    try {
      const subjects = await quizService.getSubjectsWithTopics();
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
      const topic = await quizService.getTopicById(topicId);
      
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

      if (!name.trim()) {
        return res.status(400).json({ error: 'Subject name is required' });
      }

      const subject = await quizService.getSubjectByName(name);
      if (!subject) {
        return res.status(404).json({ error: 'Subject not found' });
      }

      res.json(subject);
    } catch (error) {
      console.error('Error fetching subject by name:', error);
      res.status(500).json({ error: 'Failed to fetch subject' });
    }
  }

  // GET /api/quiz/session/:topicId
  async startQuizSession(req: Request, res: Response) {
    try {
      const { topicId } = req.params;

      const countParam = req.query.count;
      let questionCount: number | 'all' = 10;
      if (typeof countParam === 'string') {
        if (countParam.toLowerCase() === 'all') {
          questionCount = 'all';
        } else {
          const parsed = parseInt(countParam, 10);
          if (!Number.isNaN(parsed) && parsed > 0) {
            questionCount = parsed;
          }
        }
      }

      const durationParam = (req.query.durationMinutes ?? req.query.duration) as string | undefined;
      let durationSeconds: number | null = null;
      if (typeof durationParam === 'string' && durationParam.trim().length > 0) {
        const parsed = Number(durationParam);
        if (!Number.isNaN(parsed) && parsed > 0) {
          durationSeconds = Math.round(parsed * 60);
        }
      }

      const topicIdsParam = req.query.topicIds;
      const additionalTopicIds: string[] = [];
      if (typeof topicIdsParam === 'string') {
        additionalTopicIds.push(...topicIdsParam.split(',').map((id: string) => id.trim()).filter(Boolean));
      } else if (Array.isArray(topicIdsParam)) {
        topicIdsParam.forEach((value) => {
          if (typeof value === 'string') {
            additionalTopicIds.push(...value.split(',').map((id: string) => id.trim()).filter(Boolean));
          }
        });
      }

      const session = await quizService.getQuizSession(topicId, {
        questionCount,
        includeTopicIds: additionalTopicIds,
        durationSeconds,
      });
      
      if (session.questions.length === 0) {
        return res.status(404).json({ error: 'No questions found for this topic' });
      }
      
      res.json(session);
    } catch (error) {
      if (error instanceof Error && error.message === 'TOPIC_NOT_FOUND') {
        return res.status(404).json({ error: 'Topic not found' });
      }
      console.error('Error starting quiz session:', error);
      res.status(500).json({ error: 'Failed to start quiz session' });
    }
  }

  // POST /api/quiz/submit
  async submitQuiz(req: Request, res: Response) {
    try {
      const submission = req.body;
      
      // Validate submission
      if (!submission.topicId || !submission.answers || !Array.isArray(submission.answers)) {
        return res.status(400).json({ error: 'Invalid submission format' });
      }
      
      const result = await quizService.submitQuiz(submission);
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
      
      if (!Array.isArray(questionIds) || questionIds.length === 0) {
        return res.status(400).json({ error: 'Invalid question IDs' });
      }
      
      const questions = await quizService.getQuestionsForReview(questionIds);
      res.json(questions);
    } catch (error) {
      console.error('Error fetching review questions:', error);
      res.status(500).json({ error: 'Failed to fetch review questions' });
    }
  }
}
