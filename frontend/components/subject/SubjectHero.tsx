'use client';

import { motion, useReducedMotion } from 'framer-motion';
import dynamic from 'next/dynamic';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

export function SubjectHero({
  subjectName,
  topicsCount,
  questionsCount,
  lottie // optional: pass animationData JSON
}: {
  subjectName: string;
  topicsCount: number;
  questionsCount: number;
  lottie?: any;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 animate-gradient" />
      {!prefersReducedMotion && (
        <>
          <div className="pointer-events-none absolute -top-16 -left-16 h-64 w-64 rounded-full bg-blue-200/60 blur-3xl animate-float" />
          <div className="pointer-events-none absolute -bottom-20 -right-12 h-72 w-72 rounded-full bg-purple-200/60 blur-3xl animate-float [animation-delay:-2s]" />
        </>
      )}

      <div className="relative px-6 py-12 md:px-12 md:py-14">
        <div className="mx-auto grid max-w-6xl grid-cols-1 md:grid-cols-[1fr_minmax(0,720px)_1fr] items-center gap-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="md:col-[2] text-center"
          >
            <span className="inline-flex items-center rounded-full border bg-white/80 px-3 py-1 text-xs font-medium tracking-wide text-gray-700 shadow-sm backdrop-blur dark:bg-gray-800/70 dark:text-gray-200">
              Explore • {topicsCount} topic{topicsCount === 1 ? '' : 's'} • {questionsCount} questions
            </span>

            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-gray-900 md:text-5xl dark:text-gray-100">
              {subjectName}
            </h1>

            <p className="mx-auto mt-3 max-w-xl text-base text-gray-700 dark:text-gray-300">
              Choose a topic or build a custom quiz with multiple sub‑topics.
            </p>
          </motion.div>

          {!prefersReducedMotion && lottie && (
            <div className="hidden md:block md:col-[3]">
              <div className="mx-auto max-w-md">
                <Lottie animationData={lottie} loop autoplay />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
