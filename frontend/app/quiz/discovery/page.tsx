'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { FilterBar, FilterState } from '@/src/components/i18n/FilterBar';
import { RecommendationsContainer } from '@/src/components/i18n/RecommendationsContainer';
import { LanguageCode } from '@/lib/i18n/config';

interface Quiz {
  id: string;
  title: Record<string, string>;
  description: Record<string, string>;
  category: string;
  difficulty: string;
  timeLimit: number;
  availableLanguages: LanguageCode[];
  tags?: string[];
}

export default function DiscoveryPage() {
  const { user } = useUser();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    difficulty: [],
    languages: [],
    tags: [],
    dateRange: { from: null, to: null },
    scoreRange: { min: 0, max: 100 }
  });
  const [allTags, setAllTags] = useState<string[]>([]);

  // Fetch available tags
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await fetch('/api/quizzes/multilingual/tags');
        if (res.ok) {
          const data = await res.json();
          setAllTags(data.tags || []);
        }
      } catch (err) {
        console.error('Failed to fetch tags:', err);
      }
    };

    fetchTags();
  }, []);

  // Fetch quizzes with filters
  const fetchQuizzes = useCallback(async () => {
    try {
      setLoading(true);

      // Build query parameters
      const params = new URLSearchParams();

      if (filters.search) params.append('search', filters.search);
      if (filters.difficulty.length > 0) params.append('difficulty', filters.difficulty.join(','));
      if (filters.languages.length > 0) params.append('language', filters.languages.join(','));
      if (filters.tags.length > 0) params.append('tags', filters.tags.join(','));
      if (filters.scoreRange.min > 0 || filters.scoreRange.max < 100) {
        params.append('scoreMin', filters.scoreRange.min.toString());
        params.append('scoreMax', filters.scoreRange.max.toString());
      }
      if (filters.dateRange.from) {
        params.append('dateFrom', filters.dateRange.from.toISOString().split('T')[0]);
      }
      if (filters.dateRange.to) {
        params.append('dateTo', filters.dateRange.to.toISOString().split('T')[0]);
      }

      const res = await fetch(`/api/quizzes/multilingual?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(user?.id && { 'x-clerk-user-id': user.id })
        }
      });

      if (res.ok) {
        const data = await res.json();
        setQuizzes(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch quizzes:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, user?.id]);

  // Fetch quizzes when filters change
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchQuizzes();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [filters, fetchQuizzes]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Discover Quizzes</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Find and explore quizzes that match your interests and skill level
          </p>
        </motion.div>

        {/* Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <FilterBar
            onFilterChange={setFilters}
            availableTags={allTags}
            showAdvanced={true}
          />
        </motion.div>

        {/* Recommendations Section */}
        {user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold mb-6">Recommended For You</h2>
            <RecommendationsContainer
              userId={user.id}
              variant="personalized"
              limit={6}
            />
          </motion.div>
        )}

        {/* Search Results */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              {filters.search || filters.difficulty.length > 0 || filters.languages.length > 0
                ? 'Search Results'
                : 'All Quizzes'}
            </h2>
            {!loading && quizzes.length > 0 && (
              <p className="text-gray-600 dark:text-gray-400">
                {quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''} found
              </p>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-48 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"
                />
              ))}
            </div>
          ) : quizzes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz, index) => (
                <motion.a
                  key={quiz.id}
                  href={`/quiz/multilingual/${quiz.id}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ translateY: -4 }}
                  className="p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-500 transition cursor-pointer"
                >
                  <h3 className="text-lg font-bold mb-2">
                    {quiz.title.en || Object.values(quiz.title)[0]}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {quiz.description.en || Object.values(quiz.description)[0]}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-3 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 font-semibold">
                      {quiz.category}
                    </span>
                    <span
                      className={`px-3 py-1 text-xs rounded-full font-semibold ${
                        quiz.difficulty === 'easy'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                          : quiz.difficulty === 'medium'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                      }`}
                    >
                      {quiz.difficulty}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      ⏱️ {quiz.timeLimit} min
                    </span>
                    <span className="text-blue-500 font-semibold">Start →</span>
                  </div>
                </motion.a>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 mb-2">No quizzes found</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Try adjusting your filters or search terms
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
