'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { getLocalizedContent, getLocalizedArray } from '@/lib/i18n/utils';
import { LanguageSelector } from '@/src/components/i18n/LanguageSelector';
import { useExamMode } from '../../context/ExamModeContext';
import { LanguageToggle } from '@/src/components/i18n/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Check, ChevronRight, RotateCcw } from 'lucide-react';
import type { MultilingualQuiz } from '@/lib/data/multilingualQuizzes';
import type { LanguageCode } from '@/lib/i18n/config';

interface MultilingualQuizPageProps {
  quiz: MultilingualQuiz;
}

export function MultilingualQuizPage({ quiz }: MultilingualQuizPageProps) {
  const { language, setLanguage } = useLanguage();
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedLanguageForQuiz, setSelectedLanguageForQuiz] = useState<LanguageCode | null>(null);

  // Initialize selected language from quiz available languages
  useEffect(() => {
    if (quiz.availableLanguages.includes(language)) {
      setSelectedLanguageForQuiz(language);
    } else {
      setSelectedLanguageForQuiz(quiz.availableLanguages[0]);
    }
  }, [quiz, language]);

  const handleLanguageChange = (langCode: LanguageCode) => {
    setSelectedLanguageForQuiz(langCode);
    setLanguage(langCode);
  };

  const handleToggleLanguage = () => {
    if (!selectedLanguageForQuiz) return;
    const currentIndex = quiz.availableLanguages.indexOf(selectedLanguageForQuiz);
    const nextIndex = (currentIndex + 1) % quiz.availableLanguages.length;
    const nextLang = quiz.availableLanguages[nextIndex];
    setSelectedLanguageForQuiz(nextLang);
    setLanguage(nextLang);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleRestart = () => {
    setQuizStarted(false);
    setCurrentQuestion(0);
    setAnswers([]);
    setShowResults(false);
  };

  const calculateScore = () => {
    let correct = 0;
    quiz.questions.forEach((q, index) => {
      if (answers[index] === q.correctAnswer) {
        correct++;
      }
    });
    return correct;
  };

  if (!selectedLanguageForQuiz) {
    return <div>Loading...</div>;
  }

  const { setExamMode } = useExamMode();

  // helper fullscreen
  const enterFullscreen = async () => {
    const el = document.documentElement;
    try {
      if (el.requestFullscreen) await el.requestFullscreen();
      else if ((el as any).webkitRequestFullscreen) await (el as any).webkitRequestFullscreen();
      else if ((el as any).msRequestFullscreen) await (el as any).msRequestFullscreen();
    } catch {}
  };

  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if ((document as any).webkitExitFullscreen) await (document as any).webkitExitFullscreen();
      else if ((document as any).msExitFullscreen) await (document as any).msExitFullscreen();
    } catch {}
  };

  // Quiz not started - show intro
  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Quiz Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 mb-8"
          >
            <h1 className={`text-4xl font-bold text-center mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent`}>
              {getLocalizedContent(quiz.title, selectedLanguageForQuiz)}
            </h1>
            <p className={`text-center text-gray-600 dark:text-gray-300 text-lg mb-8 ${
              selectedLanguageForQuiz === 'hi' ? 'font-noto-sans-devanagari' : 'font-inter'
            }`}>
              {getLocalizedContent(quiz.description, selectedLanguageForQuiz)}
            </p>

            {/* Quiz Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-center">
                <div className="text-3xl font-bold text-blue-600">{quiz.questions.length}</div>
                <div className={`text-sm text-gray-600 dark:text-gray-400 ${
                  selectedLanguageForQuiz === 'hi' ? 'font-noto-sans-devanagari' : 'font-inter'
                }`}>
                  {selectedLanguageForQuiz === 'hi' ? 'प्रश्न' : selectedLanguageForQuiz === 'es' ? 'Preguntas' : selectedLanguageForQuiz === 'fr' ? 'Questions' : 'Questions'}
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl text-center">
                <div className="text-3xl font-bold text-purple-600">{Math.floor(quiz.timeLimit / 60)}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">min</div>
              </div>
              <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-xl text-center">
                <div className="text-3xl font-bold text-pink-600">{quiz.difficulty}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedLanguageForQuiz === 'hi' ? 'स्तर' : selectedLanguageForQuiz === 'es' ? 'Nivel' : selectedLanguageForQuiz === 'fr' ? 'Niveau' : 'Level'}
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl text-center">
                <div className="text-3xl font-bold text-green-600">
                  {quiz.questions.reduce((acc, q) => acc + q.points, 0)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedLanguageForQuiz === 'hi' ? 'अंक' : selectedLanguageForQuiz === 'es' ? 'Puntos' : selectedLanguageForQuiz === 'fr' ? 'Points' : 'Points'}
                </div>
              </div>
            </div>

            {/* Language Selector */}
            <div className="mb-8">
              <LanguageSelector
                availableLanguages={quiz.availableLanguages}
                showLabel={true}
                compact={false}
              />
            </div>

            {/* Start Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={async () => {
                // user gesture: enter fullscreen and set exam mode
                await enterFullscreen();
                setExamMode(true);
                setQuizStarted(true);
              }}
              className="w-full mt-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl text-xl font-bold shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              {selectedLanguageForQuiz === 'hi' ? '🚀 क्विज़ शुरू करें' : selectedLanguageForQuiz === 'es' ? '🚀 Comenzar Quiz' : selectedLanguageForQuiz === 'fr' ? '🚀 Commencer le Quiz' : '🚀 Start Quiz'}
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Results view
  if (showResults) {
    const score = calculateScore();
    const percentage = Math.round((score / quiz.questions.length) * 100);
    const maxPoints = quiz.questions.reduce((acc, q) => acc + q.points, 0);
    const earnedPoints = Math.round((score / quiz.questions.length) * maxPoints);

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 text-center"
          >
            <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              {selectedLanguageForQuiz === 'hi' ? '✨ परिणाम ✨' : selectedLanguageForQuiz === 'es' ? '✨ Resultados ✨' : selectedLanguageForQuiz === 'fr' ? '✨ Résultats ✨' : '✨ Results ✨'}
            </h1>

            <div className="mb-8">
              <div className="text-6xl font-bold text-blue-600 mb-2">{percentage}%</div>
              <div className="text-xl text-gray-600 dark:text-gray-300">
                {score} / {quiz.questions.length} {selectedLanguageForQuiz === 'hi' ? 'सही उत्तर' : selectedLanguageForQuiz === 'es' ? 'respuestas correctas' : selectedLanguageForQuiz === 'fr' ? 'bonnes réponses' : 'Correct Answers'}
              </div>
              <div className="text-lg text-green-600 font-semibold mt-2">
                {earnedPoints} / {maxPoints} {selectedLanguageForQuiz === 'hi' ? 'अंक' : selectedLanguageForQuiz === 'es' ? 'puntos' : selectedLanguageForQuiz === 'fr' ? 'points' : 'Points'}
              </div>
            </div>

            {/* Answer Review */}
            <div className="mb-8 max-h-96 overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                {selectedLanguageForQuiz === 'hi' ? 'उत्तर समीक्षा' : selectedLanguageForQuiz === 'es' ? 'Revisión de Respuestas' : selectedLanguageForQuiz === 'fr' ? 'Examen des Réponses' : 'Answer Review'}
              </h2>
              <div className="space-y-4">
                {quiz.questions.map((q, index) => {
                  const isCorrect = answers[index] === q.correctAnswer;
                  return (
                    <div
                      key={q.questionId}
                      className={`p-4 rounded-lg border-2 ${
                        isCorrect
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {isCorrect ? (
                          <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white text-sm flex-shrink-0 mt-1">
                            ✕
                          </div>
                        )}
                        <div className="flex-1 text-left">
                          <p className={`font-semibold text-gray-900 dark:text-white mb-2 ${
                            selectedLanguageForQuiz === 'hi' ? 'font-noto-sans-devanagari' : ''
                          }`}>
                            {index + 1}. {getLocalizedContent(q.question, selectedLanguageForQuiz)}
                          </p>
                          <p className={`text-sm text-gray-700 dark:text-gray-300 mb-2 ${
                            selectedLanguageForQuiz === 'hi' ? 'font-noto-sans-devanagari' : ''
                          }`}>
                            <strong>{selectedLanguageForQuiz === 'hi' ? 'आपका उत्तर:' : selectedLanguageForQuiz === 'es' ? 'Tu respuesta:' : selectedLanguageForQuiz === 'fr' ? 'Votre réponse:' : 'Your Answer:'}</strong> {getLocalizedArray(q.options, selectedLanguageForQuiz)[answers[index]] || 'Not answered'}
                          </p>
                          {!isCorrect && (
                            <p className={`text-sm text-green-700 dark:text-green-300 ${
                              selectedLanguageForQuiz === 'hi' ? 'font-noto-sans-devanagari' : ''
                            }`}>
                              <strong>{selectedLanguageForQuiz === 'hi' ? 'सही उत्तर:' : selectedLanguageForQuiz === 'es' ? 'Respuesta correcta:' : selectedLanguageForQuiz === 'fr' ? 'Bonne réponse:' : 'Correct Answer:'}</strong> {getLocalizedArray(q.options, selectedLanguageForQuiz)[q.correctAnswer]}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Restart Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={async () => {
                // exit exam mode and fullscreen
                setQuizStarted(false);
                setExamMode(false);
                await exitFullscreen();
                handleRestart();
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl text-xl font-bold shadow-lg hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              {selectedLanguageForQuiz === 'hi' ? 'दोबारा प्रयास करें' : selectedLanguageForQuiz === 'es' ? 'Intentar de Nuevo' : selectedLanguageForQuiz === 'fr' ? 'Réessayer' : 'Try Again'}
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Quiz in progress
  const currentQ = quiz.questions[currentQuestion];
  const options = getLocalizedArray(currentQ.options, selectedLanguageForQuiz);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className={`text-sm font-medium text-gray-600 dark:text-gray-400 ${
              selectedLanguageForQuiz === 'hi' ? 'font-noto-sans-devanagari' : ''
            }`}>
              {selectedLanguageForQuiz === 'hi' ? `प्रश्न ${currentQuestion + 1} / ${quiz.questions.length}` : selectedLanguageForQuiz === 'es' ? `Pregunta ${currentQuestion + 1} de ${quiz.questions.length}` : selectedLanguageForQuiz === 'fr' ? `Question ${currentQuestion + 1} sur ${quiz.questions.length}` : `Question ${currentQuestion + 1} of ${quiz.questions.length}`}
            </span>
            <span className="text-sm font-medium text-blue-600">
              {Math.round(((currentQuestion + 1) / quiz.questions.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
              className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 mb-8"
          >
            {/* Question */}
            <h2 className={`text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-8 leading-relaxed ${
              selectedLanguageForQuiz === 'hi' ? 'font-noto-sans-devanagari' : ''
            }`}>
              {getLocalizedContent(currentQ.question, selectedLanguageForQuiz)}
            </h2>

            {/* Options */}
            <div className="space-y-4">
              {options.map((option, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAnswerSelect(index)}
                  className={`w-full p-5 rounded-xl border-2 text-left transition-all duration-200 ${
                    selectedLanguageForQuiz === 'hi' ? 'font-noto-sans-devanagari text-lg' : 'text-lg'
                  } ${
                    answers[currentQuestion] === index
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      answers[currentQuestion] === index
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                    }`}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="flex-1">{option}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex gap-4 mb-8">
          <Button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            variant="outline"
            className="flex-1"
          >
            {selectedLanguageForQuiz === 'hi' ? 'पिछला' : selectedLanguageForQuiz === 'es' ? 'Anterior' : selectedLanguageForQuiz === 'fr' ? 'Précédent' : 'Previous'}
          </Button>
          <Button
            onClick={handleNext}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex items-center justify-center gap-2"
          >
            {currentQuestion === quiz.questions.length - 1
              ? (selectedLanguageForQuiz === 'hi' ? 'समाप्त करें' : selectedLanguageForQuiz === 'es' ? 'Finalizar' : selectedLanguageForQuiz === 'fr' ? 'Terminer' : 'Finish')
              : (selectedLanguageForQuiz === 'hi' ? 'आगे' : selectedLanguageForQuiz === 'es' ? 'Siguiente' : selectedLanguageForQuiz === 'fr' ? 'Suivant' : 'Next')}
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Language Toggle Button */}
        {quiz.availableLanguages.length > 1 && (
          <div className="flex justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleToggleLanguage}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all"
            >
              {selectedLanguageForQuiz === 'hi' ? '🌐 भाषा बदलें' : selectedLanguageForQuiz === 'es' ? '🌐 Cambiar idioma' : selectedLanguageForQuiz === 'fr' ? '🌐 Changer de langue' : '🌐 Change Language'}
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}
