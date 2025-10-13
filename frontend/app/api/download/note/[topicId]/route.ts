import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { API_URL } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, context: { params: Promise<{ topicId: string }> }) {
  const { topicId } = await context.params;
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!topicId) {
    return NextResponse.json({ error: 'Topic ID is required' }, { status: 400 });
  }

  if (!API_URL) {
    return NextResponse.json({ error: 'API URL not configured' }, { status: 500 });
  }

  const backendUrl = `${API_URL}/notes/${encodeURIComponent(topicId)}/download`;

  try {
    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'X-Clerk-User-Id': userId,
        'X-Requested-With': 'Next.js Route',
      },
      cache: 'no-store',
    });

    if (!backendResponse.ok || !backendResponse.body) {
      const errorText = await backendResponse.text().catch(() => 'Failed to download notes');
      return NextResponse.json(
        { error: errorText || 'Failed to download notes' },
        { status: backendResponse.status || 502 }
      );
    }

    const headers = new Headers(backendResponse.headers);
    headers.set('Cache-Control', 'private, no-store');
    headers.set('Access-Control-Expose-Headers', 'Content-Disposition');
    headers.set('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; sandbox");
    headers.delete('X-Powered-By');

    return new NextResponse(backendResponse.body, {
      status: backendResponse.status,
      headers,
    });
  } catch (error) {
    console.error('Proxy download error:', error);
    return NextResponse.json({ error: 'Failed to download notes' }, { status: 502 });
  }
}
