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
  async startQuizSession(topicId: string, questionCount: number | 'all' = 10): Promise<QuizSession> {
    const params: Record<string, string | number> = {};

    if (questionCount === 'all') {
      params.count = 'all';
    } else if (typeof questionCount === 'number') {
      params.count = Math.max(1, questionCount);
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
