'use client';

import { useEffect, useState } from 'react';
import { formatTime } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface TimerProps {
  duration: number; // in seconds
  onTimeUp?: () => void;
  isPaused?: boolean;
}

export function Timer({ duration, onTimeUp, isPaused = false }: TimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(duration);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          onTimeUp?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, onTimeUp]);

  // Reset when duration changes
  useEffect(() => {
    setTimeRemaining(duration);
  }, [duration]);

  const percentage = (timeRemaining / duration) * 100;
  const isLowTime = timeRemaining <= 30;
  const isCritical = timeRemaining <= 10;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock className={`w-5 h-5 ${isCritical ? 'text-red-600 animate-pulse' : isLowTime ? 'text-orange-500' : 'text-gray-600'}`} />
          <span className="text-sm font-medium text-gray-600">Time Remaining</span>
        </div>
        <span className={`text-lg font-bold ${isCritical ? 'text-red-600' : isLowTime ? 'text-orange-500' : 'text-gray-900'}`}>
          {formatTime(timeRemaining)}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ease-linear ${
            isCritical ? 'bg-red-600' : isLowTime ? 'bg-orange-500' : 'bg-blue-600'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
