'use client';

import { useState, useEffect, useCallback, type ChangeEvent } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
import { quizService } from '@/services/quiz.service';
import { api } from '@/lib/api';
import { useQuizStore } from '@/stores/quiz-store';
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
  Button,
} from '@/components/ui';
import { X } from 'lucide-react';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useToast } from '@/providers/toast-provider';
import type { QuizSubmission, AchievementUnlock } from '@/types';

const QUIZ_DURATION = 600; // 10 minutes in seconds

export default function QuizPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const { showToast } = useToast();
  
  const topicId = params.topicId as string;
  const topicName = searchParams.get('topic') || 'Quiz';
  const subjectName = searchParams.get('subject') || '';
  const difficulty = searchParams.get('difficulty') || 'medium';

  const countParam = searchParams.get('count');
  const initialSelection = (() => {
    if (!countParam) return null as number | 'all' | null;
    const lowered = countParam.toLowerCase();
    if (lowered === 'all') {
      return 'all' as const;
    }
    const parsed = Number(countParam);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.floor(parsed);
    }
    return null;
  })();

  const [questionCountInput, setQuestionCountInput] = useState<string>(() =>
    typeof initialSelection === 'number' ? String(initialSelection) : '10'
  );
  const [selectedCount, setSelectedCount] = useState<number | 'all' | null>(initialSelection);
  const [inputError, setInputError] = useState<string | null>(null);

  const hasStarted = selectedCount !== null;

  const quickStartOptions = [5, 10, 15, 20];

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInputError(null);
    setQuestionCountInput(event.target.value);
  };

  const startQuizWithCount = useCallback((count: number | 'all') => {
    setInputError(null);

    if (count === 'all') {
      setSelectedCount('all');
      return;
    }

    const sanitized = Math.max(1, Math.floor(count));
    setQuestionCountInput(String(sanitized));
    setSelectedCount(sanitized);
  }, []);

  const handleCustomStart = useCallback(() => {
    const parsed = Number(questionCountInput);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setInputError('Enter at least 1 question');
      return;
    }

    startQuizWithCount(parsed);
  }, [questionCountInput, startQuizWithCount]);

  // Zustand store
  const saveResult = useQuizStore((state) => state.saveResult);
  const setQuizSession = useQuizStore((state) => state.startSession);
  const recordAnswer = useQuizStore((state) => state.answerQuestion);
  const answers = useQuizStore((state) => state.answers);

  // Quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [startTime] = useState(Date.now());

  const { data: session, isLoading, isFetching, error } = useQuery({
    queryKey: ['quiz-session', topicId, selectedCount ?? 'default'],
    queryFn: () => {
      const requestedCount = selectedCount === null ? 10 : selectedCount;
      return quizService.startQuizSession(topicId, requestedCount);
    },
    enabled: hasStarted,
    retry: false,
  });

  const isSessionLoading = (isLoading || isFetching) && hasStarted;

  useEffect(() => {
    if (selectedCount === null) return;

    const current = countParam ?? null;
    const desired = selectedCount === 'all' ? 'all' : String(selectedCount);

    if (current === desired) {
      return;
    }

  const params = new URLSearchParams(searchParams.toString());
    params.set('count', desired);
    router.replace(`/quiz/${topicId}?${params.toString()}`, { scroll: false });
  }, [selectedCount, countParam, searchParams, router, topicId]);

  // Initialize Zustand session when quiz data loads
  useEffect(() => {
    if (session) {
      setQuizSession({
        topicId: session.topicId ?? topicId,
        topicName: session.topicName || topicName,
        subjectName: session.subjectName || subjectName,
        notesUrl: session.notesUrl ?? null,
        difficulty,
        questions: session.questions,
        startTime: startTime,
        duration: QUIZ_DURATION,
      });
    }
  }, [session, topicId, topicName, subjectName, difficulty, startTime, setQuizSession]);

  // Persist answers for review usage
  useEffect(() => {
    if (!session) return;

    const questionIds = session.questions.map((question) => question.id);
    const answersEntries = Array.from(answers.entries());

    try {
      sessionStorage.setItem(
        `quiz_questions_${topicId}`,
        JSON.stringify(questionIds)
      );
      sessionStorage.setItem(
        `quiz_answers_${topicId}`,
        JSON.stringify(Object.fromEntries(answersEntries))
      );
    } catch (storageError) {
      console.error('Failed to sync quiz review data:', storageError);
    }
  }, [session, answers, topicId]);

  // Submit quiz mutation
  const submitMutation = useMutation({
    mutationFn: async (submission: QuizSubmission) => {
      const result = await quizService.submitQuiz(submission);

      let achievements: AchievementUnlock[] = [];

      const resolvedTopicName = session?.topicName || topicName;
      const resolvedSubjectName = session?.subjectName || subjectName;

      type AttemptResponse = {
        attempt: unknown;
        achievements?: AchievementUnlock[];
      };

      // If user is logged in, save to database and capture achievements
      if (user) {
        try {
          const response = (await api.post<AttemptResponse>('/user/quiz-attempt', {
            clerkId: user.id,
            topicId: submission.topicId,
            score: result.score,
            totalQuestions: result.totalQuestions,
            correctAnswers: result.correctAnswers,
            percentage: result.percentage,
            timeSpent: submission.timeSpent,
            difficulty,
            subjectName: resolvedSubjectName,
            topicName: resolvedTopicName,
          })) as unknown as AttemptResponse;

          achievements = Array.isArray((response as AttemptResponse).achievements)
            ? (response as AttemptResponse).achievements!
            : [];
        } catch (error) {
          console.error('Failed to save to database:', error);
          // Continue anyway - don't block the user experience
        }
      }

      return { result, achievements };
    },
    onSuccess: ({ result, achievements }) => {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      
      // Save result to Zustand store
      saveResult({
        score: result.score,
        totalQuestions: result.totalQuestions,
        correctAnswers: result.correctAnswers,
        incorrectAnswers: result.incorrectAnswers || [],
        percentage:
          typeof result.percentage === 'number'
            ? result.percentage
            : (result.correctAnswers / result.totalQuestions) * 100,
        timeSpent,
        achievements: achievements.length > 0 ? achievements : undefined,
      });

      if (achievements.length > 0) {
        achievements.forEach((achievement) => {
          const title = `${achievement.icon ?? '🎉'} ${achievement.title}`;
          showToast({
            variant: 'success',
            title,
            description: achievement.description,
          });
        });
      }

      // Persist answers and question IDs for review page
      if (typeof window !== 'undefined' && session) {
        try {
          const questionIds = session.questions.map((q) => q.id);
          const answersEntries = Array.from(answers.entries());
          sessionStorage.setItem(
            `quiz_questions_${topicId}`,
            JSON.stringify(questionIds)
          );
          sessionStorage.setItem(
            `quiz_answers_${topicId}`,
            JSON.stringify(Object.fromEntries(answersEntries))
          );
        } catch (storageError) {
          console.error('Failed to persist quiz review data:', storageError);
        }
      }
      
      // Navigate to results page
      router.push(`/quiz/${topicId}/results`);
    },
  });

  // Handle answer selection
  const handleAnswerSelect = useCallback((questionId: string, optionId: string) => {
    recordAnswer(questionId, optionId);
  }, [recordAnswer]);

  // Navigation functions
  const goToQuestion = useCallback((index: number) => {
    if (index >= 0 && index < (session?.questions.length || 0)) {
      setCurrentQuestionIndex(index);
    }
  }, [session]);

  const goToPrevious = useCallback(() => {
    goToQuestion(currentQuestionIndex - 1);
  }, [currentQuestionIndex, goToQuestion]);

  const goToNext = useCallback(() => {
    goToQuestion(currentQuestionIndex + 1);
  }, [currentQuestionIndex, goToQuestion]);

  const skipQuestion = useCallback(() => {
    goToNext();
  }, [goToNext]);

  // Handle quiz completion
  const handleFinish = useCallback(() => {
    if (!session || submitMutation.isPending) return;

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const currentAnswers = session
      ? session.questions.reduce<Array<{ questionId: string; selectedOptionId: string }>>((acc, question) => {
          const selectedOptionId = answers.get(question.id);
          if (selectedOptionId) {
            acc.push({ questionId: question.id, selectedOptionId });
          }
          return acc;
        }, [])
      : Array.from(answers.entries()).map(([questionId, selectedOptionId]) => ({
          questionId,
          selectedOptionId,
        }));

    const submission: QuizSubmission = {
      topicId,
      answers: currentAnswers,
      timeSpent,
    };

    submitMutation.mutate(submission);
  }, [session, topicId, answers, startTime, submitMutation]);

  // Handle time up
  const handleTimeUp = useCallback(() => {
    handleFinish();
  }, [handleFinish]);

  // Handle exit
  const handleExit = () => {
    setShowExitDialog(true);
  };

  const confirmExit = () => {
    router.push('/');
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'Enter' && currentQuestionIndex === (session?.questions.length || 0) - 1) {
        handleFinish();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentQuestionIndex, goToPrevious, goToNext, handleFinish, session]);

  // Mobile swipe gestures
  useSwipeGesture({
    onSwipeLeft: goToNext,
    onSwipeRight: goToPrevious,
    minSwipeDistance: 50,
  });

  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div>
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
              {subjectName || 'Quiz challenge'}
            </p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">{topicName}</h1>
            <p className="mt-2 text-gray-600">
              Choose how many questions you’d like to answer. Stick with the classic 10-question run or customize it for a longer session.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Quick start</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {quickStartOptions.map((countOption) => (
                <Button
                  key={countOption}
                  onClick={() => startQuizWithCount(countOption)}
                  className="font-semibold"
                >
                  {countOption} questions
                </Button>
              ))}
              <Button
                variant="outline"
                onClick={() => startQuizWithCount('all')}
                className="font-semibold"
              >
                All available
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <label htmlFor="question-count" className="block text-sm font-semibold text-gray-700">
              Custom question count
            </label>
            <div className="mt-2 flex items-center gap-3">
              <input
                id="question-count"
                type="number"
                min={1}
                value={questionCountInput}
                onChange={handleInputChange}
                className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="e.g. 12"
              />
              <Button onClick={handleCustomStart} className="font-semibold">
                Start quiz
              </Button>
            </div>
            {inputError && (
              <p className="mt-2 text-sm text-red-600">{inputError}</p>
            )}
            <p className="mt-3 text-xs text-gray-500">
              Default run uses 10 questions. You can adjust before starting.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isSessionLoading && !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Error
          message="Failed to load quiz"
          onRetry={() => router.push('/')}
        />
      </div>
    );
  }

  const currentQuestion = session.questions[currentQuestionIndex];
  const answeredQuestions = new Set(
    session.questions
      .map((q, idx) => (answers.has(q.id) ? idx : null))
      .filter((idx): idx is number => idx !== null)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleExit}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{topicName}</h1>
                <p className="text-sm text-gray-600">{subjectName}</p>
              </div>
            </div>
            <div className="hidden md:block">
              <ProgressBar
                current={currentQuestionIndex + 1}
                total={session.questions.length}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <Timer
              duration={QUIZ_DURATION}
              onTimeUp={handleTimeUp}
            />
            <QuestionIndicator
              totalQuestions={session.questions.length}
              currentQuestion={currentQuestionIndex}
              answeredQuestions={answeredQuestions}
              onQuestionClick={goToQuestion}
            />
          </div>

          {/* Question Area */}
          <div className="lg:col-span-3">
            <div className="md:hidden mb-4">
              <ProgressBar
                current={currentQuestionIndex + 1}
                total={session.questions.length}
              />
            </div>

            <QuestionCard
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={session.questions.length}
              selectedAnswer={answers.get(currentQuestion.id)}
              onAnswerSelect={(optionId) => handleAnswerSelect(currentQuestion.id, optionId)}
            />

            <QuizNavigation
              currentQuestion={currentQuestionIndex + 1}
              totalQuestions={session.questions.length}
              hasAnswered={answers.has(currentQuestion.id)}
              onPrevious={goToPrevious}
              onNext={goToNext}
              onSkip={skipQuestion}
              onFinish={handleFinish}
              isLastQuestion={currentQuestionIndex === session.questions.length - 1}
              isFirstQuestion={currentQuestionIndex === 0}
              isSubmitting={submitMutation.isPending}
            />
          </div>
        </div>
      </div>

      {/* Exit Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showExitDialog}
        title="Exit Quiz?"
        message="Are you sure you want to exit? Your progress will be lost."
        confirmText="Exit"
        cancelText="Continue Quiz"
        onConfirm={confirmExit}
        onCancel={() => setShowExitDialog(false)}
        variant="warning"
      />

      {/* Submitting Overlay */}
      {submitMutation.isPending && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md mx-4 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Submitting Your Quiz</h3>
            <p className="text-gray-700 font-medium">
              Please wait while we calculate your results...
            </p>
            <div className="mt-4 flex items-center justify-center gap-1">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
