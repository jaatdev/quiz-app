import { api } from '@/lib/api';
import type {
  Subject,
  Topic,
  QuizSession,
  QuizSubmission,
  QuizResult,
  QuestionWithAnswer,
} from '@/types';

export const quizService = {
  // Fetch all subjects with topics
  async getSubjects(): Promise<Subject[]> {
    return api.get('/subjects');
  },

  // Get single topic details
  async getTopic(topicId: string): Promise<Topic> {
    return api.get(`/topics/${topicId}`);
  },

  // Start a quiz session
  async startQuizSession(
    topicId: string,
    options?: {
      questionCount?: number | 'all';
      durationMinutes?: number;
      topicIds?: string[];
    }
  ): Promise<QuizSession> {
    const params: Record<string, string> = {};

    const requestedCount = options?.questionCount;
    if (requestedCount === 'all') {
      params.count = 'all';
    } else if (typeof requestedCount === 'number' && Number.isFinite(requestedCount)) {
      params.count = String(Math.max(1, Math.floor(requestedCount)));
    }

    if (options?.durationMinutes && options.durationMinutes > 0) {
      params.durationMinutes = String(options.durationMinutes);
    }

    if (options?.topicIds && options.topicIds.length > 0) {
      params.topicIds = Array.from(new Set(options.topicIds)).join(',');
    }

    return api.get(`/quiz/session/${topicId}`, {
      params,
    });
  },

  // Submit quiz answers
  async submitQuiz(submission: QuizSubmission): Promise<QuizResult> {
    return api.post('/quiz/submit', submission);
  },

  // Get questions for review
  async getReviewQuestions(questionIds: string[]): Promise<QuestionWithAnswer[]> {
    return api.post('/quiz/review', { questionIds });
  },
};
