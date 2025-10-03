'use client';

import { useUser, useClerk, SignInButton } from '@clerk/nextjs';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './button';
import { LogOut, BarChart3, History, Trophy } from 'lucide-react';

export function UserButton() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  if (!isLoaded) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
    );
  }

  if (!user) {
    return (
      <SignInButton mode="modal">
        <Button size="sm">Sign In</Button>
      </SignInButton>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <img
          src={user.imageUrl}
          alt={user.firstName || 'User'}
          className="w-8 h-8 rounded-full border-2 border-gray-200"
        />
        <span className="hidden md:block text-sm font-medium text-gray-700">
          {user.firstName}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border z-20">
            <div className="p-3 border-b">
              <p className="font-medium text-gray-900">{user.fullName}</p>
              <p className="text-sm text-gray-600">{user.primaryEmailAddress?.emailAddress}</p>
            </div>
            <div className="p-2">
              <button
                onClick={() => {
                  router.push('/stats');
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-md text-left text-gray-700"
              >
                <BarChart3 className="w-4 h-4" />
                My Stats
              </button>
              <button
                onClick={() => {
                  router.push('/history');
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-md text-left text-gray-700"
              >
                <History className="w-4 h-4" />
                My Quizzes
              </button>
              <button
                onClick={() => {
                  router.push('/leaderboard');
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-md text-left text-gray-700"
              >
                <Trophy className="w-4 h-4" />
                Leaderboard
              </button>
              <hr className="my-2" />
              <button
                onClick={() => signOut()}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-md text-left text-red-600"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
