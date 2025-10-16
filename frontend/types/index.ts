export interface Subject {
  id: string;
  name: string;
  topics: Topic[];
  createdAt: string;
  updatedAt: string;
}

export interface SubTopic {
  id: string;
  name: string;
  topicId: string;
}

export interface Topic {
  id: string;
  name: string;
  subjectId: string;
  notesUrl?: string | null;
  subTopics?: SubTopic[];
  _count?: {
    questions: number;
  };
}

export interface QuizSession {
  id?: string;
  topicId: string;
  topicName: string;
  subjectName: string;
  notesUrl?: string | null;
  durationSeconds: number;
  questionCount: number;
  includedTopicIds: string[];
  includedTopicNames: string[];
  questions: Question[];
}

export interface Question {
  id: string;
  text: string;
  options: Option[];
  pyq?: string | null;
}

export interface Option {
  id: string;
  text: string;
}

export interface QuizSubmission {
  topicId: string;
  answers: Answer[];
  timeSpent: number;
}

export interface Answer {
  questionId: string;
  selectedOptionId: string;
}

export interface QuizResult {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: any[];
  percentage: number;
}

export interface AchievementUnlock {
  userId: string;
  type: string;
  title: string;
  description: string;
  icon: string;
}

export interface QuestionWithAnswer extends Question {
  correctAnswerId: string;
  explanation?: string;
}

export interface ReviewResponse {
  questions: QuestionWithAnswer[];
}

export interface QuizState {
  currentQuestionIndex: number;
  answers: Map<string, string>;
  timeRemaining: number;
  isCompleted: boolean;
  startTime: number;
}
