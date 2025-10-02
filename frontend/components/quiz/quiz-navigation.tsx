'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Flag, SkipForward } from 'lucide-react';

interface QuizNavigationProps {
  currentQuestion: number;
  totalQuestions: number;
  hasAnswered: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSkip: () => void;
  onFinish: () => void;
  isLastQuestion: boolean;
  isFirstQuestion: boolean;
}

export function QuizNavigation({
  currentQuestion,
  totalQuestions,
  hasAnswered,
  onPrevious,
  onNext,
  onSkip,
  onFinish,
  isLastQuestion,
  isFirstQuestion,
}: QuizNavigationProps) {
  return (
    <div className="flex items-center justify-between p-6 bg-white border-t">
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={isFirstQuestion}
        className="flex items-center gap-2"
      >
        <ChevronLeft className="w-4 h-4" />
        Previous
      </Button>

      <div className="flex items-center gap-2">
        {!hasAnswered && !isLastQuestion && (
          <Button
            variant="ghost"
            onClick={onSkip}
            className="flex items-center gap-2"
          >
            <SkipForward className="w-4 h-4" />
            Skip
          </Button>
        )}
      </div>

      {isLastQuestion ? (
        <Button
          onClick={onFinish}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
        >
          <Flag className="w-4 h-4" />
          Finish Quiz
        </Button>
      ) : (
        <Button
          onClick={onNext}
          className="flex items-center gap-2"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
