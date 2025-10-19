// frontend/middleware.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const config = {
  matcher: ['/((?!_next|.*\\..*|api/.*).*)'], // run on all pages, skip assets/API
};

export default function middleware(_req: NextRequest) {
  return NextResponse.next();
}
