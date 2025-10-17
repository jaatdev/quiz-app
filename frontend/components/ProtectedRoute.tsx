'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * ProtectedRoute component for protecting client-side routes
 * Redirects to sign-in if user is not authenticated
 */
export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in?redirect_url=' + encodeURIComponent(window.location.pathname));
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return fallback || <LoadingSpinner />;
  }

  if (!isSignedIn) {
    return fallback || <LoadingSpinner />;
  }

  return <>{children}</>;
}

/**
 * AdminRoute component for protecting admin-only routes
 * Requires both authentication and admin status
 */
interface AdminRouteProps extends ProtectedRouteProps {
  isAdmin?: boolean;
}

export function AdminRoute({ children, isAdmin = false, fallback }: AdminRouteProps) {
  const { isSignedIn, isLoaded, user } = useAuth();
  const router = useRouter();

  const userIsAdmin = user?.unsafeMetadata?.role === 'admin' || isAdmin;

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in?redirect_url=' + encodeURIComponent(window.location.pathname));
    }
    if (isLoaded && isSignedIn && !userIsAdmin) {
      router.push('/');
    }
  }, [isLoaded, isSignedIn, userIsAdmin, router]);

  if (!isLoaded) {
    return fallback || <LoadingSpinner />;
  }

  if (!isSignedIn || !userIsAdmin) {
    return fallback || <LoadingSpinner />;
  }

  return <>{children}</>;
}
