import { normalizeQuiz } from '../quizNormalizer';
import { describe, it, expect } from 'vitest';

describe('normalizeQuiz EN/HI clamp', () => {
  it('keeps only en/hi and sets isMultilingual correctly', () => {
    const quiz = {
      title: { en: 'Title', hi: 'शीर्षक', es: 'Titulo' },
      description: { en: 'Desc', es: 'Desc-es' },
      questions: [{
        question: { en: 'English', hi: 'Hindi', es: 'Esp' },
        options: { en: ['A','B','C','D'], hi: ['अ','ब','स','द'], es: ['1','2','3','4'] },
        correctAnswer: 1,
        explanation: { en: 'ok', fr: 'fr' }
      }]
    };

    const out = normalizeQuiz(quiz as any);
    expect(out.availableLanguages).toEqual(expect.arrayContaining(['en', 'hi']));
    expect(out.availableLanguages).toHaveLength(2);
    expect(out.isMultilingual).toBe(true);
    expect(out.questions[0].question.en).toBe('English');
    expect(out.questions[0].question.hi).toBe('Hindi');
    expect(out.questions[0].options.en[0]).toMatch(/A/);
    expect(out.questions[0].options.hi[0]).toMatch(/अ/);
    expect(typeof out.questions[0].correctAnswer).toBe('number');
    // no es/fr in final structure
    expect((out.title as any).es).toBeUndefined();
    expect((out.questions[0].explanation as any).fr).toBeUndefined();
  });
});
