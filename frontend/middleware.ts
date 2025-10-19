import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/quiz(.*)',
  '/history(.*)',
  '/leaderboard(.*)',
  '/my-history(.*)',
  '/admin(.*)',
]);

// Define public routes that don't need authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/welcome(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/stats(.*)',
  '/subject/(.*)',
  '/user-info(.*)',
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  try {
    // Validate environment variables
    const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const secretKey = process.env.CLERK_SECRET_KEY;

    if (!publishableKey || !secretKey) {
      console.error('Clerk environment variables are missing');
      // Return next() to avoid breaking the app
      return NextResponse.next();
    }

    // Get the current path
    const { pathname } = req.nextUrl;

    // Skip middleware for API routes, static files, and Next.js internals
    if (
      pathname.startsWith('/api/') ||
      pathname.startsWith('/_next/') ||
      pathname.includes('.') ||
      pathname.startsWith('/favicon.ico')
    ) {
      return NextResponse.next();
    }

    // Handle public routes - allow access without authentication
    if (isPublicRoute(req)) {
      return NextResponse.next();
    }

    // Handle protected routes - require authentication
    if (isProtectedRoute(req)) {
      const { userId } = await auth();

      if (!userId) {
        // Redirect to sign-in page
        const signInUrl = new URL('/sign-in', req.url);
        signInUrl.searchParams.set('redirect_url', req.url);
        return NextResponse.redirect(signInUrl);
      }

      // User is authenticated, allow access
      return NextResponse.next();
    }

    // Default: allow access
    return NextResponse.next();

  } catch (error) {
    console.error('Middleware error:', error);

    // In case of any error, allow the request to continue
    // This prevents the app from breaking due to middleware issues
    return NextResponse.next();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
