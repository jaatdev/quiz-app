"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { NormalizedQuiz, NormalizedQuestion, Lang } from '@/lib/quiz/normalize';
import LanguageSelector from '@/components/ui/LanguageSelector';
import LanguageToggle from '@/components/ui/LanguageToggle';
// import { useExamMode } from '@/context/ExamModeContext'; // Uncomment if you have this context

type QuizClientProps = {
  quiz: NormalizedQuiz;
};

export default function QuizClient({ quiz }: QuizClientProps) {
  const router = useRouter();
  // const { setExamMode } = useExamMode(); // Uncomment if you have this context

  const [quizStarted, setQuizStarted] = useState(false);
  const [lang, setLang] = useState<Lang>(quiz.defaultLanguage || 'en');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(new Array(quiz.questions.length).fill(null));
  const [revealed, setRevealed] = useState<boolean[]>(new Array(quiz.questions.length).fill(false));
  const [score, setScore] = useState(0);

  const currentQuestion = quiz.questions[currentIdx];

  const handleStartQuiz = () => {
    document.documentElement.requestFullscreen?.();
    // setExamMode(true); // Uncomment if you have this context
    setQuizStarted(true);
  };

  const handleLanguageSelect = (selectedLang: Lang) => {
    setLang(selectedLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferredLanguage', selectedLang);
    }
  };

  const handleAnswer = (optionIndex: number) => {
    if (revealed[currentIdx]) return;
    const isCorrect = optionIndex === currentQuestion.correctIndex;
    if (isCorrect) {
      setScore(prev => prev + (currentQuestion.points || 10));
    }
    const newAnswers = [...userAnswers];
    newAnswers[currentIdx] = optionIndex;
    setUserAnswers(newAnswers);
    const newRevealed = [...revealed];
    newRevealed[currentIdx] = true;
    setRevealed(newRevealed);
  };

  const goToNext = () => {
    if (currentIdx < quiz.questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handleFinish = () => {
    // setExamMode(false); // Uncomment if you have this context
    document.exitFullscreen?.();
    router.push(`/quiz/${quiz.quizId}/results`);
  };

  useEffect(() => {
    return () => {
      // setExamMode(false); // Uncomment if you have this context
      document.exitFullscreen?.();
    };
  }, []);

  if (!quizStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-3xl bg-white dark:bg-gray-800/50 backdrop-blur-lg rounded-3xl shadow-2xl p-8 text-center"
        >
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {quiz.title[lang] || quiz.title.en}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">{quiz.description[lang] || quiz.description.en}</p>
          {quiz.isMultilingual && (
            <div className="mb-8">
              <LanguageSelector
                availableLanguages={quiz.availableLanguages}
                currentLanguage={lang}
                onLanguageChange={handleLanguageSelect}
              />
            </div>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStartQuiz}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl text-xl font-bold shadow-lg hover:shadow-xl transition-all"
          >
            🚀 Start Quiz
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
      {quiz.isMultilingual && (
        <LanguageToggle
          currentLanguage={lang}
          onToggle={() => handleLanguageSelect(lang === 'en' ? 'hi' : 'en')}
        />
      )}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-semibold text-blue-600 dark:text-blue-400">Question {currentIdx + 1}/{quiz.questions.length}</h2>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Score: {score}</div>
          </div>
          <p className={`text-2xl font-bold mb-8 text-gray-900 dark:text-white ${lang === 'hi' ? 'font-[Noto_Sans_Devanagari]' : ''}`}>
            {currentQuestion.question[lang]}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(currentQuestion.options[lang] || []).map((optionText, index) => {
              const isRevealed = revealed[currentIdx];
              const isCorrect = index === currentQuestion.correctIndex;
              const isSelected = index === userAnswers[currentIdx];
              let buttonClass = 'border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400';
              if (isRevealed) {
                if (isCorrect) buttonClass = 'bg-green-50 dark:bg-green-900/30 border-green-500 text-green-800 dark:text-green-200';
                else if (isSelected) buttonClass = 'bg-red-50 dark:bg-red-900/30 border-red-500 text-red-800 dark:text-red-200';
              }
              return (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  disabled={isRevealed}
                  className={`p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-center gap-4 ${buttonClass}`}
                >
                  <span className="font-bold text-lg">{String.fromCharCode(65 + index)}</span>
                  <span className={`flex-1 ${lang === 'hi' ? 'font-[Noto_Sans_Devanagari]' : ''}`}>{optionText}</span>
                </button>
              );
            })}
          </div>
          <AnimatePresence>
            {revealed[currentIdx] && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Explanation</h3>
                <p className={`text-gray-700 dark:text-gray-300 ${lang === 'hi' ? 'font-[Noto_Sans_Devanagari]' : ''}`}>
                  {currentQuestion.explanation[lang]}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="mt-8 flex justify-end">
            {currentIdx < quiz.questions.length - 1 ? (
              <button
                onClick={goToNext}
                disabled={!revealed[currentIdx]}
                className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={!revealed[currentIdx]}
                className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Finish Quiz
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
