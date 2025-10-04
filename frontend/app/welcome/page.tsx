'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui';
import { Brain, Loader2 } from 'lucide-react';
import { useToast } from '@/providers/toast-provider';

export default function WelcomePage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { showToast } = useToast();
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if user is not loaded or not signed in
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
    }
  }, [isLoaded, user, router]);

  const handleGetStarted = async () => {
    if (!user) return;

    setIsCreatingProfile(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5001/api/user/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerkId: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          name: user.fullName || user.firstName || 'Anonymous',
          avatar: user.imageUrl,
        }),
      });

      if (response.ok) {
        // Profile created successfully, redirect to homepage
        showToast({
          variant: 'success',
          title: 'Profile synced!',
          description: 'Your account is ready to go.',
        });
        router.push('/');
      } else {
        const data = await response.json();
        const message = data.error || 'Failed to create profile';
        setError(message);
        showToast({ variant: 'error', title: message });
        setIsCreatingProfile(false);
      }
    } catch (error) {
      console.error('Error syncing user:', error);
      const message = 'Failed to create profile. Please try again.';
      setError(message);
      showToast({ variant: 'error', title: message });
      setIsCreatingProfile(false);
    }
  };

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
            <Brain className="w-12 h-12 text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to QuizMaster Pro!
        </h1>

        <p className="text-gray-600 mb-2">
          Hi {user.firstName || 'there'}! 👋
        </p>

        <p className="text-gray-600 mb-8">
                        Your profile has been synced. Let&apos;s start your learning journey!
        </p>

        <div className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-4 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">
              What you'll get:
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="mr-2">✅</span>
                <span>Track your quiz history and progress</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✅</span>
                <span>View detailed statistics and insights</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✅</span>
                <span>Compete on the leaderboard</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✅</span>
                <span>Access your data from any device</span>
              </li>
            </ul>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Button
            onClick={handleGetStarted}
            disabled={isCreatingProfile}
            className="w-full h-12 text-lg font-semibold"
          >
            {isCreatingProfile ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Creating Your Profile...
              </>
            ) : (
              'Get Started'
            )}
          </Button>

          <p className="text-xs text-gray-500">
            By continuing, you agree to sync your profile with our database.
          </p>
        </div>
      </div>
    </div>
  );
}
