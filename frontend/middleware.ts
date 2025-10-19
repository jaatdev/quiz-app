// frontend/middleware.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const config = {
  // run on all routes except assets and _next
  matcher: ['/((?!_next|.*\\..*|api/.*).*)'],
};

export default function middleware(_req: NextRequest) {
  return NextResponse.next();
}
