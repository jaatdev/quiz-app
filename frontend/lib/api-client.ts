import { api } from './api';
import type {
  Subject,
  Topic,
  QuizSession,
  QuizSubmission,
  QuizResult,
  QuestionWithAnswer,
} from '@/types';

export const apiClient = {
  getSubjects(): Promise<Subject[]> {
    return api.get('/subjects');
  },

  getSubjectByName(name: string): Promise<Subject> {
    const encoded = encodeURIComponent(name);
    return api.get(`/subjects/by-name/${encoded}`);
  },

  getTopic(topicId: string): Promise<Topic> {
    return api.get(`/topics/${topicId}`);
  },

  startQuizSession(
    topicId: string,
    options?: {
      questionCount?: number | 'all';
      durationMinutes?: number;
      topicIds?: string[];
    }
  ): Promise<QuizSession> {
    const params: Record<string, string> = {};
    const requestedCount = options?.questionCount;
    if (requestedCount === 'all') params.count = 'all';
    else if (typeof requestedCount === 'number' && Number.isFinite(requestedCount)) params.count = String(Math.max(1, Math.floor(requestedCount)));
    if (options?.durationMinutes && options.durationMinutes > 0) params.durationMinutes = String(options.durationMinutes);
    if (options?.topicIds && options.topicIds.length > 0) params.topicIds = Array.from(new Set(options.topicIds)).join(',');
    return api.get(`/quiz/session/${topicId}`, { params });
  },

  submitQuiz(submission: QuizSubmission): Promise<QuizResult> {
    return api.post('/quiz/submit', submission);
  },

  getReviewQuestions(questionIds: string[]): Promise<QuestionWithAnswer[]> {
    return api.post('/quiz/review', { questionIds });
  },

  getSubTopicsMeta(ids: string[]) {
    return api.get('/subtopics', { params: { ids: ids.join(',') } });
  },

  startQuizSessionBySubTopics(subTopicIds: string[], questionCount = 10): Promise<QuizSession> {
    return api.get('/quiz/session', {
      params: { subTopicIds: subTopicIds.join(','), count: String(questionCount) },
    });
  },
};

export default apiClient;
