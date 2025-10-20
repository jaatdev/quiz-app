// frontend/lib/quiz/normalize.ts

export type Lang = 'en' | 'hi';

export type NormalizedQuestion = {
  question: Record<Lang, string>;
  options: Record<Lang, string[]>;
  correctIndex: number;
  explanation: Record<Lang, string>;
  points?: number;
  difficulty?: string;
};

export type NormalizedQuiz = {
  quizId: string;
  subjectId: string;
  topicId: string;
  subTopicId: string;
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  availableLanguages: Lang[];
  defaultLanguage: Lang;
  isMultilingual: boolean;
  questions: NormalizedQuestion[];
  timeLimit?: number;
  totalPoints?: number;
  settings?: {
    instantFeedback?: boolean;
    shuffleQuestions?: boolean;
    shuffleOptions?: boolean;
    showCorrectAnswers?: boolean;
  };
};

// Normalizes any incoming quiz JSON (array or object) into a full NormalizedQuiz
export function normalizeIncomingQuiz(
  quizJson: any,
  subjectId: string,
  topicId: string,
  subTopicId: string
): NormalizedQuiz {
  // If it's an array, wrap it
  const isArray = Array.isArray(quizJson);
  const questions = isArray ? quizJson : quizJson.questions || [];
  const quizId = quizJson.quizId || `quiz_${Date.now()}`;
  const title = quizJson.title || { en: 'Imported Quiz', hi: 'इम्पोर्टेड क्विज़' };
  const description = quizJson.description || { en: 'Imported quiz', hi: 'इम्पोर्टेड क्विज़' };
  const availableLanguages = quizJson.availableLanguages || ['en', 'hi'];
  const defaultLanguage = quizJson.defaultLanguage || 'en';
  const isMultilingual = quizJson.isMultilingual ?? true;
  const timeLimit = quizJson.timeLimit || 30;

  // Normalize questions
  const normalizedQuestions: NormalizedQuestion[] = questions.map((q: any) => ({
    question: q.question || { en: q.text || '', hi: '' },
    options: q.options || { en: q.options || [], hi: [] },
    correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
    explanation: q.explanation || { en: '', hi: '' },
    points: q.points || 10,
    difficulty: q.difficulty || 'medium',
  }));

  return {
    quizId,
    subjectId,
    topicId,
    subTopicId,
    title,
    description,
    availableLanguages,
    defaultLanguage,
    isMultilingual,
    questions: normalizedQuestions,
    timeLimit,
    totalPoints: normalizedQuestions.reduce((sum, q) => sum + (q.points || 10), 0),
    settings: quizJson.settings || {},
  };
}
