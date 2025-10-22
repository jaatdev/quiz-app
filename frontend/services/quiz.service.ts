import apiClient from '@/lib/api-client';
import type {
  Subject,
  Topic,
  QuizSession,
  QuizSubmission,
  QuizResult,
  QuestionWithAnswer,
} from '@/types';

export const quizService = {
  getSubjects(): Promise<Subject[]> {
    return apiClient.getSubjects();
  },

  getSubjectByName(subjectName: string): Promise<Subject> {
    return apiClient.getSubjectByName(subjectName);
  },

  getTopic(topicId: string): Promise<Topic> {
    return apiClient.getTopic(topicId);
  },

  startQuizSession(topicId: string, options?: { questionCount?: number | 'all'; durationMinutes?: number; topicIds?: string[]; }): Promise<QuizSession> {
    return apiClient.startQuizSession(topicId, options);
  },

  submitQuiz(submission: QuizSubmission): Promise<QuizResult> {
    return apiClient.submitQuiz(submission);
  },

  getReviewQuestions(questionIds: string[]): Promise<QuestionWithAnswer[]> {
    return apiClient.getReviewQuestions(questionIds);
  },

  getSubTopicsMeta(ids: string[]) {
    return apiClient.getSubTopicsMeta(ids);
  },

  startQuizSessionBySubTopics(subTopicIds: string[], questionCount = 10): Promise<QuizSession> {
    return apiClient.startQuizSessionBySubTopics(subTopicIds, questionCount);
  },

  createCustomQuizSession(subTopicIds: string[], questionCount = 10): Promise<QuizSession> {
    return this.startQuizSessionBySubTopics(subTopicIds, questionCount);
  },
};
