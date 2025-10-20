import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { normalizeIncomingQuiz } from '@/lib/quiz/normalize';
import { saveQuiz } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { subjectId, topicId, subTopicId, quizJson } = body;

    if (!subjectId || !topicId || !subTopicId) {
      return NextResponse.json({ error: 'Subject, Topic, and Sub-topic are required fields.' }, { status: 400 });
    }

    const normalizedQuizData = normalizeIncomingQuiz(quizJson, subjectId, topicId, subTopicId);
    const savedQuiz = await saveQuiz(normalizedQuizData, { createdBy: userId });

    console.log('✅ Successfully imported and normalized quiz:', savedQuiz.id);

    return NextResponse.json({ success: true, quizId: savedQuiz.id });
  } catch (e: any) {
    console.error('❌ Quiz Import Error:', e);
    return NextResponse.json({ error: e.message || 'Import failed' }, { status: 500 });
  }
}
