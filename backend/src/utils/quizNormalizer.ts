// Utility to normalize quizzes into a multilingual shape for Prisma MultilingualQuiz
// Lightweight TypeScript helpers
type LangMap = { [lang: string]: any };

const SUPPORTED_LANGS = ['en', 'hi'];
const hasDevanagari = (s = '') => /[\u0900-\u097F]/.test(String(s));
const isStr = (v: unknown) => typeof v === 'string' && v.trim().length > 0;

// splitBi accepts strings like 'English / हिंदी' or 'हिंदी / English' and returns {en, hi}
const splitBi = (text = ''): { en: string; hi: string } => {
  if (!isStr(text)) return { en: '', hi: '' };
  const parts = String(text).split('/').map((p) => p.trim());
  if (parts.length === 2) {
    const [p1, p2] = parts;
    const p1Hi = hasDevanagari(p1);
    return p1Hi ? { hi: p1, en: p2 } : { en: p1, hi: p2 };
  }
  // single language -> duplicate so UI stays consistent
  return { en: String(text), hi: String(text) };
};

const answerMap: Record<string, number> = { a: 0, b: 1, c: 2, d: 3 };

const normalizeQuestion = (q: any, idx: number) => {
  const nq: any = { ...(q || {}) };
  nq.questionId = nq.questionId || `q${idx + 1}`;

  // question text -> clamp to en/hi only
  if (nq.question && typeof nq.question === 'object' && !Array.isArray(nq.question)) {
    nq.question = { en: String(nq.question.en || '').trim(), hi: String(nq.question.hi || '').trim() };
  } else if (isStr(nq.text)) {
    nq.question = splitBi(nq.text);
    delete nq.text;
  } else {
    nq.question = { en: '', hi: '' };
  }

  // options
  if (Array.isArray(nq.options)) {
    const en: string[] = [];
    const hi: string[] = [];
    nq.options.forEach((opt: any) => {
      const t = isStr(opt?.text) ? splitBi(opt.text) : { en: '', hi: '' };
      en.push(t.en);
      hi.push(t.hi);
    });
    nq.options = { en, hi };
  } else if (nq.options && typeof nq.options === 'object') {
    nq.options = {
      en: Array.isArray(nq.options.en) ? nq.options.en.map(String) : [],
      hi: Array.isArray(nq.options.hi) ? nq.options.hi.map(String) : [],
    };
  } else {
    nq.options = { en: [], hi: [] };
  }

  // Ensure options arrays are both present: duplicate missing one
  if ((!nq.options.en || nq.options.en.length === 0) && (nq.options.hi && nq.options.hi.length > 0)) nq.options.en = [...nq.options.hi];
  if ((!nq.options.hi || nq.options.hi.length === 0) && (nq.options.en && nq.options.en.length > 0)) nq.options.hi = [...nq.options.en];

  // explanation/hint

  if (isStr(nq.explanation)) nq.explanation = splitBi(nq.explanation);
  else if (nq.explanation && typeof nq.explanation === 'object') nq.explanation = { en: String(nq.explanation.en || ''), hi: String(nq.explanation.hi || '') };
  else nq.explanation = { en: '', hi: '' };

  if (isStr(nq.hint)) nq.hint = splitBi(nq.hint);
  else if (nq.hint && typeof nq.hint === 'object') nq.hint = { en: String(nq.hint.en || ''), hi: String(nq.hint.hi || '') };

  // answers
  if (typeof nq.correctAnswer === 'number' && Number.isFinite(nq.correctAnswer)) {
    // ok
  } else if (isStr(nq.correctAnswerId)) {
    nq.correctAnswer = answerMap[String(nq.correctAnswerId).toLowerCase()] ?? 0;
    delete nq.correctAnswerId;
  } else if (isStr(nq.correctAnswer)) {
    const s = String(nq.correctAnswer).trim();
    if (/^\d+$/.test(s)) nq.correctAnswer = parseInt(s, 10);
    else nq.correctAnswer = answerMap[s.toLowerCase()] ?? 0;
  } else {
    nq.correctAnswer = 0;
  }

  nq.points = typeof nq.points === 'number' ? nq.points : 10;
  return nq;
};

const detectAvailableLanguages = (quiz: any) => {
  let hasEn = false;
  let hasHi = false;
  const checkText = (txtObj: any) => {
    if (!txtObj) return;
    if (isStr(txtObj.en)) hasEn = hasEn || txtObj.en.trim().length > 0;
    if (isStr(txtObj.hi)) hasHi = hasHi || txtObj.hi.trim().length > 0;
  };
  checkText(quiz.title);
  checkText(quiz.description);
  (quiz.questions || []).forEach((q: any) => {
    checkText(q.question);
    (q.options?.en || []).forEach((s: any) => { if (isStr(s)) hasEn = true; });
    (q.options?.hi || []).forEach((s: any) => { if (isStr(s)) hasHi = true; });
    checkText(q.explanation);
  });
  const langs: string[] = [];
  if (hasEn) langs.push('en');
  if (hasHi) langs.push('hi');
  // Only allow supported langs
  const filtered = langs.filter((l) => SUPPORTED_LANGS.includes(l));
  return filtered.length ? filtered : ['en'];
};

export const normalizeQuiz = (quiz: any) => {
  const out: any = { ...(quiz || {}) };
  if (isStr(out.title)) out.title = splitBi(out.title);
  else if (out.title && typeof out.title === 'object') out.title = { en: String(out.title.en || ''), hi: String(out.title.hi || '') };
  else out.title = { en: 'Quiz', hi: 'क्विज़' };

  if (isStr(out.description)) out.description = splitBi(out.description);
  else if (out.description && typeof out.description === 'object') out.description = { en: String(out.description.en || ''), hi: String(out.description.hi || '') };
  else out.description = { en: '', hi: '' };

  out.questions = (out.questions || []).map((q: any, idx: number) => normalizeQuestion(q, idx));
  out.availableLanguages = detectAvailableLanguages(out).filter((l: string) => SUPPORTED_LANGS.includes(l));
  // Strict: multilingual only when both en and hi are present
  out.isMultilingual = out.availableLanguages.length === 2 && out.availableLanguages.includes('en') && out.availableLanguages.includes('hi');
  out.defaultLanguage = out.defaultLanguage || (out.availableLanguages.includes('en') ? 'en' : out.availableLanguages[0]);
  out.totalPoints = out.questions.reduce((s: number, q: any) => s + (q.points || 10), 0);
  out.difficulty = out.difficulty || 'medium';
  out.timeLimit = typeof out.timeLimit === 'number' && out.timeLimit > 0 ? out.timeLimit : (out.timeLimit === 0 ? 0 : (out.questions.length ? Math.max(10, Math.floor((out.questions.length * 1) / 1) * 1) : 600));
  out.tags = Array.isArray(out.tags) ? out.tags : [];
  return out;
};

export const toSingleLanguageOldFormat = (quiz: any, lang = 'en') => {
  const old: any = {
    quizId: quiz.id || quiz.quizId,
    title: (quiz.title && quiz.title[lang]) || (quiz.title && quiz.title.en) || '',
    description: (quiz.description && quiz.description[lang]) || (quiz.description && quiz.description.en) || '',
    category: quiz.category,
    difficulty: quiz.difficulty,
    timeLimit: quiz.timeLimit,
    questions: [] as any[],
  };
  (quiz.questions || []).forEach((q: any, idx: number) => {
    const opts = (q.options && (q.options[lang] || q.options.en)) || [];
    old.questions.push({
      questionId: q.questionId || `q${idx + 1}`,
      text: (q.question && (q.question[lang] || q.question.en)) || '',
      options: opts.map((t: any, i: number) => ({ id: String.fromCharCode(97 + i), text: t })),
      correctAnswerId: String.fromCharCode(97 + (q.correctAnswer || 0)),
      explanation: (q.explanation && (q.explanation[lang] || q.explanation.en)) || '',
      difficulty: q.difficulty || quiz.difficulty,
      topicId: q.topicId,
    });
  });
  return old;
};

export default { normalizeQuiz, toSingleLanguageOldFormat };
