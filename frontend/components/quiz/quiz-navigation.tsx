'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Flag, SkipForward, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

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
  isSubmitting?: boolean;
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
  isSubmitting = false,
}: QuizNavigationProps) {
  return (
    <div className="flex items-center justify-between p-6 bg-white border-t">
      <motion.div whileTap={{ scale: 0.98 }}>
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={isFirstQuestion || isSubmitting}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
      </motion.div>

      <div className="flex items-center gap-2">
        {!hasAnswered && !isLastQuestion && (
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button
              variant="ghost"
              onClick={onSkip}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              <SkipForward className="w-4 h-4" />
              Skip
            </Button>
          </motion.div>
        )}
      </div>

      {isLastQuestion ? (
        <motion.div whileTap={{ scale: 0.98 }}>
          <Button
            onClick={onFinish}
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 min-w-[140px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Flag className="w-4 h-4" />
                Finish Quiz
              </>
            )}
          </Button>
        </motion.div>
      ) : (
        <motion.div whileTap={{ scale: 0.98 }}>
          <Button
            onClick={onNext}
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </motion.div>
      )}
    </div>
  );
}
