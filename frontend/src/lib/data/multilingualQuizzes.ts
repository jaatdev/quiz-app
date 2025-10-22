export type LanguageCode = 'en' | 'hi' | 'es' | 'fr';

export interface MultilingualContent<T = string> {
  en: T;
  hi: T;
  es: T;
  fr: T;
}

export interface MultilingualQuestion {
  id: string;
  questionId: string;
  question: MultilingualContent<string>;
  options: MultilingualContent<string[]>;
  correctAnswer: number;
  explanation?: MultilingualContent<string>;
  difficulty: 'easy' | 'medium' | 'hard';
  tags?: string[];
  points?: number;
}

export interface MultilingualQuiz {
  id?: string;
  quizId: string;
  title: MultilingualContent<string>;
  description: MultilingualContent<string>;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  availableLanguages: LanguageCode[];
  defaultLanguage: LanguageCode;
  timeLimit: number; // in seconds
  questions: MultilingualQuestion[];
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
}

// Sample multilingual quiz data
export const sampleMultilingualQuizzes: MultilingualQuiz[] = [
  {
    quizId: 'sample_quiz_1',
    title: {
      en: 'General Knowledge Quiz',
      hi: 'सामान्य ज्ञान क्विज़',
      es: 'Cuestionario de Conocimiento General',
      fr: 'Quiz de Culture Générale'
    },
    description: {
      en: 'Test your general knowledge across various topics',
      hi: 'विभिन्न विषयों पर अपना सामान्य ज्ञान जांचें',
      es: 'Pon a prueba tus conocimientos generales en varios temas',
      fr: 'Testez vos connaissances générales sur divers sujets'
    },
    category: 'General Knowledge',
    difficulty: 'medium',
    availableLanguages: ['en', 'hi', 'es', 'fr'],
    defaultLanguage: 'en',
    timeLimit: 600,
    questions: [],
    tags: ['general', 'knowledge']
  }
];