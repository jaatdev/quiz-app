'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { getLocalizedContent, validateMultilingualQuiz, type ValidationError } from '@/lib/i18n/utils';
import { LANGUAGES, type LanguageCode } from '@/lib/i18n/config';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Eye, Save, AlertCircle, Check } from 'lucide-react';
import type { MultilingualQuiz, MultilingualQuestion } from '@/lib/data/multilingualQuizzes';

interface AdminQuizFormProps {
  initialQuiz?: MultilingualQuiz;
  onSave: (quiz: MultilingualQuiz) => Promise<void>;
  onCancel: () => void;
}

export function AdminQuizForm({ initialQuiz, onSave, onCancel }: AdminQuizFormProps) {
  const { language } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('en');
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  // Initialize quiz data
  const [quiz, setQuiz] = useState<MultilingualQuiz>(
    initialQuiz || {
      quizId: `quiz_${Date.now()}`,
      title: { en: '', hi: '', es: '', fr: '' },
      description: { en: '', hi: '', es: '', fr: '' },
      category: '',
      difficulty: 'medium',
      availableLanguages: ['en'],
      defaultLanguage: 'en',
      timeLimit: 600,
      questions: [],
      tags: [],
    }
  );

  // Handle quiz title/description changes
  const updateQuizField = (
    field: 'title' | 'description',
    value: string,
    lang: LanguageCode
  ) => {
    setQuiz(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [lang]: value
      }
    }));
  };

  // Handle adding a new question
  const addQuestion = () => {
    const newQuestion: MultilingualQuestion = {
      questionId: `q${quiz.questions.length + 1}`,
      question: { en: '', hi: '', es: '', fr: '' },
      options: { en: ['', '', '', ''], hi: ['', '', '', ''], es: ['', '', '', ''], fr: ['', '', '', ''] },
      correctAnswer: 0,
      explanation: { en: '', hi: '', es: '', fr: '' },
      points: 10,
    };
    setQuiz(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  // Handle question field changes
  const updateQuestion = (
    qIndex: number,
    field: 'question' | 'explanation',
    value: string,
    lang: LanguageCode
  ) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.map((q, idx) =>
        idx === qIndex
          ? {
              ...q,
              [field]: { ...q[field], [lang]: value }
            }
          : q
      )
    }));
  };

  // Handle option changes
  const updateOption = (
    qIndex: number,
    optionIndex: number,
    value: string,
    lang: LanguageCode
  ) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.map((q, idx) =>
        idx === qIndex
          ? {
              ...q,
              options: {
                ...q.options,
                [lang]: q.options[lang].map((opt, oIdx) =>
                  oIdx === optionIndex ? value : opt
                )
              }
            }
          : q
      )
    }));
  };

  // Handle correct answer change
  const updateCorrectAnswer = (qIndex: number, answerIndex: number) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.map((q, idx) =>
        idx === qIndex ? { ...q, correctAnswer: answerIndex } : q
      )
    }));
  };

  // Handle delete question
  const deleteQuestion = (qIndex: number) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.filter((_, idx) => idx !== qIndex)
    }));
  };

  // Validate and save
  const handleSave = async () => {
    // Validate quiz
    const result = validateMultilingualQuiz(quiz);
    if (!result.isValid) {
      setValidationErrors(result.errors);
      return;
    }

    setValidationErrors([]);
    setIsSaving(true);
    try {
      await onSave(quiz);
    } finally {
      setIsSaving(false);
    }
  };

  // Language tabs
  const languages = Object.entries(LANGUAGES);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            {initialQuiz ? 'Edit Quiz' : 'Create New Quiz'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage multilingual content for your quiz
          </p>
        </motion.div>

        {/* Language Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6"
        >
          <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 mb-6">
            {languages.map(([code, config]) => (
              <button
                key={code}
                onClick={() => setSelectedLanguage(code as LanguageCode)}
                className={`px-6 py-3 font-medium transition-all duration-200 ${
                  selectedLanguage === code
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'border-b-2 border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <span className="mr-2">{config.flag}</span>
                {config.nativeName}
              </button>
            ))}
          </div>

          {/* Quiz Title & Description */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quiz Title ({LANGUAGES[selectedLanguage].nativeName})
              </label>
              <input
                type="text"
                value={getLocalizedContent(quiz.title, selectedLanguage)}
                onChange={(e) => updateQuizField('title', e.target.value, selectedLanguage)}
                placeholder="Enter quiz title"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description ({LANGUAGES[selectedLanguage].nativeName})
              </label>
              <textarea
                value={getLocalizedContent(quiz.description, selectedLanguage)}
                onChange={(e) => updateQuizField('description', e.target.value, selectedLanguage)}
                placeholder="Enter quiz description"
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <input
                  type="text"
                  value={quiz.category || ''}
                  onChange={(e) => setQuiz(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="e.g., Geography, History"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Difficulty
                </label>
                <select
                  value={quiz.difficulty}
                  onChange={(e) => setQuiz(prev => ({ ...prev, difficulty: e.target.value as any }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            {/* Time Limit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Time Limit (seconds)
              </label>
              <input
                type="number"
                value={quiz.timeLimit}
                onChange={(e) => setQuiz(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </motion.div>

        {/* Questions Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-6 mb-6"
        >
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Questions ({quiz.questions.length})
            </h2>
            <Button
              onClick={addQuestion}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Question
            </Button>
          </div>

          {/* Questions List */}
          <AnimatePresence>
            {quiz.questions.map((question, qIndex) => (
              <motion.div
                key={question.questionId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
              >
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Question {qIndex + 1}
                  </h3>
                  <Button
                    onClick={() => deleteQuestion(qIndex)}
                    variant="destructive"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>

                {/* Question Text */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Question ({LANGUAGES[selectedLanguage].nativeName})
                  </label>
                  <textarea
                    value={getLocalizedContent(question.question, selectedLanguage)}
                    onChange={(e) => updateQuestion(qIndex, 'question', e.target.value, selectedLanguage)}
                    placeholder="Enter question text"
                    rows={2}
                    className={`w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      selectedLanguage === 'hi' ? 'font-noto-sans-devanagari' : ''
                    }`}
                  />
                </div>

                {/* Options */}
                <div className="mb-6 space-y-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Options ({LANGUAGES[selectedLanguage].nativeName})
                  </label>
                  {question.options[selectedLanguage].map((option, oIndex) => (
                    <div key={oIndex} className="flex items-center gap-3">
                      <input
                        type="radio"
                        name={`correct_${qIndex}`}
                        checked={question.correctAnswer === oIndex}
                        onChange={() => updateCorrectAnswer(qIndex, oIndex)}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[30px]">
                        {String.fromCharCode(65 + oIndex)}.
                      </span>
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updateOption(qIndex, oIndex, e.target.value, selectedLanguage)}
                        placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                        className={`flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          selectedLanguage === 'hi' ? 'font-noto-sans-devanagari' : ''
                        }`}
                      />
                    </div>
                  ))}
                </div>

                {/* Explanation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Explanation ({LANGUAGES[selectedLanguage].nativeName})
                  </label>
                  <textarea
                    value={getLocalizedContent(question.explanation, selectedLanguage)}
                    onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value, selectedLanguage)}
                    placeholder="Explain the correct answer"
                    rows={2}
                    className={`w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      selectedLanguage === 'hi' ? 'font-noto-sans-devanagari' : ''
                    }`}
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {quiz.questions.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400 mb-4">No questions yet</p>
              <Button onClick={addQuestion} className="bg-blue-600 hover:bg-blue-700 text-white">
                Add your first question
              </Button>
            </div>
          )}
        </motion.div>

        {/* Validation Errors */}
        <AnimatePresence>
          {validationErrors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6"
            >
              <div className="flex gap-3 mb-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900 dark:text-red-300">Validation Errors</h3>
                  <ul className="mt-2 space-y-1">
                    {validationErrors.map((error, idx) => (
                      <li key={idx} className="text-sm text-red-700 dark:text-red-200">
                        {error.field}: {error.message}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-4 justify-end"
        >
          <Button onClick={onCancel} variant="outline">
            Cancel
          </Button>
          <Button
            onClick={() => setShowPreview(!showPreview)}
            className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Preview
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Quiz
              </>
            )}
          </Button>
        </motion.div>

        {/* Preview Modal */}
        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setShowPreview(false)}
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-96 overflow-y-auto"
              >
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    {getLocalizedContent(quiz.title, selectedLanguage)}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    {getLocalizedContent(quiz.description, selectedLanguage)}
                  </p>

                  <div className="space-y-4">
                    {quiz.questions.slice(0, 2).map((q, idx) => (
                      <div key={idx} className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <p className="font-medium text-gray-900 dark:text-white mb-2">
                          {getLocalizedContent(q.question, selectedLanguage)}
                        </p>
                        <div className="space-y-2">
                          {(q.options[selectedLanguage] || []).map((opt, oIdx) => (
                            <div
                              key={oIdx}
                              className={`p-2 rounded ${
                                q.correctAnswer === oIdx
                                  ? 'bg-green-100 dark:bg-green-900/20'
                                  : 'bg-gray-100 dark:bg-gray-700'
                              }`}
                            >
                              {String.fromCharCode(65 + oIdx)}. {opt}
                              {q.correctAnswer === oIdx && (
                                <Check className="inline w-4 h-4 text-green-600 ml-2" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setShowPreview(false)}
                    className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
