import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Question, QuizSubmission, Answer } from '@/types';

interface QuizSession {
  topicId: string;
  topicName: string;
  subjectName: string;
  questions: Question[];
  startTime: number;
  duration: number;
}

interface QuizState {
  // Session data
  currentSession: QuizSession | null;
  currentQuestionIndex: number;
  answers: Map<string, string>;
  flaggedQuestions: Set<number>;
  
  // Quiz results
  lastResult: {
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: Answer[];
    percentage: number;
    timeSpent: number;
  } | null;

  // Actions
  startSession: (session: QuizSession) => void;
  answerQuestion: (questionId: string, optionId: string) => void;
  toggleFlagQuestion: (index: number) => void;
  goToQuestion: (index: number) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  saveResult: (result: any) => void;
  clearSession: () => void;
  
  // Computed values
  getProgress: () => { answered: number; total: number; percentage: number };
  isQuestionAnswered: (questionId: string) => boolean;
  isQuestionFlagged: (index: number) => boolean;
  canNavigateNext: () => boolean;
  canNavigatePrevious: () => boolean;
}

export const useQuizStore = create<QuizState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentSession: null,
      currentQuestionIndex: 0,
      answers: new Map(),
      flaggedQuestions: new Set(),
      lastResult: null,

      // Start a new quiz session
      startSession: (session) => {
        set({
          currentSession: session,
          currentQuestionIndex: 0,
          answers: new Map(),
          flaggedQuestions: new Set(),
        });
      },

      // Answer a question
      answerQuestion: (questionId, optionId) => {
        set((state) => {
          const newAnswers = new Map(state.answers);
          newAnswers.set(questionId, optionId);
          return { answers: newAnswers };
        });
      },

      // Toggle flag on a question
      toggleFlagQuestion: (index) => {
        set((state) => {
          const newFlags = new Set(state.flaggedQuestions);
          if (newFlags.has(index)) {
            newFlags.delete(index);
          } else {
            newFlags.add(index);
          }
          return { flaggedQuestions: newFlags };
        });
      },

      // Navigate to specific question
      goToQuestion: (index) => {
        const { currentSession } = get();
        if (currentSession && index >= 0 && index < currentSession.questions.length) {
          set({ currentQuestionIndex: index });
        }
      },

      // Go to next question
      nextQuestion: () => {
        const { currentQuestionIndex, currentSession } = get();
        if (currentSession && currentQuestionIndex < currentSession.questions.length - 1) {
          set({ currentQuestionIndex: currentQuestionIndex + 1 });
        }
      },

      // Go to previous question
      previousQuestion: () => {
        const { currentQuestionIndex } = get();
        if (currentQuestionIndex > 0) {
          set({ currentQuestionIndex: currentQuestionIndex - 1 });
        }
      },

      // Save quiz result
      saveResult: (result) => {
        set({ lastResult: result });
      },

      // Clear session
      clearSession: () => {
        set({
          currentSession: null,
          currentQuestionIndex: 0,
          answers: new Map(),
          flaggedQuestions: new Set(),
        });
      },

      // Computed: Get progress
      getProgress: () => {
        const { currentSession, answers } = get();
        if (!currentSession) return { answered: 0, total: 0, percentage: 0 };
        
        const answered = answers.size;
        const total = currentSession.questions.length;
        const percentage = total > 0 ? (answered / total) * 100 : 0;
        
        return { answered, total, percentage };
      },

      // Check if question is answered
      isQuestionAnswered: (questionId) => {
        return get().answers.has(questionId);
      },

      // Check if question is flagged
      isQuestionFlagged: (index) => {
        return get().flaggedQuestions.has(index);
      },

      // Check if can navigate next
      canNavigateNext: () => {
        const { currentQuestionIndex, currentSession } = get();
        return currentSession ? currentQuestionIndex < currentSession.questions.length - 1 : false;
      },

      // Check if can navigate previous
      canNavigatePrevious: () => {
        return get().currentQuestionIndex > 0;
      },
    }),
    {
      name: 'quiz-session',
      // Custom serialization for Map and Set
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const { state } = JSON.parse(str);
          return {
            state: {
              ...state,
              answers: new Map(state.answers),
              flaggedQuestions: new Set(state.flaggedQuestions),
            },
          };
        },
        setItem: (name, value) => {
          const { state } = value as any;
          const serialized = {
            state: {
              ...state,
              answers: Array.from(state.answers.entries()),
              flaggedQuestions: Array.from(state.flaggedQuestions),
            },
          };
          localStorage.setItem(name, JSON.stringify(serialized));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);