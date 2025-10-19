import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

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
  matcher: [
    // Run middleware for all routes except static files and _next
    '/((?!.+\\.[\\w]+$|_next).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
};
