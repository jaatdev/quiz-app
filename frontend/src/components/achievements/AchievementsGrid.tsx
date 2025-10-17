'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Zap, BookOpen, Globe, TrendingUp } from 'lucide-react';

export interface Achievement {
  id: string;
  type: 'first_quiz' | 'perfect_score' | 'polyglot' | 'speed_demon' | 'subject_master' | 'streak_5' | 'global_learner';
  title: string;
  description: string;
  icon: React.ReactNode;
  unlockedAt?: Date;
  progress?: number;
  maxProgress?: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

const ACHIEVEMENT_DEFINITIONS: Record<Achievement['type'], Omit<Achievement, 'id' | 'unlockedAt' | 'progress' | 'maxProgress'>> = {
  first_quiz: {
    type: 'first_quiz',
    title: 'Getting Started',
    description: 'Complete your first quiz',
    icon: <BookOpen className="w-6 h-6" />,
    rarity: 'common'
  },
  perfect_score: {
    type: 'perfect_score',
    title: 'Perfect Score',
    description: 'Score 100% on a quiz',
    icon: <Star className="w-6 h-6" />,
    rarity: 'epic'
  },
  polyglot: {
    type: 'polyglot',
    title: 'Polyglot',
    description: 'Complete quizzes in all 4 languages',
    icon: <Globe className="w-6 h-6" />,
    rarity: 'legendary'
  },
  speed_demon: {
    type: 'speed_demon',
    title: 'Speed Demon',
    description: 'Complete a quiz in under 2 minutes',
    icon: <Zap className="w-6 h-6" />,
    rarity: 'rare'
  },
  subject_master: {
    type: 'subject_master',
    title: 'Subject Master',
    description: 'Maintain 90%+ average on 10 quizzes',
    icon: <TrendingUp className="w-6 h-6" />,
    rarity: 'epic'
  },
  streak_5: {
    type: 'streak_5',
    title: 'On Fire',
    description: 'Complete 5 quizzes in a row',
    icon: <Trophy className="w-6 h-6" />,
    rarity: 'rare'
  },
  global_learner: {
    type: 'global_learner',
    title: 'Global Learner',
    description: 'Earn 100+ points in each language',
    icon: <Globe className="w-6 h-6" />,
    rarity: 'legendary'
  }
};

const rarityColors = {
  common: 'from-gray-400 to-gray-500',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-yellow-400 to-yellow-600'
};

const rarityBorders = {
  common: 'border-gray-400',
  rare: 'border-blue-400',
  epic: 'border-purple-400',
  legendary: 'border-yellow-400'
};

interface AchievementsGridProps {
  unlockedAchievements: Achievement['type'][];
  inProgressAchievements?: Record<Achievement['type'], { progress: number; maxProgress: number }>;
}

export const AchievementsGrid: React.FC<AchievementsGridProps> = ({
  unlockedAchievements,
  inProgressAchievements = {}
}) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    const all: Achievement[] = Object.entries(ACHIEVEMENT_DEFINITIONS).map(([type, def]) => {
      const isUnlocked = unlockedAchievements.includes(type as Achievement['type']);
      const progress = inProgressAchievements[type as Achievement['type']];

      return {
        id: type,
        ...(def as any),
        unlockedAt: isUnlocked ? new Date() : undefined,
        progress: progress?.progress,
        maxProgress: progress?.maxProgress
      };
    });

    setAchievements(all);
  }, [unlockedAchievements, inProgressAchievements]);

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Achievements</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {unlockedAchievements.length} of {Object.keys(ACHIEVEMENT_DEFINITIONS).length} unlocked
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {achievements.map((achievement) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`relative p-4 rounded-lg border-2 transition-all ${
                achievement.unlockedAt
                  ? `${rarityBorders[achievement.rarity]} bg-gradient-to-br ${rarityColors[achievement.rarity]} bg-opacity-10 dark:bg-opacity-20`
                  : 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800'
              }`}
            >
              {/* Locked Overlay */}
              {!achievement.unlockedAt && (
                <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🔒</span>
                </div>
              )}

              {/* Unlocked Badge */}
              {achievement.unlockedAt && (
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="absolute -top-2 -right-2 bg-green-500 rounded-full p-2"
                >
                  <Trophy className="w-4 h-4 text-white" />
                </motion.div>
              )}

              {/* Icon */}
              <div
                className={`flex items-center justify-center w-12 h-12 rounded-lg mb-3 ${
                  achievement.unlockedAt
                    ? `bg-gradient-to-br ${rarityColors[achievement.rarity]} text-white`
                    : 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                {achievement.icon}
              </div>

              {/* Title & Description */}
              <h3
                className={`font-bold text-sm mb-1 ${
                  achievement.unlockedAt ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {achievement.title}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{achievement.description}</p>

              {/* Progress Bar */}
              {achievement.progress !== undefined && achievement.maxProgress !== undefined && (
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                    className="bg-gradient-to-r from-blue-400 to-blue-600 h-full"
                  />
                </div>
              )}

              {/* Rarity Badge */}
              <div className="mt-3 text-xs font-semibold">
                <span
                  className={`px-2 py-1 rounded-full ${
                    achievement.rarity === 'common'
                      ? 'bg-gray-300 text-gray-700'
                      : achievement.rarity === 'rare'
                        ? 'bg-blue-300 text-blue-700'
                        : achievement.rarity === 'epic'
                          ? 'bg-purple-300 text-purple-700'
                          : 'bg-yellow-300 text-yellow-700'
                  }`}
                >
                  {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AchievementsGrid;
