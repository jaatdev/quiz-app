import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function calculateGrade(percentage: number): {
  grade: string;
  color: string;
} {
  if (percentage >= 90) return { grade: 'A+', color: 'text-green-600' };
  if (percentage >= 80) return { grade: 'A', color: 'text-green-500' };
  if (percentage >= 70) return { grade: 'B', color: 'text-blue-600' };
  if (percentage >= 60) return { grade: 'C', color: 'text-yellow-600' };
  if (percentage >= 50) return { grade: 'D', color: 'text-orange-600' };
  return { grade: 'F', color: 'text-red-600' };
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
