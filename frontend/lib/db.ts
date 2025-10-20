import { NormalizedQuiz, NormalizedQuestion } from './quiz/normalize';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

function sessionToNormalizedQuiz(session: any, subjectId: string, topicId: string, subTopicId = ''): NormalizedQuiz {
  const title = { en: session.topicName || `Topic ${topicId}`, hi: session.topicName || `Topic ${topicId}` };
  const description = { en: session.subjectName || '', hi: session.subjectName || '' };

  const questions: NormalizedQuestion[] = (session.questions || []).map((q: any, idx: number) => ({
    questionId: q.id || `q${idx + 1}`,
    question: { en: q.text || '', hi: q.text || '' },
    options: {
      en: Array.isArray(q.options) ? q.options.map((o: any) => (typeof o === 'string' ? o : String(o?.text ?? ''))) : [],
      hi: Array.isArray(q.options) ? q.options.map((o: any) => (typeof o === 'string' ? o : String(o?.text ?? ''))) : [],
    },
    // Note: backend session may intentionally not expose correct answers for live quizzes.
    // If present, use it; otherwise default to 0 to avoid undefined issues in UI.
    correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
    explanation: { en: q.explanation || '', hi: q.explanation || '' },
    points: typeof q.points === 'number' ? q.points : 10,
    difficulty: q.difficulty || 'medium',
  }));

  const allTexts = [title.en, description.en, ...questions.flatMap((qq) => [qq.question.en, ...qq.options.en, qq.explanation.en])];
  const hasEnglish = allTexts.some((s) => typeof s === 'string' && s.trim().length > 0);

  const availableLanguages = hasEnglish ? ['en'] : ['hi'];

  return {
    quizId: session.topicId || topicId,
    id: session.topicId || topicId,
    title,
    description,
    subjectId: subjectId || session.subjectId || '',
    topicId: topicId || session.topicId || '',
    subTopicId: subTopicId || session.subTopicId || '',
    availableLanguages: availableLanguages as any,
    defaultLanguage: 'en',
    isMultilingual: (availableLanguages as string[]).length > 1,
    timeLimit: session.durationSeconds ?? session.timeLimit ?? 600,
    totalPoints: questions.reduce((s, q) => s + (q.points || 0), 0),
    settings: { instantFeedback: true },
    questions,
  };
}

export async function getQuizByTopicId(topicId: string, subjectId = '', subTopicId = ''): Promise<NormalizedQuiz | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/quiz/session/${encodeURIComponent(topicId)}?count=10`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      console.error('Failed to fetch quiz session:', res.status, await res.text());
      return null;
    }

    const session = await res.json();
    // If API returns object with session at root, use it; otherwise assume response is the session
    const sessionObj = session?.questions ? session : session;

    return sessionToNormalizedQuiz(sessionObj, subjectId, topicId, subTopicId);
  } catch (e) {
    console.error('Error in getQuizByTopicId:', e);
    return null;
  }
}

export async function saveQuiz(normalizedQuiz: Omit<NormalizedQuiz, 'id'> & { createdBy?: string }, meta: { createdBy?: string } = {}) {
  // Proxy to the frontend admin API route which forwards to backend admin import
  try {
    const res = await fetch('/api/admin/import-quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subjectId: normalizedQuiz.subjectId,
        topicId: normalizedQuiz.topicId,
        subTopicId: normalizedQuiz.subTopicId,
        quizJson: {
          title: normalizedQuiz.title,
          description: normalizedQuiz.description,
          timeLimit: normalizedQuiz.timeLimit,
          questions: normalizedQuiz.questions.map((q) => ({
            questionId: q.questionId,
            question: q.question,
            options: q.options,
            correctIndex: q.correctIndex,
            explanation: q.explanation,
            points: q.points,
            difficulty: q.difficulty,
          })),
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Import failed: ${res.status} ${text}`);
    }

    return await res.json();
  } catch (e) {
    console.error('saveQuiz error:', e);
    throw e;
  }
}
