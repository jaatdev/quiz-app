'use client';

import { useAuth as useClerkAuth } from '@clerk/nextjs';
import { useUser as useClerkUser } from '@clerk/nextjs';

/**
 * Custom hook to access Clerk authentication state
 * Provides: userId, isLoaded, isSignedIn, user, signOut
 */
export function useAuth() {
  const { userId, isLoaded, isSignedIn, signOut } = useClerkAuth();
  const { user } = useClerkUser();

  return {
    userId,
    isLoaded,
    isSignedIn,
    user,
    signOut,
    isAuthenticated: isSignedIn,
    displayName: user?.firstName || user?.primaryEmailAddress?.emailAddress || 'User',
  };
}
