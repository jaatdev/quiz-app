import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

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

    // Call the backend API
    const response = await fetch(`${API_BASE_URL}/admin/import-quiz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In production, you might need to pass authentication headers
        // For now, assuming the backend handles admin auth separately
      },
      body: JSON.stringify({
        subjectId,
        topicId,
        subTopicId,
        quizJson
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || 'Backend import failed' },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('✅ Successfully imported quiz via backend API:', result.quizId);

    return NextResponse.json(result);
  } catch (e: any) {
    console.error('❌ Quiz Import Error:', e);
    return NextResponse.json({ error: e.message || 'Import failed' }, { status: 500 });
  }
}
