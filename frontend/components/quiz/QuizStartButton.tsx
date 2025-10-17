'use client';

import { useAuthPrompt } from '@/lib/hooks/useAuthPrompt';
import { Button } from '@/components/ui/button';
import { AuthModal } from '@/components/AuthModal';

/**
 * Example: Protected feature component
 * Shows auth modal when unauthenticated user tries to start quiz
 */
export function QuizStartButton() {
  const { requireAuth, showModal, setShowModal, modalState } = useAuthPrompt();

  const handleStartQuiz = () => {
    if (requireAuth({ message: 'Sign in to start taking quizzes and track your progress!' })) {
      // User is authenticated - proceed with quiz
      console.log('Starting quiz...');
      // Your quiz start logic here
    }
  };

  return (
    <>
      <Button
        onClick={handleStartQuiz}
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg transition-all"
      >
        Start Quiz
      </Button>

      <AuthModal {...modalState} />
    </>
  );
}
