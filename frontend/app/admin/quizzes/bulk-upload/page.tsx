'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import BulkUploadComponent from '@/src/components/i18n/BulkUploadComponent';
import { ProtectedPageLayout } from '@/components/ProtectedPageLayout';
import type { MultilingualQuiz } from '@/lib/data/multilingualQuizzes';

export default function BulkUploadPage() {
  const [importedQuizzes, setImportedQuizzes] = useState<MultilingualQuiz[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleQuizzesImported = useCallback((quizzes: MultilingualQuiz[]) => {
    setImportedQuizzes((prev) => [...prev, ...quizzes]);
    setShowSuccess(true);

    // Auto-hide success message after 3 seconds
    const timer = setTimeout(() => {
      setShowSuccess(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ProtectedPageLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        {/* Header with Back Button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 backdrop-blur-sm"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <Link
              href="/admin/quizzes/multilingual"
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Back to Quizzes
            </Link>
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {importedQuizzes.length > 0 && (
                <span className="text-green-600 dark:text-green-400 font-semibold">
                  ✓ {importedQuizzes.length} quiz(zes) imported
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Success Banner */}
          <AnimatePresence>
            {showSuccess && importedQuizzes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3"
              >
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-900 dark:text-green-100">
                    Successfully imported {importedQuizzes.length} quiz(zes)!
                  </p>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Your quizzes are now available in the quiz manager.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bulk Upload Component */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 sm:p-8"
          >
            <BulkUploadComponent onQuizzesImported={handleQuizzesImported} />
          </motion.div>

          {/* Imported Quizzes Summary */}
          {importedQuizzes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-8"
            >
              <h2 className="text-2xl font-bold mb-4">Recently Imported ({importedQuizzes.length})</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {importedQuizzes.slice(-6).map((quiz, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-600 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">
                        {quiz.title.en}
                      </h3>
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 font-medium">
                        ✓ Valid
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
                      {quiz.description.en}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <div>
                        <span className="font-medium">Questions:</span> {quiz.questions.length}
                      </div>
                      <div>
                        <span className="font-medium">Difficulty:</span> {quiz.difficulty}
                      </div>
                      <div>
                        <span className="font-medium">Category:</span> {quiz.category}
                      </div>
                      <div>
                        <span className="font-medium">Time:</span> {quiz.timeLimit}m
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Tips Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg p-6 border border-blue-200 dark:border-blue-800"
          >
            <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-3">📋 Upload Tips</h3>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <span>Download a template first to understand the expected format</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <span>Ensure all required fields are filled (title, description, questions)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <span>Provide content for all 4 languages: English, Hindi, Spanish, and French</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <span>Validate your file before importing - check the preview first</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <span>Maximum 4 options per question and one correct answer</span>
              </li>
            </ul>
          </motion.div>
        </div>
      </div>
    </ProtectedPageLayout>
  );
}
