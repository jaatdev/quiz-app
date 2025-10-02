export interface QuizSession {
  topicId: string;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: Option[];
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
  incorrectAnswers: Answer[];
  percentage: number;
}

export interface QuestionWithAnswer extends QuizQuestion {
  correctAnswerId: string;
  explanation?: string;
}
