'use client';

import { cn } from '@/lib/utils';

interface QuestionIndicatorProps {
  totalQuestions: number;
  currentQuestion: number;
  answeredQuestions: Set<number>;
  onQuestionClick?: (index: number) => void;
}

export function QuestionIndicator({
  totalQuestions,
  currentQuestion,
  answeredQuestions,
  onQuestionClick,
}: QuestionIndicatorProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <h3 className="text-sm font-bold text-gray-800 mb-3">Question Navigator</h3>
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: totalQuestions }, (_, i) => (
          <button
            key={`qnav-${i}`}
            onClick={() => onQuestionClick?.(i)}
            className={cn(
              'w-10 h-10 rounded-lg border-2 text-sm font-medium transition-all',
              currentQuestion === i
                ? 'border-blue-500 bg-blue-500 text-white'
                : answeredQuestions.has(i)
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded border-2 border-blue-500 bg-blue-500"></div>
          <span className="text-gray-800 font-semibold">Current</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded border-2 border-green-500 bg-green-50"></div>
          <span className="text-gray-800 font-semibold">Answered</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded border-2 border-gray-300 bg-white"></div>
          <span className="text-gray-800 font-semibold">Not Answered</span>
        </div>
      </div>
    </div>
  );
}
