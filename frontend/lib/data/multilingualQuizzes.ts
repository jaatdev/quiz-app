import type { LanguageCode } from '@/lib/i18n/config';

export interface MultilingualQuestion {
  questionId: string;
  question: Record<LanguageCode, string>;
  options: Record<LanguageCode, string[]>;
  correctAnswer: number;
  explanation: Record<LanguageCode, string>;
  points: number;
  category?: string;
}

export interface MultilingualQuiz {
  quizId: string;
  title: Record<LanguageCode, string>;
  description: Record<LanguageCode, string>;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  availableLanguages: LanguageCode[];
  defaultLanguage: LanguageCode;
  timeLimit: number;
  questions: MultilingualQuestion[];
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Sample Multilingual Quiz - India General Knowledge
 */
export const sampleIndiaQuiz: MultilingualQuiz = {
  quizId: 'india_gk_001',
  title: {
    en: 'India General Knowledge',
    hi: 'भारत सामान्य ज्ञान',
    es: 'Conocimiento General de India',
    fr: 'Connaissances Générales sur l\'Inde'
  },
  description: {
    en: 'Test your knowledge about India - geography, history, culture, and more!',
    hi: 'भारत के बारे में अपने ज्ञान का परीक्षण करें - भूगोल, इतिहास, संस्कृति और बहुत कुछ!',
    es: '¡Prueba tus conocimientos sobre India - geografía, historia, cultura y más!',
    fr: 'Testez vos connaissances sur l\'Inde - géographie, histoire, culture et bien plus!'
  },
  category: 'geography',
  difficulty: 'medium',
  availableLanguages: ['en', 'hi', 'es', 'fr'],
  defaultLanguage: 'en',
  timeLimit: 600,
  questions: [
    {
      questionId: 'q1',
      question: {
        en: 'What is the capital of India?',
        hi: 'भारत की राजधानी क्या है?',
        es: '¿Cuál es la capital de India?',
        fr: 'Quelle est la capitale de l\'Inde?'
      },
      options: {
        en: ['Mumbai', 'New Delhi', 'Kolkata', 'Chennai'],
        hi: ['मुंबई', 'नई दिल्ली', 'कोलकाता', 'चेन्नई'],
        es: ['Bombay', 'Nueva Delhi', 'Calcuta', 'Chennai'],
        fr: ['Bombay', 'Nouvelle Delhi', 'Calcutta', 'Chennai']
      },
      correctAnswer: 1,
      explanation: {
        en: 'New Delhi has been the capital of India since 1911.',
        hi: 'नई दिल्ली 1911 से भारत की राजधानी है।',
        es: 'Nueva Delhi ha sido la capital de India desde 1911.',
        fr: 'Nouvelle Delhi est la capitale de l\'Inde depuis 1911.'
      },
      points: 10,
      category: 'geography'
    },
    {
      questionId: 'q2',
      question: {
        en: 'Who wrote the national anthem of India?',
        hi: 'भारत का राष्ट्रगान किसने लिखा?',
        es: '¿Quién escribió el himno nacional de India?',
        fr: 'Qui a écrit l\'hymne national de l\'Inde?'
      },
      options: {
        en: ['Mahatma Gandhi', 'Rabindranath Tagore', 'Bankim Chandra Chatterjee', 'Sarojini Naidu'],
        hi: ['महात्मा गांधी', 'रवींद्रनाथ टैगोर', 'बंकिम चंद्र चटर्जी', 'सरोजिनी नायडू'],
        es: ['Mahatma Gandhi', 'Rabindranath Tagore', 'Bankim Chandra Chatterjee', 'Sarojini Naidu'],
        fr: ['Mahatma Gandhi', 'Rabindranath Tagore', 'Bankim Chandra Chatterjee', 'Sarojini Naidu']
      },
      correctAnswer: 1,
      explanation: {
        en: 'Rabindranath Tagore wrote "Jana Gana Mana" in 1911, which became India\'s national anthem.',
        hi: 'रवींद्रनाथ टैगोर ने 1911 में "जन गण मन" लिखा था, जो भारत का राष्ट्रगान बना।',
        es: 'Rabindranath Tagore escribió "Jana Gana Mana" en 1911, que se convirtió en el himno nacional.',
        fr: 'Rabindranath Tagore a écrit "Jana Gana Mana" en 1911, devenu l\'hymne national.'
      },
      points: 10,
      category: 'history'
    },
    {
      questionId: 'q3',
      question: {
        en: 'What is the largest river in India?',
        hi: 'भारत की सबसे बड़ी नदी कौन सी है?',
        es: '¿Cuál es el río más grande de India?',
        fr: 'Quel est le plus grand fleuve de l\'Inde?'
      },
      options: {
        en: ['Brahmaputra', 'Ganges', 'Godavari', 'Narmada'],
        hi: ['ब्रह्मपुत्र', 'गंगा', 'गोदावरी', 'नर्मदा'],
        es: ['Brahmaputra', 'Ganges', 'Godavari', 'Narmada'],
        fr: ['Brahmapoutre', 'Gange', 'Godavari', 'Narmada']
      },
      correctAnswer: 1,
      explanation: {
        en: 'The Ganges (Ganga) is the longest river in India at 2,525 km.',
        hi: 'गंगा भारत की सबसे लंबी नदी है जो 2,525 किमी लंबी है।',
        es: 'El Ganges es el río más largo de India con 2,525 km.',
        fr: 'Le Gange est le plus long fleuve de l\'Inde avec 2 525 km.'
      },
      points: 10,
      category: 'geography'
    },
    {
      questionId: 'q4',
      question: {
        en: 'In which year did India gain independence?',
        hi: 'भारत को किस वर्ष आजादी मिली?',
        es: '¿En qué año ganó independencia India?',
        fr: 'En quelle année l\'Inde a-t-elle obtenu son indépendance?'
      },
      options: {
        en: ['1945', '1947', '1950', '1952'],
        hi: ['1945', '1947', '1950', '1952'],
        es: ['1945', '1947', '1950', '1952'],
        fr: ['1945', '1947', '1950', '1952']
      },
      correctAnswer: 1,
      explanation: {
        en: 'India gained independence on August 15, 1947.',
        hi: 'भारत को 15 अगस्त 1947 को आजादी मिली।',
        es: 'India ganó la independencia el 15 de agosto de 1947.',
        fr: 'L\'Inde a obtenu l\'indépendance le 15 août 1947.'
      },
      points: 10,
      category: 'history'
    },
    {
      questionId: 'q5',
      question: {
        en: 'What is the national flower of India?',
        hi: 'भारत का राष्ट्रीय फूल क्या है?',
        es: '¿Cuál es la flor nacional de India?',
        fr: 'Quelle est la fleur nationale de l\'Inde?'
      },
      options: {
        en: ['Rose', 'Lotus', 'Jasmine', 'Marigold'],
        hi: ['गुलाब', 'कमल', 'चमेली', 'गेंदा'],
        es: ['Rosa', 'Loto', 'Jazmín', 'Caléndula'],
        fr: ['Rose', 'Lotus', 'Jasmin', 'Calendula']
      },
      correctAnswer: 1,
      explanation: {
        en: 'The Lotus is the national flower of India, symbolizing purity and enlightenment.',
        hi: 'कमल भारत का राष्ट्रीय फूल है, जो शुद्धता और ज्ञान का प्रतीक है।',
        es: 'El loto es la flor nacional de India, simbolizando pureza e iluminación.',
        fr: 'Le lotus est la fleur nationale de l\'Inde, symbolisant la pureté et l\'illumination.'
      },
      points: 10,
      category: 'culture'
    }
  ],
  tags: ['india', 'general-knowledge', 'geography', 'history', 'culture'],
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z'
};

/**
 * Sample Multilingual Quiz - Mathematics
 */
export const sampleMathQuiz: MultilingualQuiz = {
  quizId: 'math_basics_001',
  title: {
    en: 'Mathematics Basics',
    hi: 'गणित मूलभूत',
    es: 'Conceptos Básicos de Matemáticas',
    fr: 'Concepts Mathématiques de Base'
  },
  description: {
    en: 'Test your mathematical skills with basic arithmetic problems.',
    hi: 'बुनियादी अंकगणित समस्याओं के साथ अपने गणितीय कौशल का परीक्षण करें।',
    es: 'Prueba tus habilidades matemáticas con problemas aritméticos básicos.',
    fr: 'Testez vos compétences en mathématiques avec des problèmes arithmétiques de base.'
  },
  category: 'mathematics',
  difficulty: 'easy',
  availableLanguages: ['en', 'hi', 'es', 'fr'],
  defaultLanguage: 'en',
  timeLimit: 300,
  questions: [
    {
      questionId: 'q1',
      question: {
        en: 'What is 7 × 8?',
        hi: '7 × 8 क्या है?',
        es: '¿Cuánto es 7 × 8?',
        fr: 'Combien font 7 × 8?'
      },
      options: {
        en: ['54', '56', '58', '60'],
        hi: ['54', '56', '58', '60'],
        es: ['54', '56', '58', '60'],
        fr: ['54', '56', '58', '60']
      },
      correctAnswer: 1,
      explanation: {
        en: '7 multiplied by 8 equals 56.',
        hi: '7 को 8 से गुणा करने पर 56 बराबर होता है।',
        es: '7 multiplicado por 8 es igual a 56.',
        fr: '7 multiplié par 8 est égal à 56.'
      },
      points: 10
    },
    {
      questionId: 'q2',
      question: {
        en: 'What is 100 ÷ 5?',
        hi: '100 ÷ 5 क्या है?',
        es: '¿Cuánto es 100 ÷ 5?',
        fr: 'Combien font 100 ÷ 5?'
      },
      options: {
        en: ['15', '20', '25', '30'],
        hi: ['15', '20', '25', '30'],
        es: ['15', '20', '25', '30'],
        fr: ['15', '20', '25', '30']
      },
      correctAnswer: 1,
      explanation: {
        en: '100 divided by 5 equals 20.',
        hi: '100 को 5 से भाग देने पर 20 बराबर होता है।',
        es: '100 dividido entre 5 es igual a 20.',
        fr: '100 divisé par 5 est égal à 20.'
      },
      points: 10
    }
  ],
  tags: ['mathematics', 'arithmetic', 'easy'],
  createdAt: '2024-01-15T11:00:00Z',
  updatedAt: '2024-01-15T11:00:00Z'
};

/**
 * Array of all multilingual quizzes
 */
export const multilingualQuizzes: MultilingualQuiz[] = [
  sampleIndiaQuiz,
  sampleMathQuiz
];
