'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { UserButton } from '@/components/ui/user-button';
import { Brain, Lock } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useState } from 'react';
import { AuthModal } from '@/components/AuthModal';

interface NavItem {
  label: string;
  href: string;
  protected?: boolean;
}

const nav: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Stats', href: '/stats', protected: true },
  { label: 'History', href: '/history', protected: true },
  { label: 'Leaderboard', href: '/leaderboard', protected: true },
  { label: 'Admin', href: '/admin', protected: true },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { isSignedIn, isLoaded, user, displayName } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  
  // Check if user is admin
  const isAdmin = user?.publicMetadata?.role === 'admin';

  const handleProtectedClick = (e: React.MouseEvent, item: NavItem) => {
    if (item.protected && !isSignedIn) {
      e.preventDefault();
      setAuthMessage(`Please login to access ${item.label}`);
      setShowAuthModal(true);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur dark:bg-gray-900/80">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              aria-label="QuizMaster Pro"
            >
              <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-bold tracking-wide text-gray-900 dark:text-gray-100">
                QuizMaster Pro
              </span>
            </button>

            <nav className="hidden md:flex items-center gap-1 ml-6">
              {nav.map((item) => {
                const active =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(item.href);
                const isProtected = item.protected && !isSignedIn;

                return (
                  <button
                    key={item.href}
                    onClick={(e) => {
                      if (item.protected && !isSignedIn) {
                        handleProtectedClick(e, item);
                      } else {
                        router.push(item.href);
                      }
                    }}
                    className={cn(
                      'rounded-md px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 relative',
                      isProtected
                        ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed hover:text-gray-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
                      active && !isProtected && 'text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800'
                    )}
                    disabled={isProtected}
                  >
                    {item.label}
                    {isProtected && (
                      <Lock className="w-3.5 h-3.5 text-red-500" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {!isLoaded && (
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            )}
            {isLoaded && isSignedIn && (
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <span className="px-2 py-1 bg-gradient-to-r from-red-100 to-orange-100 dark:from-red-900 dark:to-orange-900 text-red-700 dark:text-red-200 text-xs font-bold rounded-full border border-red-300 dark:border-red-700 flex items-center gap-1">
                    ⚡ Admin
                  </span>
                )}
                <span className="hidden sm:inline text-xs font-medium text-gray-700 dark:text-gray-300">
                  {displayName}
                </span>
              </div>
            )}
            {isLoaded && <UserButton />}
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        message={authMessage}
      />
    </>
  );
}
