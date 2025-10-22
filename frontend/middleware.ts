import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

// Create the intl middleware
const intlMiddleware = createIntlMiddleware(routing);

// Public routes - accessible to everyone
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/welcome',
  '/api/(.*)',
  '/_next(.*)',
  '/favicon.ico',
]);

// Protected routes - require authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/quiz(.*)',
  '/my-history(.*)',
  '/user-info(.*)',
]);

// Admin-only routes - require authentication + admin role
const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const path = req.nextUrl.pathname;

  // First, handle internationalization routing
  const intlResponse = intlMiddleware(req);
  if (intlResponse && intlResponse !== NextResponse.next()) {
    return intlResponse;
  }

  // Check if route is admin-only
  if (isAdminRoute(req)) {
    if (!userId) {
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', path + req.nextUrl.search);
      return NextResponse.redirect(signInUrl);
    }
    // Note: Role checking should be done on the client-side for now
    // You can add server-side role checking via user metadata
  }

  // Check if route is protected
  if (isProtectedRoute(req)) {
    if (!userId) {
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', path + req.nextUrl.search);
      return NextResponse.redirect(signInUrl);
    }
  }

  // Allow public routes to proceed
  return NextResponse.next();
});

export const config = {
  // Match all pathnames except for
  // - API routes (/api/*)
  // - Static files (/_next/*, /images/*, etc.)
  // - Files in public folder with extensions
  matcher: ['/', '/(hi|en)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)']
};
