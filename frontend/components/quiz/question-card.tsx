'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';
import type { Question, Option } from '@/types';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  selectedAnswer?: string;
  onAnswerSelect: (optionId: string) => void;
  showFeedback?: boolean;
  correctAnswerId?: string;
  disabled?: boolean;
}

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  onAnswerSelect,
  showFeedback = false,
  correctAnswerId,
  disabled = false,
}: QuestionCardProps) {
  const [localSelected, setLocalSelected] = useState<string | undefined>(selectedAnswer);

  useEffect(() => {
    setLocalSelected(selectedAnswer);
  }, [selectedAnswer]);

  const handleSelect = (optionId: string) => {
    if (disabled) return;
    setLocalSelected(optionId);
    onAnswerSelect(optionId);
  };

  const getOptionClass = (optionId: string) => {
    const isSelected = localSelected === optionId;
    
    if (showFeedback && correctAnswerId) {
      const isCorrect = optionId === correctAnswerId;
      const wasSelected = localSelected === optionId;
      
      if (isCorrect) {
        return 'border-green-600 bg-green-100 text-green-900 font-medium';
      }
      if (wasSelected && !isCorrect) {
        return 'border-red-600 bg-red-100 text-red-900 font-medium';
      }
    }
    
    if (isSelected && !showFeedback) {
      return 'border-blue-600 bg-blue-100 text-blue-900 font-medium shadow-sm';
    }
    
    return 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50 hover:shadow-sm text-gray-800';
  };

  const getOptionIcon = (optionId: string) => {
    if (!showFeedback || !correctAnswerId) return null;
    
    const isCorrect = optionId === correctAnswerId;
    const wasSelected = localSelected === optionId;
    
    if (isCorrect) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
    if (wasSelected && !isCorrect) {
      return <XCircle className="w-5 h-5 text-red-600" />;
    }
    
    return null;
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-600">
            Question {questionNumber} of {totalQuestions}
          </span>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            {localSelected ? 'Answered' : 'Not Answered'}
          </span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">{question.text}</h2>
        {typeof question.pyq === 'string' && question.pyq.trim().length > 0 && (
          <span className="mt-3 inline-flex items-center gap-2 self-start rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            PYQ: {question.pyq.trim()}
          </span>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {question.options.map((option) => (
            <motion.button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              disabled={disabled}
              whileHover={{ scale: disabled ? 1 : 1.01 }}
              whileTap={{ scale: disabled ? 1 : 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={cn(
                'w-full p-4 text-left rounded-lg border-2 transition-all duration-200',
                'flex items-center justify-between',
                getOptionClass(option.id),
                disabled && 'cursor-not-allowed opacity-60'
              )}
            >
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-current font-bold text-sm">
                  {option.id.toUpperCase()}
                </span>
                <span className="text-base font-medium">{option.text}</span>
              </div>
              {getOptionIcon(option.id)}
            </motion.button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
