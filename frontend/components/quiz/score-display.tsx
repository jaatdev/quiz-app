'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Target, XCircle, CheckCircle } from 'lucide-react';
import { calculateGrade } from '@/lib/utils';

interface ScoreDisplayProps {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  timeSpent?: number;
}

export function ScoreDisplay({
  score,
  totalQuestions,
  correctAnswers,
  percentage,
  timeSpent,
}: ScoreDisplayProps) {
  const { grade, color } = calculateGrade(percentage);
  const incorrectAnswers = totalQuestions - correctAnswers;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          <Trophy className="w-16 h-16 text-yellow-500" />
        </div>
        <CardTitle className="text-3xl">Quiz Completed!</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-8">
          <div className={`text-6xl font-bold mb-2 ${color}`}>
            {grade}
          </div>
          <div className="text-2xl font-semibold text-gray-900">
            {score.toFixed(2)} / {totalQuestions}
          </div>
          <div className="text-lg text-gray-600">
            {percentage.toFixed(1)}%
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">Correct</span>
            </div>
            <p className="text-2xl font-bold text-green-700">{correctAnswers}</p>
          </div>

          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-red-900">Incorrect</span>
            </div>
            <p className="text-2xl font-bold text-red-700">{incorrectAnswers}</p>
          </div>
        </div>

        {timeSpent && (
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Time Spent</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">
              {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
