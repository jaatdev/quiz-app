'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useQuizStore } from '@/stores/quiz-store';
import { quizService } from '@/services/quiz.service';
import { 
  Timer, 
  ProgressBar, 
  QuestionCard, 
  QuizNavigation, 
  QuestionIndicator 
} from '@/components/quiz';
import { 
  Loading, 
  Error, 
  ConfirmationDialog,
  Button 
} from '@/components/ui';
import { Flag, X, Target } from 'lucide-react';
import type { QuizSubmission } from '@/types';

const QUIZ_DURATION = 600; // 10 minutes

export default function EnhancedQuizPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const topicId = params.topicId as string;
  const topicName = searchParams.get('topic') || 'Quiz';
  const subjectName = searchParams.get('subject') || '';

  // Zustand store
  const {
    currentSession,
    currentQuestionIndex,
    answers,
    flaggedQuestions,
    startSession,
    answerQuestion,
    toggleFlagQuestion,
    goToQuestion,
    nextQuestion,
    previousQuestion,
    saveResult,
    clearSession,
    getProgress,
    isQuestionFlagged,
    canNavigateNext,
    canNavigatePrevious,
  } = useQuizStore();

  // Local state
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Fetch quiz session
  const { data: sessionData, isLoading, error } = useQuery({
    queryKey: ['quiz-session', topicId],
    queryFn: () => quizService.startQuizSession(topicId),
    retry: false,
    enabled: !currentSession || currentSession.topicId !== topicId,
  });

  // Initialize session
  useEffect(() => {
    if (sessionData && (!currentSession || currentSession.topicId !== topicId)) {
      startSession({
        topicId,
        topicName,
        subjectName,
        questions: sessionData.questions,
        startTime: Date.now(),
        duration: QUIZ_DURATION,
      });
    }
  }, [sessionData, topicId, topicName, subjectName, startSession, currentSession]);

  // Submit quiz mutation
  const submitMutation = useMutation({
    mutationFn: (submission: QuizSubmission) => quizService.submitQuiz(submission),
    onSuccess: (result) => {
      const timeSpent = Math.floor((Date.now() - (currentSession?.startTime || 0)) / 1000);
      saveResult({ ...result, timeSpent });
      
      // Store question IDs and answers for review
      const questionIds = currentSession?.questions.map(q => q.id) || [];
      const answersArray = Array.from(answers.entries());
      sessionStorage.setItem(`quiz_questions_${topicId}`, JSON.stringify(questionIds));
      sessionStorage.setItem(`quiz_answers_${topicId}`, JSON.stringify(Object.fromEntries(answersArray)));
      
      router.push(`/quiz/${topicId}/results?score=${result.score}&total=${result.totalQuestions}&correct=${result.correctAnswers}&time=${timeSpent}`);
    },
  });

  // Handle answer selection
  const handleAnswerSelect = useCallback((optionId: string) => {
    if (!currentSession) return;
    const currentQuestion = currentSession.questions[currentQuestionIndex];
    answerQuestion(currentQuestion.id, optionId);
  }, [currentSession, currentQuestionIndex, answerQuestion]);

  // Handle flag toggle
  const handleFlagToggle = useCallback(() => {
    toggleFlagQuestion(currentQuestionIndex);
  }, [currentQuestionIndex, toggleFlagQuestion]);

  // Handle quiz submission
  const handleSubmit = useCallback(() => {
    if (!currentSession) return;

    const submission: QuizSubmission = {
      topicId,
      answers: Array.from(answers.entries()).map(([questionId, selectedOptionId]) => ({
        questionId,
        selectedOptionId,
      })),
      timeSpent: Math.floor((Date.now() - currentSession.startTime) / 1000),
    };

    submitMutation.mutate(submission);
  }, [currentSession, topicId, answers, submitMutation]);

  // Handle time up
  const handleTimeUp = useCallback(() => {
    handleSubmit();
  }, [handleSubmit]);

  // Check for unanswered questions
  const checkUnansweredQuestions = () => {
    if (!currentSession) return { hasUnanswered: false, unansweredCount: 0, flaggedCount: 0 };
    
    const progress = getProgress();
    const unansweredCount = progress.total - progress.answered;
    
    return {
      hasUnanswered: unansweredCount > 0,
      unansweredCount,
      flaggedCount: flaggedQuestions.size,
    };
  };

  // Handle finish attempt
  const handleFinishAttempt = () => {
    const { hasUnanswered, unansweredCount, flaggedCount } = checkUnansweredQuestions();
    
    if (hasUnanswered || flaggedCount > 0) {
      setShowSubmitDialog(true);
    } else {
      handleSubmit();
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && canNavigatePrevious()) previousQuestion();
      if (e.key === 'ArrowRight' && canNavigateNext()) nextQuestion();
      if (e.key === 'f' || e.key === 'F') handleFlagToggle();
      if (e.key === 'Enter' && e.ctrlKey) handleFinishAttempt();
      
      // Number keys for option selection
      const num = parseInt(e.key);
      if (num >= 1 && num <= 4 && currentSession) {
        const currentQuestion = currentSession.questions[currentQuestionIndex];
        const option = currentQuestion.options[num - 1];
        if (option) handleAnswerSelect(option.id);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [
    currentSession,
    currentQuestionIndex,
    canNavigatePrevious,
    canNavigateNext,
    previousQuestion,
    nextQuestion,
    handleFlagToggle,
    handleFinishAttempt,
    handleAnswerSelect,
  ]);

  if (isLoading || !currentSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Error 
          message="Failed to load quiz" 
          onRetry={() => router.push('/')} 
        />
      </div>
    );
  }

  const currentQuestion = currentSession.questions[currentQuestionIndex];
  const progress = getProgress();
  const { unansweredCount, flaggedCount } = checkUnansweredQuestions();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowExitDialog(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{topicName}</h1>
                <p className="text-sm text-gray-600">{subjectName}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Stats */}
              <div className="hidden lg:flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-green-600" />
                  <span>
                    <span className="font-bold text-gray-900">{progress.answered}</span>
                    <span className="text-gray-600">/{progress.total} answered</span>
                  </span>
                </div>
                {flaggedCount > 0 && (
                  <div className="flex items-center gap-2">
                    <Flag className="w-4 h-4 text-orange-500" />
                    <span className="font-bold text-orange-600">{flaggedCount} flagged</span>
                  </div>
                )}
              </div>
              
              <div className="hidden md:block w-48">
                <ProgressBar
                  current={progress.answered}
                  total={progress.total}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <Timer
              duration={QUIZ_DURATION}
              onTimeUp={handleTimeUp}
              isPaused={isPaused}
            />
            
            {/* Quick Stats */}
            <div className="bg-white rounded-lg border p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">Progress</span>
                <span className="text-sm font-bold text-blue-600">{progress.percentage.toFixed(0)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">Current</span>
                <span className="text-sm font-bold text-gray-900">Q{currentQuestionIndex + 1}</span>
              </div>
              {flaggedCount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700">Flagged</span>
                  <span className="text-sm font-bold text-orange-600">{flaggedCount}</span>
                </div>
              )}
            </div>

            <QuestionIndicator
              totalQuestions={currentSession.questions.length}
              currentQuestion={currentQuestionIndex}
              answeredQuestions={new Set(
                currentSession.questions
                  .map((q, idx) => (answers.has(q.id) ? idx : null))
                  .filter((idx): idx is number => idx !== null)
              )}
              onQuestionClick={goToQuestion}
            />

            {/* Flag Button */}
            <Button
              variant={isQuestionFlagged(currentQuestionIndex) ? "default" : "outline"}
              className={`w-full font-bold ${isQuestionFlagged(currentQuestionIndex) ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
              onClick={handleFlagToggle}
            >
              <Flag className="w-4 h-4 mr-2" />
              {isQuestionFlagged(currentQuestionIndex) ? 'Flagged' : 'Flag Question'}
            </Button>
          </div>

          {/* Question Area */}
          <div className="lg:col-span-3">
            {/* Mobile Progress */}
            <div className="md:hidden mb-4">
              <ProgressBar
                current={progress.answered}
                total={progress.total}
              />
            </div>

            {/* Flag indicator */}
            {isQuestionFlagged(currentQuestionIndex) && (
              <div className="mb-4 p-3 bg-orange-50 border-2 border-orange-400 rounded-lg flex items-center gap-2">
                <Flag className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-bold text-orange-900">This question is flagged for review</span>
              </div>
            )}

            <QuestionCard
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={currentSession.questions.length}
              selectedAnswer={answers.get(currentQuestion.id)}
              onAnswerSelect={handleAnswerSelect}
            />

            <QuizNavigation
              currentQuestion={currentQuestionIndex + 1}
              totalQuestions={currentSession.questions.length}
              hasAnswered={answers.has(currentQuestion.id)}
              onPrevious={previousQuestion}
              onNext={nextQuestion}
              onSkip={nextQuestion}
              onFinish={handleFinishAttempt}
              isLastQuestion={currentQuestionIndex === currentSession.questions.length - 1}
              isFirstQuestion={currentQuestionIndex === 0}
            />

            {/* Keyboard shortcuts hint */}
            <div className="mt-4 text-xs text-gray-600 text-center font-semibold">
              <span className="mr-4">← → Navigate</span>
              <span className="mr-4">1-4 Select Option</span>
              <span className="mr-4">F Flag Question</span>
              <span>Ctrl+Enter Submit</span>
            </div>
          </div>
        </div>
      </div>

      {/* Exit Confirmation */}
      <ConfirmationDialog
        isOpen={showExitDialog}
        title="Exit Quiz?"
        message="Are you sure you want to exit? Your progress will be saved and you can resume later."
        confirmText="Exit"
        cancelText="Continue Quiz"
        onConfirm={() => router.push('/')}
        onCancel={() => setShowExitDialog(false)}
        variant="warning"
      />

      {/* Submit Confirmation */}
      <ConfirmationDialog
        isOpen={showSubmitDialog}
        title="Submit Quiz?"
        message={
          unansweredCount > 0
            ? `You have ${unansweredCount} unanswered question${unansweredCount > 1 ? 's' : ''}. ${
                flaggedCount > 0 ? `You also have ${flaggedCount} flagged question${flaggedCount > 1 ? 's' : ''}.` : ''
              } Are you sure you want to submit?`
            : `You have ${flaggedCount} flagged question${flaggedCount > 1 ? 's' : ''} for review. Submit anyway?`
        }
        confirmText="Submit Quiz"
        cancelText="Review Questions"
        onConfirm={handleSubmit}
        onCancel={() => setShowSubmitDialog(false)}
        variant="warning"
      />
    </div>
  );
}
