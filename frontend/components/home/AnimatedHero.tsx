'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export function AnimatedHero() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
      {/* Animated gradient backdrop */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 animate-gradient" />

      {/* Floating soft blobs */}
      {!prefersReducedMotion && (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-16 -left-16 h-64 w-64 rounded-full bg-blue-200/60 blur-3xl animate-float"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-20 -right-12 h-72 w-72 rounded-full bg-purple-200/60 blur-3xl animate-float [animation-delay:-2s]"
          />
        </>
      )}

      <div className="relative px-6 py-16 md:px-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center rounded-full border bg-white/80 px-3 py-1 text-xs font-medium tracking-wide text-gray-700 shadow-sm backdrop-blur dark:bg-gray-800/70 dark:text-gray-200">
            New • PYQ tagging + Admin structured questions + Bulk topics
          </span>

          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-gray-900 md:text-6xl dark:text-gray-100">
            Master Any Topic with Beautiful, Interactive Quizzes
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-700 dark:text-gray-300">
            Smart randomization, PYQ insights, powerful analytics, and an elegant interface built for speed.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button className="h-11 px-6" onClick={() => router.push('/stats')}>
              View Your Stats
            </Button>
            <Button
              variant="outline"
              className="h-11 px-6"
              onClick={() => router.push('/leaderboard')}
            >
              Explore Leaderboard
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
