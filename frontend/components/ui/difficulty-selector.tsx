'use client';

import { useState, useEffect } from 'react';
import { Card } from './card';
import { Lock, Zap, Target, TrendingUp, Sparkles } from 'lucide-react';

export interface DifficultyLevel {
  id: 'easy' | 'medium' | 'hard' | 'adaptive';
  name: string;
  description: string;
  pointsMultiplier: number;
  unlockPoints: number;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
}

const difficulties: DifficultyLevel[] = [
  {
    id: 'easy',
    name: 'Easy',
    description: 'Perfect for beginners',
    pointsMultiplier: 1,
    unlockPoints: 0,
    icon: Target,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-500',
  },
  {
    id: 'medium',
    name: 'Medium',
    description: 'Standard difficulty',
    pointsMultiplier: 1.5,
    unlockPoints: 0,
    icon: Zap,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-500',
  },
  {
    id: 'hard',
    name: 'Hard',
    description: 'For experienced learners',
    pointsMultiplier: 2,
    unlockPoints: 100,
    icon: TrendingUp,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-500',
  },
  {
    id: 'adaptive',
    name: 'Adaptive',
    description: 'Adjusts to your performance',
    pointsMultiplier: 2.5,
    unlockPoints: 200,
    icon: Sparkles,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-500',
  },
];

interface DifficultySelectorProps {
  onSelect: (difficulty: DifficultyLevel) => void;
  selected?: 'easy' | 'medium' | 'hard' | 'adaptive';
}

export function DifficultySelector({ onSelect, selected = 'easy' }: DifficultySelectorProps) {
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    // Load total points from quiz history
    const stored = localStorage.getItem('quiz-history');
    if (stored) {
      const history = JSON.parse(stored);
      const points = history.reduce((acc: number, attempt: any) => acc + attempt.percentage, 0);
      setTotalPoints(Math.floor(points));
    }
  }, []);

  const isUnlocked = (difficulty: DifficultyLevel) => {
    return totalPoints >= difficulty.unlockPoints;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {difficulties.map((difficulty) => {
        const Icon = difficulty.icon;
        const unlocked = isUnlocked(difficulty);
        const isSelected = selected === difficulty.id;

        return (
          <Card
            key={difficulty.id}
            className={`cursor-pointer transition-all hover:scale-105 border-2 ${
              isSelected
                ? `${difficulty.bgColor} ${difficulty.borderColor} shadow-lg`
                : unlocked
                ? 'bg-white hover:bg-gray-50 border-gray-300'
                : 'bg-gray-100 border-gray-300 opacity-60 cursor-not-allowed'
            }`}
            onClick={() => unlocked && onSelect(difficulty)}
          >
            <div className="p-6">
              {/* Icon and Lock */}
              <div className="flex items-center justify-between mb-4">
                <div className={`${unlocked ? difficulty.color : 'text-gray-400'}`}>
                  <Icon className="w-8 h-8" />
                </div>
                {!unlocked && (
                  <Lock className="w-5 h-5 text-gray-500" />
                )}
              </div>

              {/* Title */}
              <h3 className={`text-xl font-bold mb-2 ${
                isSelected ? difficulty.color : 'text-gray-900'
              }`}>
                {difficulty.name}
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-700 font-semibold mb-3">
                {difficulty.description}
              </p>

              {/* Multiplier */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-700">
                  Points: {difficulty.pointsMultiplier}x
                </span>
                {!unlocked && (
                  <span className="text-xs font-bold text-gray-600">
                    Unlock: {difficulty.unlockPoints} pts
                  </span>
                )}
              </div>

              {/* Progress bar for locked difficulties */}
              {!unlocked && (
                <div className="mt-3">
                  <div className="w-full bg-gray-300 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min((totalPoints / difficulty.unlockPoints) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 font-semibold mt-1">
                    {totalPoints} / {difficulty.unlockPoints} points
                  </p>
                </div>
              )}

              {/* Selected indicator */}
              {isSelected && (
                <div className="mt-3 flex items-center justify-center">
                  <span className={`text-sm font-bold ${difficulty.color}`}>
                    ✓ Selected
                  </span>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export default DifficultySelector;
