import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

// Create the intl middleware
const intlMiddleware = createIntlMiddleware(routing);

// Define public and protected route matchers
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/',
  '/welcome',
]);

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/admin(.*)',
  '/quiz(.*)',
  '/history(.*)',
  '/leaderboard(.*)',
  '/stats(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // Run next-intl middleware first; if it returns a response, forward it
  try {
    const intlResponse = intlMiddleware(req);
    if (intlResponse && intlResponse !== NextResponse.next()) return intlResponse;
  } catch (e) {
    // swallow intl errors to avoid blocking requests
    console.error('intl middleware error', e);
  }

  // If the route is protected, enforce authentication
  if (isProtectedRoute(req)) {
    try {
      const authObj = await auth();
      // Prefer the protect helper if available
      if (typeof (authObj as any)?.protect === 'function') {
        (authObj as any).protect();
      } else if (!authObj?.userId) {
        // If no userId, redirect to sign-in
        const path = req.nextUrl.pathname;
        const signInUrl = new URL('/sign-in', req.url);
        signInUrl.searchParams.set('redirect_url', path + req.nextUrl.search);
        return NextResponse.redirect(signInUrl);
      }
    } catch (e) {
      console.error('auth check failed in middleware', e);
      // If auth check fails, allow Next to handle the request (or you may redirect)
    }
  }

  // Allow all other requests to proceed
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals, API routes, and static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
    // Run on the root route
    '/',
  ],
};
