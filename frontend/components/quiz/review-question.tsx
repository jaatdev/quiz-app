'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CheckCircle, XCircle, Info, Target } from 'lucide-react';
import type { QuestionWithAnswer } from '@/types';
import { cn } from '@/lib/utils';

interface ReviewQuestionProps {
  question: QuestionWithAnswer;
  userAnswer?: string;
  questionNumber: number;
}

export function ReviewQuestion({
  question,
  userAnswer,
  questionNumber,
}: ReviewQuestionProps) {
  const isCorrect = userAnswer === question.correctAnswerId;
  const isSkipped = !userAnswer;
  const userAnswerOption = question.options.find((option) => option.id === userAnswer);
  const correctAnswerOption = question.options.find((option) => option.id === question.correctAnswerId);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">
            Question {questionNumber}
          </span>
          {isCorrect ? (
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle className="w-4 h-4" />
              Correct
            </span>
          ) : isSkipped ? (
            <span className="flex items-center gap-1 text-gray-500">
              <Target className="w-4 h-4" />
              Skipped
            </span>
          ) : (
            <span className="flex items-center gap-1 text-red-600">
              <XCircle className="w-4 h-4" />
              Incorrect
            </span>
          )}
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{question.text}</h3>
        {typeof question.pyq === 'string' && question.pyq.trim().length > 0 && (
          <span className="mt-3 inline-flex items-center gap-2 self-start rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            PYQ: {question.pyq.trim()}
          </span>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3 mb-4">
          {question.options.map((option) => {
            const isUserAnswer = userAnswer === option.id;
            const isCorrectAnswer = question.correctAnswerId === option.id;

            return (
              <div
                key={option.id}
                className={cn(
                  'p-4 rounded-lg border-2 transition-all',
                  isCorrectAnswer && 'border-green-600 bg-green-100 shadow-sm',
                  isUserAnswer && !isCorrectAnswer && 'border-red-600 bg-red-100 shadow-sm',
                  !isCorrectAnswer && !isUserAnswer && 'border-gray-300 bg-white'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "font-bold text-sm flex items-center justify-center w-8 h-8 rounded-full border-2",
                      isCorrectAnswer && 'border-green-700 text-green-800',
                      isUserAnswer && !isCorrectAnswer && 'border-red-700 text-red-800',
                      !isCorrectAnswer && !isUserAnswer && 'border-gray-500 text-gray-700'
                    )}>
                      {option.id.toUpperCase()}
                    </span>
                    <span className={cn(
                      "font-medium",
                      isCorrectAnswer && 'text-green-900',
                      isUserAnswer && !isCorrectAnswer && 'text-red-900',
                      !isCorrectAnswer && !isUserAnswer && 'text-gray-800'
                    )}>{option.text}</span>
                  </div>
                  {isCorrectAnswer && (
                    <CheckCircle className="w-6 h-6 text-green-700 flex-shrink-0" />
                  )}
                  {isUserAnswer && !isCorrectAnswer && (
                    <XCircle className="w-6 h-6 text-red-700 flex-shrink-0" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div
            className={cn(
              'rounded-lg border-2 p-4 transition-colors',
              isSkipped
                ? 'border-gray-300 bg-white'
                : isCorrect
                ? 'border-green-500 bg-green-50'
                : 'border-red-500 bg-red-50'
            )}
          >
            <p className="text-sm font-medium text-gray-600">Your answer</p>
            <p
              className={cn(
                'mt-2 text-base font-semibold',
                isSkipped
                  ? 'text-gray-600'
                  : isCorrect
                  ? 'text-green-700'
                  : 'text-red-700'
              )}
            >
              {isSkipped ? 'Not answered' : userAnswerOption?.text ?? 'Not answered'}
            </p>
          </div>
          <div className="rounded-lg border-2 border-green-500 bg-green-50 p-4">
            <p className="text-sm font-medium text-gray-600">Correct answer</p>
            <p className="mt-2 text-base font-semibold text-green-700">
              {correctAnswerOption?.text ?? 'Unavailable'}
            </p>
          </div>
        </div>

        {question.explanation && (
          <div className="bg-blue-100 border-2 border-blue-400 rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <Info className="w-6 h-6 text-blue-700 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold text-blue-900 mb-2">Explanation</p>
                <p className="text-blue-900 leading-relaxed">{question.explanation}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
