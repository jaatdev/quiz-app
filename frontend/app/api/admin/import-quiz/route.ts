import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

function errorJson(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return errorJson('Unauthorized', 401);

    const body = await req.json();
    const { subjectId, topicId, subTopicId, quizJson } = body;

    if (!subjectId || !topicId || !subTopicId) {
      return errorJson('Subject, Topic, and Sub-topic are required fields.', 400);
    }

    // Forward incoming Authorization header if present (Clerk session token)
    const authHeader = (req as any).headers?.get?.('authorization') || undefined;

    const response = await fetch(`${API_BASE_URL}/admin/import-quiz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
        'X-Clerk-User-Id': userId,
      },
      body: JSON.stringify({ subjectId, topicId, subTopicId, quizJson }),
    });

    if (!response.ok) {
      let errorBody: any = {};
      try { errorBody = await response.json(); } catch { /* ignore */ }
      console.error('Backend import failed:', response.status, errorBody);
      return errorJson(errorBody.error || 'Backend import failed', response.status || 502);
    }

    const result = await response.json();
    console.log('✅ Successfully imported quiz via backend API:', result.quizId);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('❌ Quiz Import Error:', err);
    return errorJson(err?.message || 'Import failed', 500);
  }
}
