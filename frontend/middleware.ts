import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Make ALL routes public for now since we're still using localStorage
// Authentication is available but not enforced
const isPublicRoute = createRouteMatcher([
  '/(.*)', // Everything is public
]);

export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};
