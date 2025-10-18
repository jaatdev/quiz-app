'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp, Target, Globe } from 'lucide-react';
import { quizRecommendationService, QuizRecommendation } from '@/src/services/quizRecommendations';
import { LanguageCode } from '@/lib/i18n/config';

interface RecommendationsContainerProps {
  userId: string;
  variant?: 'personalized' | 'trending' | 'progression' | 'category';
  category?: string;
  language?: LanguageCode;
  limit?: number;
}

const difficultyColors = {
  easy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
  hard: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
};

const variantIcons = {
  personalized: <Sparkles className="w-5 h-5" />,
  trending: <TrendingUp className="w-5 h-5" />,
  progression: <Target className="w-5 h-5" />,
  category: <Globe className="w-5 h-5" />
};

const variantTitles = {
  personalized: 'Recommended For You',
  trending: 'Trending Now',
  progression: 'Perfect for Your Level',
  category: 'Category Highlights'
};

export const RecommendationsContainer: React.FC<RecommendationsContainerProps> = ({
  userId,
  variant = 'personalized',
  category,
  language,
  limit = 6
}) => {
  const [recommendations, setRecommendations] = useState<QuizRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);

        let data: QuizRecommendation[] = [];

        switch (variant) {
          case 'personalized':
            data = await quizRecommendationService.getRecommendations(userId, limit, language);
            break;
          case 'trending':
            data = await quizRecommendationService.getTrendingQuizzes(limit, language);
            break;
          case 'progression':
            data = await quizRecommendationService.getProgressionQuizzes(userId, limit);
            break;
          case 'category':
            if (!category) {
              setError('Category is required for category recommendations');
              return;
            }
            data = await quizRecommendationService.getCategoryRecommendations(userId, category, limit);
            break;
          default:
            data = await quizRecommendationService.getRecommendations(userId, limit, language);
        }

        setRecommendations(data);
      } catch (err) {
        setError('Failed to load recommendations');
        console.error('Recommendations error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [userId, variant, category, language, limit]);

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-6">
        <div className="text-blue-500 dark:text-blue-400">{variantIcons[variant]}</div>
        <h2 className="text-2xl font-bold">{variantTitles[variant]}</h2>
        {recommendations.length > 0 && (
          <span className="ml-auto text-sm text-gray-600 dark:text-gray-400">
            {recommendations.length} quiz{recommendations.length !== 1 ? 'zes' : ''}
          </span>
        )}
      </div>

      {error && (
        <div className="p-4 mb-4 rounded-lg bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
          {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {[...Array(limit)].map((_, i) => (
              <div
                key={`skeleton-${variant}-${i}`}
                className="h-64 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"
              />
            ))}
          </motion.div>
        ) : recommendations.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {recommendations.map((quiz, index) => (
              <motion.div
                key={quiz.quizId}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/quiz/multilingual/${quiz.quizId}`}>
                  <motion.div
                    whileHover={{ translateY: -4 }}
                    className="h-full p-5 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition-colors bg-white dark:bg-gray-800"
                  >
                    {/* Match Score Badge */}
                    <div className="absolute top-3 right-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                        {quiz.matchScore}%
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-lg mb-2 pr-12 line-clamp-2">{quiz.title}</h3>

                    {/* Category & Language */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-700">
                        {quiz.category}
                      </span>
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100">
                        {quiz.language.toUpperCase()}
                      </span>
                    </div>

                    {/* Difficulty */}
                    <div className="mb-3">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${difficultyColors[quiz.difficulty as keyof typeof difficultyColors]}`}>
                        {quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}
                      </span>
                    </div>

                    {/* Reason */}
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {quiz.reason}
                    </p>

                    {/* Time Estimate */}
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>⏱️ {quiz.estimatedTime} min</span>
                      <span className="text-blue-500 font-semibold hover:underline">Start Quiz →</span>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-8"
          >
            <p className="text-gray-600 dark:text-gray-400 mb-2">No quizzes available</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Try adjusting your filters or explore more categories
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RecommendationsContainer;
