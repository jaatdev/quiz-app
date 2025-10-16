import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/leaderboard',
  '/history',
  '/stats',
  '/subject(.*)',
  '/quiz(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/welcome',
  '/api/(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const path = req.nextUrl.pathname;

  // If accessing admin and not logged in -> go to sign-in with deep-link back to admin
  if (path.startsWith('/admin') && !userId) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', path + req.nextUrl.search);
    return NextResponse.redirect(signInUrl);
  }

  // Don't protect public routes
  if (!isPublicRoute(req)) {
    // For non-public, non-admin routes, only redirect if not logged in
    if (!userId) {
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', path);
      return NextResponse.redirect(signInUrl);
    }
  }

  // Otherwise do nothing (no forced redirect to /dashboard)
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Run middleware for all routes except static files and _next
    '/((?!.+\\.[\\w]+$|_next).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
};
