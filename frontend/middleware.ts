import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

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
  '/admin(.*)',
]);

export default clerkMiddleware((auth, req) => {
  // Protect all routes that are not public
  if (!isPublicRoute(req)) {
    auth().protect();
  }
});

export const config = {
  matcher: [
    // Run middleware for all routes except static files and _next
    '/((?!.+\\.[\\w]+$|_next).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
};
