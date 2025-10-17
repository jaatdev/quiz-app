import type { LanguageCode } from './config';
import { DEFAULT_LANGUAGE } from './config';

/**
 * Multilingual string type
 */
export type MultilingualContent<T = string> = Record<LanguageCode, T>;

/**
 * Get localized content with fallback
 */
export function getLocalizedContent(
  content: MultilingualContent | string | null | undefined,
  language: LanguageCode,
  fallbackLanguage: LanguageCode = DEFAULT_LANGUAGE
): string {
  if (!content) return '';
  if (typeof content === 'string') return content;
  
  return (
    content[language] ||
    content[fallbackLanguage] ||
    Object.values(content)[0] ||
    ''
  );
}

/**
 * Get localized array
 */
export function getLocalizedArray<T = string>(
  content: Record<LanguageCode, T[]> | T[] | null | undefined,
  language: LanguageCode,
  fallbackLanguage: LanguageCode = DEFAULT_LANGUAGE
): T[] {
  if (!content) return [];
  if (Array.isArray(content)) return content;
  
  return (
    content[language] ||
    content[fallbackLanguage] ||
    Object.values(content)[0] ||
    []
  );
}

/**
 * Validate multilingual quiz data
 */
export interface ValidationError {
  field: string;
  message: string;
  language?: LanguageCode;
}

export function validateMultilingualQuiz(quizData: any): {
  isValid: boolean;
  errors: ValidationError[];
} {
  const errors: ValidationError[] = [];
  const languages = quizData.availableLanguages || ['en'];

  // Validate title
  if (!quizData.title) {
    errors.push({ field: 'title', message: 'Title is required' });
  } else {
    languages.forEach((lang: LanguageCode) => {
      if (!quizData.title[lang]) {
        errors.push({
          field: 'title',
          message: `Title missing for ${lang}`,
          language: lang
        });
      }
    });
  }

  // Validate description
  languages.forEach((lang: LanguageCode) => {
    if (quizData.description && !quizData.description[lang]) {
      errors.push({
        field: 'description',
        message: `Description missing for ${lang}`,
        language: lang
      });
    }
  });

  // Validate questions
  if (!quizData.questions || quizData.questions.length === 0) {
    errors.push({ field: 'questions', message: 'At least one question is required' });
  } else {
    quizData.questions.forEach((q: any, index: number) => {
      const qNum = index + 1;

      // Check question text
      languages.forEach((lang: LanguageCode) => {
        if (!q.question?.[lang]) {
          errors.push({
            field: `questions.${index}.question`,
            message: `Question ${qNum}: Missing text for ${lang}`,
            language: lang
          });
        }
      });

      // Check options
      languages.forEach((lang: LanguageCode) => {
        if (!q.options?.[lang] || q.options[lang].length !== 4) {
          errors.push({
            field: `questions.${index}.options`,
            message: `Question ${qNum}: Must have exactly 4 options for ${lang}`,
            language: lang
          });
        }
      });

      // Check correct answer
      if (!Number.isInteger(q.correctAnswer) || q.correctAnswer < 0 || q.correctAnswer > 3) {
        errors.push({
          field: `questions.${index}.correctAnswer`,
          message: `Question ${qNum}: Correct answer must be 0-3`
        });
      }

      // Check explanation
      languages.forEach((lang: LanguageCode) => {
        if (!q.explanation?.[lang]) {
          errors.push({
            field: `questions.${index}.explanation`,
            message: `Question ${qNum}: Missing explanation for ${lang}`,
            language: lang
          });
        }
      });
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Convert CSV to multilingual quiz format
 */
export function csvToMultilingualQuiz(csvContent: string): any {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim());
  
  const quiz: any = {
    quizId: '',
    title: {},
    description: {},
    questions: [],
    availableLanguages: []
  };

  const questionsMap = new Map();

  lines.slice(1).forEach(line => {
    const values = line.split(',').map(v => v.trim());
    const data: any = {};

    headers.forEach((header, index) => {
      data[header] = values[index];
    });

    if (!quiz.quizId) {
      quiz.quizId = data.QuizID;
      quiz.title = {
        en: data.Title_EN,
        hi: data.Title_HI
      };
      quiz.description = {
        en: data.Description_EN,
        hi: data.Description_HI
      };
      quiz.category = data.Category;
      quiz.difficulty = data.Difficulty;
      quiz.timeLimit = parseInt(data.TimeLimit);
      quiz.availableLanguages = data.AvailableLanguages.split(',').map((l: string) => l.trim());
    }

    const questionId = data.QuestionID;
    if (!questionsMap.has(questionId)) {
      questionsMap.set(questionId, {
        questionId,
        question: {
          en: data.Question_EN,
          hi: data.Question_HI
        },
        options: {
          en: [data.OptionA_EN, data.OptionB_EN, data.OptionC_EN, data.OptionD_EN],
          hi: [data.OptionA_HI, data.OptionB_HI, data.OptionC_HI, data.OptionD_HI]
        },
        correctAnswer: parseInt(data.CorrectAnswer),
        explanation: {
          en: data.Explanation_EN,
          hi: data.Explanation_HI
        },
        points: parseInt(data.Points)
      });
    }
  });

  quiz.questions = Array.from(questionsMap.values());
  return quiz;
}

/**
 * Create CSV template for multilingual quizzes
 */
export function createCSVTemplate(): string {
  return `QuizID,Title_EN,Title_HI,Description_EN,Description_HI,Category,Difficulty,TimeLimit,AvailableLanguages,QuestionID,Question_EN,Question_HI,OptionA_EN,OptionA_HI,OptionB_EN,OptionB_HI,OptionC_EN,OptionC_HI,OptionD_EN,OptionD_HI,CorrectAnswer,Explanation_EN,Explanation_HI,Points
quiz_001,Sample Quiz,नमूना क्विज़,Test your knowledge,अपने ज्ञान का परीक्षण करें,general,medium,300,"en,hi",q1,What is 2+2?,2+2 क्या है?,4,4,5,5,3,3,6,6,0,Four,चार,10
quiz_001,Sample Quiz,नमूना क्विज़,Test your knowledge,अपने ज्ञान का परीक्षण करें,general,medium,300,"en,hi",q2,What is the capital of India?,भारत की राजधानी क्या है?,Mumbai,मुंबई,New Delhi,नई दिल्ली,Kolkata,कोलकाता,Chennai,चेन्नई,1,New Delhi is the capital,नई दिल्ली राजधानी है,10`;
}

/**
 * Create JSON template
 */
export function createJSONTemplate(): string {
  const template = {
    quizId: 'quiz_template',
    title: {
      en: 'Quiz Title in English',
      hi: 'हिंदी में क्विज़ शीर्षक'
    },
    description: {
      en: 'Description in English',
      hi: 'हिंदी में विवरण'
    },
    category: 'general',
    difficulty: 'medium',
    availableLanguages: ['en', 'hi'],
    defaultLanguage: 'en',
    timeLimit: 300,
    questions: [
      {
        questionId: 'q1',
        question: {
          en: 'Question in English?',
          hi: 'हिंदी में प्रश्न?'
        },
        options: {
          en: ['Option A', 'Option B', 'Option C', 'Option D'],
          hi: ['विकल्प A', 'विकल्प B', 'विकल्प C', 'विकल्प D']
        },
        correctAnswer: 0,
        explanation: {
          en: 'Explanation in English',
          hi: 'हिंदी में व्याख्या'
        },
        points: 10
      }
    ]
  };

  return JSON.stringify(template, null, 2);
}

/**
 * Detect available languages in quiz data
 */
export function detectAvailableLanguages(quizData: any): LanguageCode[] {
  const languages = new Set<LanguageCode>();

  if (quizData.title && typeof quizData.title === 'object') {
    Object.keys(quizData.title).forEach(lang => {
      if (lang in LANGUAGE_CODES) {
        languages.add(lang as LanguageCode);
      }
    });
  }

  if (Array.isArray(quizData.questions)) {
    quizData.questions.forEach((q: any) => {
      if (q.question && typeof q.question === 'object') {
        Object.keys(q.question).forEach(lang => {
          if (lang in LANGUAGE_CODES) {
            languages.add(lang as LanguageCode);
          }
        });
      }
    });
  }

  return Array.from(languages);
}

// Language code reference
const LANGUAGE_CODES = {
  en: true,
  hi: true,
  es: true,
  fr: true
} as const;
