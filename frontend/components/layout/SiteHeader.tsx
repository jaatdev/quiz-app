'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { UserButton } from '@/components/ui/user-button';
import { Brain } from 'lucide-react';

const nav = [
  { label: 'Home', href: '/' },
  { label: 'Stats', href: '/stats' },
  { label: 'History', href: '/history' },
  { label: 'Leaderboard', href: '/leaderboard' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur dark:bg-gray-900/80">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2"
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
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
                    active && 'text-gray-900 dark:text-gray-100'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* Optional: search shortcut in header (mobile only) */}
          {/* <button className="md:hidden rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
            Search
          </button> */}
          <UserButton />
        </div>
      </div>
    </header>
  );
}
