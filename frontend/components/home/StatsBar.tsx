'use client';

import { useEffect, useRef, type ComponentType, type SVGProps } from 'react';
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'framer-motion';
import { Trophy, BookOpen, Target } from 'lucide-react';

type StatProps = {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  value: number;
};

function Stat({ icon: Icon, label, value }: StatProps) {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const count = useMotionValue(prefersReducedMotion ? value : 0);
  const rounded = useTransform(count, (latest) => Math.round(latest).toLocaleString());

  useEffect(() => {
    if (!isInView || prefersReducedMotion) return;
    const controls = animate(count, value, { duration: 1.2, ease: 'easeOut' });
    return () => controls.stop();
  }, [count, value, isInView, prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) {
      count.set(value);
    }
  }, [count, prefersReducedMotion, value]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex items-center gap-3 rounded-xl border bg-white/80 px-4 py-3 shadow-sm backdrop-blur dark:bg-gray-900/70"
    >
      <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
      <div>
        <div
          aria-label={label}
          className="text-2xl font-bold text-gray-900 dark:text-gray-100"
        >
          {prefersReducedMotion ? (
            value.toLocaleString()
          ) : (
            <>
              <motion.span aria-hidden="true">{rounded}</motion.span>
              <span className="sr-only">{value.toLocaleString()}</span>
            </>
          )}
        </div>
        <div className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</div>
      </div>
    </motion.div>
  );
}

export function StatsBar({
  subjectsCount,
  topicsCount,
  questionsCount,
}: {
  subjectsCount: number;
  topicsCount: number;
  questionsCount: number;
}) {
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-3">
      <Stat icon={BookOpen} label="Subjects" value={subjectsCount} />
      <Stat icon={Target} label="Topics" value={topicsCount} />
      <Stat icon={Trophy} label="Questions" value={questionsCount} />
    </div>
  );
}
