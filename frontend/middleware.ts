import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define public routes - homepage, auth pages, and view-only pages are public
// Quiz routes will require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/stats',
  '/history',
  '/leaderboard',
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, but include API routes
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
};
