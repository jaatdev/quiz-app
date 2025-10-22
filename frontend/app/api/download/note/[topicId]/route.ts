import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { API_URL } from '@/lib/config';

export const dynamic = 'force-dynamic';

function errorJson(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(req: NextRequest, context: { params: Promise<{ topicId: string }> }) {
  const { topicId } = await context.params;
  const { userId } = await auth();

  if (!userId) return errorJson('Unauthorized', 401);
  if (!topicId) return errorJson('Topic ID is required', 400);
  if (!API_URL) return errorJson('API URL not configured', 500);

  const backendUrl = `${API_URL}/notes/${encodeURIComponent(topicId)}/download`;

  try {
    // Forward Authorization header from the incoming request when present
    const incomingAuth = req.headers.get('authorization') || undefined;

    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        ...(incomingAuth ? { Authorization: incomingAuth } : {}),
        'X-Clerk-User-Id': userId,
        'X-Requested-With': 'Next.js Route',
      },
      cache: 'no-store',
    });

    if (!backendResponse.ok || !backendResponse.body) {
      const errorText = await backendResponse.text().catch(() => 'Failed to download notes');
      console.error('Download proxy error:', backendResponse.status, errorText);
      return errorJson(errorText || 'Failed to download notes', backendResponse.status || 502);
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
    return errorJson('Failed to download notes', 502);
  }
}
