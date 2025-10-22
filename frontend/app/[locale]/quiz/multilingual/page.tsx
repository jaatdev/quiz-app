'use client';

import { useState, useEffect } from 'react';
import { ProtectedPageLayout } from '@/components/ProtectedPageLayout';
import { MultilingualQuizPage } from '@/src/components/quiz/MultilingualQuizPage';
import type { MultilingualQuiz } from '@/lib/data/multilingualQuizzes';
import type { LanguageCode } from '@/lib/i18n/config';
import { useAuth } from '@clerk/nextjs';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export default function MultilingualQuizListPage() {
  const [selectedQuiz, setSelectedQuiz] = useState<MultilingualQuiz | null>(null);
  const [quizzes, setQuizzes] = useState<MultilingualQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const token = await getToken();
        const response = await fetch(`${API_BASE_URL}/quizzes/multilingual`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch quizzes');
        }

        const result = await response.json();
        setQuizzes(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, [getToken]);

  if (selectedQuiz) {
    return <MultilingualQuizPage quiz={selectedQuiz} />;
  }

  if (loading) {
    return (
      <ProtectedPageLayout>
        <div className="min-h-screen flex items-center justify-center">
          <p>Loading quizzes...</p>
        </div>
      </ProtectedPageLayout>
    );
  }

  if (error) {
    return (
      <ProtectedPageLayout>
        <div className="min-h-screen flex items-center justify-center">
          <p>Error: {error}</p>
        </div>
      </ProtectedPageLayout>
    );
  }

  return (
    <ProtectedPageLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            🌍 Multilingual Quizzes
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-300 text-lg mb-12">
            Take quizzes in your preferred language
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quizzes.map((quiz: MultilingualQuiz) => (
              <div
                key={quiz.id}
                onClick={() => setSelectedQuiz(quiz)}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group overflow-hidden"
              >
                <div className="relative p-8 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b-2 border-gray-100 dark:border-gray-700">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 transition-colors">
                    {quiz.title['en']}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {quiz.description['en']}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-gray-700 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{quiz.questions.length}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Questions</div>
                    </div>
                    <div className="bg-white dark:bg-gray-700 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {quiz.availableLanguages.length}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Languages</div>
                    </div>
                    <div className="bg-white dark:bg-gray-700 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-pink-600">{quiz.difficulty}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Level</div>
                    </div>
                  </div>
                </div>

                {/* Languages */}
                <div className="p-8">
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
                    Available Languages:
                  </p>
                  <div className="flex gap-3 flex-wrap">
                    {quiz.availableLanguages.map((lang: LanguageCode) => {
                      const langMap = {
                        en: { flag: '🇺🇸', name: 'English' },
                        hi: { flag: '🇮🇳', name: 'Hindi' },
                        es: { flag: '🇪🇸', name: 'Español' },
                        fr: { flag: '🇫🇷', name: 'Français' },
                      };
                      const info = langMap[lang as keyof typeof langMap];
                      return (
                        <span
                          key={lang}
                          className="px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 rounded-full text-sm font-medium text-gray-900 dark:text-white"
                        >
                          {info.flag} {info.name}
                        </span>
                      );
                    })}
                  </div>

                  {/* Start Button */}
                  <button className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 group-hover:from-blue-700 group-hover:to-purple-700">
                    Take Quiz 🚀
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ProtectedPageLayout>
  );
}
