// lib/quiz/normalize.ts

export type Lang = 'en' | 'hi';

// Define the shape of a perfectly structured question
export type NormalizedQuestion = {
  id?: string;
  questionId: string;
  question: { en: string; hi: string };
  options: { en: string[]; hi: string[] };
  correctIndex: number;
  explanation: { en: string; hi: string };
  points: number;
  difficulty?: 'easy' | 'medium' | 'hard';
};

// Define the shape of a perfectly structured quiz
export type NormalizedQuiz = {
  id?: string;
  quizId?: string;
  title: { en: string; hi: string };
  description: { en: string; hi: string };
  subjectId: string;
  topicId: string;
  subTopicId: string;
  availableLanguages: Lang[];
  defaultLanguage: Lang;
  isMultilingual: boolean;
  timeLimit: number;
  totalPoints: number;
  settings: {
    instantFeedback: boolean;
    // ... other settings
  };
  questions: NormalizedQuestion[];
};

// --- Helper Functions ---
const isStr = (v: any): v is string => typeof v === 'string' && v.trim().length > 0;
const hasHi = (s = '') => /[\u0900-\u097F]/.test(s);
const letterToIndex: Record<string, number> = { a: 0, b: 1, c: 2, d: 3 };

// This function is the core of the fix. It ensures that even single-language text
// is duplicated into both `en` and `hi` fields, preventing null/undefined errors on the frontend.
const normalizeText = (text: any): { en: string; hi: string } => {
  if (typeof text === 'object' && text !== null) {
    return { en: text.en || '', hi: text.hi || '' };
  }
  if (isStr(text)) {
    // If it's a single string, check if it's Hindi. If so, use it for both. Otherwise, use it for both.
    // This prevents one language field from being empty.
    const parts = text.split(' / ').map(p => p.trim());
    if (parts.length === 2) {
      return hasHi(parts[0]) ? { hi: parts[0], en: parts[1] } : { en: parts[0], hi: parts[1] };
    }
    return { en: text, hi: text }; // Duplicate for consistency
  }
  return { en: '', hi: '' };
};

const normalizeOptions = (options: any): { en: string[]; hi: string[] } => {
    if (typeof options === 'object' && options !== null) {
        if (Array.isArray(options)) { // Old format: [{id, text}]
            const en: string[] = [];
            const hi: string[] = [];
            options.forEach(opt => {
                const normalizedOptText = normalizeText(opt.text);
                en.push(normalizedOptText.en);
                hi.push(normalizedOptText.hi);
            });
            return { en, hi };
        } else { // New format: {en: [], hi: []}
            const en = Array.isArray(options.en) ? options.en : [];
            const hi = Array.isArray(options.hi) ? options.hi : [];
            return { en, hi };
        }
    }
    return { en: [], hi: [] };
};


// --- The Main Normalizer Function ---
export function normalizeIncomingQuiz(
  payload: any,
  subjectId: string,
  topicId: string,
  subTopicId: string
): Omit<NormalizedQuiz, 'id'> {
  const raw = Array.isArray(payload)
    ? { title: 'Imported Quiz', description: '', questions: payload }
    : payload;

  const title = normalizeText(raw.title);
  const description = normalizeText(raw.description);

  const questions: NormalizedQuestion[] = (raw.questions || []).map((q: any, idx: number): NormalizedQuestion => {
    return {
      questionId: q.questionId || `q${idx + 1}`,
      question: normalizeText(q.question ?? q.text),
      options: normalizeOptions(q.options),
      correctIndex: typeof q.correctAnswer === 'number' ? q.correctAnswer : letterToIndex[q.correctAnswerId?.toLowerCase()] ?? 0,
      explanation: normalizeText(q.explanation),
      points: typeof q.points === 'number' ? q.points : 10,
      difficulty: q.difficulty || 'medium',
    };
  });

  // Robust language detection
  const contentStrings = [
    title.en, title.hi,
    description.en, description.hi,
    ...questions.flatMap(q => [
        q.question.en, q.question.hi,
        ...q.options.en, ...q.options.hi,
        q.explanation.en, q.explanation.hi
    ])
  ];

  const hasEnglishContent = contentStrings.some(s => isStr(s) && !hasHi(s));
  const hasHindiContent = contentStrings.some(s => isStr(s) && hasHi(s));

  const availableLanguages: Lang[] = [
    ...(hasEnglishContent ? ['en' as Lang] : []),
    ...(hasHindiContent ? ['hi' as Lang] : []),
    ...((!hasEnglishContent && !hasHindiContent) ? ['en' as Lang] : [])
  ];

  return {
    title,
    description,
    subjectId,
    topicId,
    subTopicId,
    availableLanguages,
    defaultLanguage: availableLanguages.includes('en') ? 'en' : 'hi',
    isMultilingual: availableLanguages.length === 2,
    timeLimit: raw.timeLimit || 600,
    totalPoints: questions.reduce((sum, q) => sum + q.points, 0),
    settings: {
      instantFeedback: true,
      //... other settings
    },
    questions,
  };
}
