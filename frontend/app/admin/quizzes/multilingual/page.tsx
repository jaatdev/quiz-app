'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ProtectedPageLayout } from '@/components/ProtectedPageLayout';
import { AdminQuizForm } from '@/src/components/i18n/AdminQuizForm';
import { multilingualQuizzes } from '@/lib/data/multilingualQuizzes';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, Plus, Upload } from 'lucide-react';
import Link from 'next/link';
import type { MultilingualQuiz } from '@/lib/data/multilingualQuizzes';

export default function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState<MultilingualQuiz[]>(multilingualQuizzes);
  const [editingQuiz, setEditingQuiz] = useState<MultilingualQuiz | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Handle save quiz
  const handleSaveQuiz = async (quiz: MultilingualQuiz) => {
    if (editingQuiz) {
      // Update existing
      setQuizzes(quizzes.map(q => q.quizId === quiz.quizId ? quiz : q));
    } else {
      // Create new
      setQuizzes([...quizzes, quiz]);
    }
    setEditingQuiz(null);
    setIsCreating(false);
  };

  // Handle delete quiz
  const handleDeleteQuiz = (quizId: string) => {
    if (confirm('Are you sure you want to delete this quiz?')) {
      setQuizzes(quizzes.filter(q => q.quizId !== quizId));
    }
  };

  if (editingQuiz || isCreating) {
    return (
      <ProtectedPageLayout>
        <AdminQuizForm
          initialQuiz={editingQuiz || undefined}
          onSave={handleSaveQuiz}
          onCancel={() => {
            setEditingQuiz(null);
            setIsCreating(false);
          }}
        />
      </ProtectedPageLayout>
    );
  }

  return (
    <ProtectedPageLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex justify-between items-center"
          >
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                📚 Manage Multilingual Quizzes
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Create, edit, and manage your multilingual quizzes
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setIsCreating(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 h-12 px-6"
              >
                <Plus className="w-5 h-5" />
                Create Quiz
              </Button>
              <Link href="/admin/quizzes/bulk-upload">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 h-12 px-6">
                  <Upload className="w-5 h-5" />
                  Bulk Upload
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Quizzes Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {quizzes.map((quiz) => (
              <motion.div
                key={quiz.quizId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group"
              >
                {/* Card Header */}
                <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {quiz.title['en']}
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-sm rounded-full">
                      {quiz.questions.length} questions
                    </span>
                    <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-sm rounded-full">
                      {quiz.difficulty}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6">
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                    {quiz.description['en']}
                  </p>

                  {/* Languages */}
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Languages:</p>
                    <div className="flex gap-2 flex-wrap">
                      {quiz.availableLanguages.map((lang) => {
                        const langMap = {
                          en: '🇺🇸',
                          hi: '🇮🇳',
                          es: '🇪🇸',
                          fr: '🇫🇷',
                        };
                        return (
                          <span
                            key={lang}
                            className="text-lg"
                            title={lang === 'en' ? 'English' : lang === 'hi' ? 'Hindi' : lang === 'es' ? 'Spanish' : 'French'}
                          >
                            {langMap[lang as keyof typeof langMap]}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 py-3 border-t border-b border-gray-100 dark:border-gray-700 mb-4">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Time Limit</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {Math.floor(quiz.timeLimit / 60)}m
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Category</p>
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {quiz.category || 'General'}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingQuiz(quiz)}
                      className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteQuiz(quiz.quizId)}
                      className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Empty State */}
          {quizzes.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md mx-auto">
                <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
                  No quizzes yet. Create your first multilingual quiz!
                </p>
                <Button
                  onClick={() => setIsCreating(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 justify-center w-full h-12"
                >
                  <Plus className="w-5 h-5" />
                  Create Your First Quiz
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </ProtectedPageLayout>
  );
}
