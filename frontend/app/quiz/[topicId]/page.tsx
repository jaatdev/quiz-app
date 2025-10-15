'use client';

import { useState, useEffect, useCallback, useMemo, type ChangeEvent } from 'react';
import { fireConfettiBurst } from '@/lib/confetti';
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
import type { QuizSubmission, AchievementUnlock, Topic } from '@/types';

const DEFAULT_SECONDS_PER_QUESTION = 30;

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

  const topicIdsParam = searchParams.get('topicIds');
  const initialAdditionalTopics: string[] = (() => {
    if (!topicIdsParam) return [];
    return Array.from(
      new Set(
        topicIdsParam
          .split(',')
          .map((id) => id.trim())
          .filter((id) => id && id !== topicId)
      )
    );
  })();

  const durationParamRaw = searchParams.get('durationMinutes') ?? searchParams.get('duration');
  const initialDurationMinutes: number | null = (() => {
    if (!durationParamRaw) return null;
    const parsed = Number(durationParamRaw);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }
    return parsed;
  })();

  const [questionCountInput, setQuestionCountInput] = useState<string>(() =>
    typeof initialSelection === 'number' ? String(initialSelection) : '10'
  );
  const [selectedCount, setSelectedCount] = useState<number | 'all' | null>(initialSelection);
  const [inputError, setInputError] = useState<string | null>(null);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>(initialAdditionalTopics);
  const [customDurationEnabled, setCustomDurationEnabled] = useState<boolean>(
    () => initialDurationMinutes !== null
  );
  const [durationMinutesInput, setDurationMinutesInput] = useState<string>(() =>
    initialDurationMinutes !== null ? String(initialDurationMinutes) : ''
  );
  const [customDurationMinutes, setCustomDurationMinutes] = useState<number | null>(
    initialDurationMinutes
  );
  const [durationError, setDurationError] = useState<string | null>(null);

  const hasStarted = selectedCount !== null;

  // Fire confetti on first quiz start (per browser)
  useEffect(() => {
    try {
      const key = 'confettiFirstQuizDone';
      const already = localStorage.getItem(key);
      if (!already && hasStarted) {
        fireConfettiBurst();
        localStorage.setItem(key, '1');
      }
    } catch {}
  }, [hasStarted]);

  const quickStartOptions = [5, 10, 15, 20];

  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => quizService.getSubjects(),
  });

  const additionalTopics = useMemo(() => {
    if (!subjects) return [] as Topic[];
    const parentSubject = subjects.find((subject) =>
      subject.topics.some((topic) => topic.id === topicId)
    );
    if (!parentSubject) return [] as Topic[];
    return parentSubject.topics.filter((topic) => topic.id !== topicId);
  }, [subjects, topicId]);

  useEffect(() => {
    setSelectedTopicIds((current) => {
      if (!current.length) return current;
      const validIds = Array.from(
        new Set(
          current.filter((id) => id !== topicId && additionalTopics.some((topic) => topic.id === id))
        )
      );
      if (
        validIds.length === current.length &&
        validIds.every((id, index) => id === current[index])
      ) {
        return current;
      }
      return validIds;
    });
  }, [additionalTopics, topicId]);

  const topicSelectionKey = useMemo(() => {
    if (!selectedTopicIds.length) return 'primary-only';
    return selectedTopicIds.slice().sort().join(',');
  }, [selectedTopicIds]);

  const estimatedAutoMinutes = useMemo(() => {
    if (selectedCount === null || selectedCount === 'all') return null;
    const totalSeconds = Math.max(1, selectedCount) * DEFAULT_SECONDS_PER_QUESTION;
    return totalSeconds / 60;
  }, [selectedCount]);

  const autoMinutesLabel = useMemo(() => {
    if (estimatedAutoMinutes === null) return null;
    const rounded = Math.round(estimatedAutoMinutes * 10) / 10;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  }, [estimatedAutoMinutes]);

  const durationKey = useMemo(() => {
    if (!customDurationEnabled) return 'auto';
    if (customDurationMinutes === null) return 'custom-pending';
    return `custom-${customDurationMinutes}`;
  }, [customDurationEnabled, customDurationMinutes]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInputError(null);
    setQuestionCountInput(event.target.value);
  };

  const handleDurationInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDurationError(null);
    setDurationMinutesInput(event.target.value);
  };

  const handleCustomDurationToggle = (event: ChangeEvent<HTMLInputElement>) => {
    const enabled = event.target.checked;
    setCustomDurationEnabled(enabled);
    setDurationError(null);

    if (!enabled) {
      setCustomDurationMinutes(null);
      return;
    }

    if (!durationMinutesInput) {
      const fallbackMinutes = estimatedAutoMinutes && estimatedAutoMinutes > 0 ? estimatedAutoMinutes : 5;
      const rounded = Math.round(fallbackMinutes * 10) / 10;
      setDurationMinutesInput(String(rounded));
      setCustomDurationMinutes(rounded);
      return;
    }

    const parsed = Number(durationMinutesInput);
    if (Number.isFinite(parsed) && parsed > 0) {
      const sanitized = Math.round(parsed * 100) / 100;
      setCustomDurationMinutes(sanitized);
      setDurationMinutesInput(String(sanitized));
    } else {
      setDurationMinutesInput('');
      setCustomDurationMinutes(null);
    }
  };

  const applyCustomDuration = useCallback((): number | null | false => {
    if (!customDurationEnabled) {
      setDurationError(null);
      setCustomDurationMinutes(null);
      return null;
    }

    const parsed = Number(durationMinutesInput);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setDurationError('Enter at least 1 minute');
      return false;
    }

    const sanitized = Math.round(parsed * 100) / 100;
    setDurationError(null);
    setCustomDurationMinutes(sanitized);
    setDurationMinutesInput(String(sanitized));
    return sanitized;
  }, [customDurationEnabled, durationMinutesInput]);

  const startQuizWithCount = useCallback((count: number | 'all') => {
    const normalizedDuration = applyCustomDuration();
    if (normalizedDuration === false) {
      return;
    }

    setInputError(null);

    if (count === 'all') {
      setSelectedCount('all');
      return;
    }

    const sanitized = Math.max(1, Math.floor(count));
    setQuestionCountInput(String(sanitized));
    setSelectedCount(sanitized);
  }, [applyCustomDuration]);

  const handleCustomStart = useCallback(() => {
    const parsed = Number(questionCountInput);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setInputError('Enter at least 1 question');
      return;
    }

    startQuizWithCount(parsed);
  }, [questionCountInput, startQuizWithCount]);

  const handleTopicToggle = useCallback((id: string) => {
    setSelectedTopicIds((current) => {
      if (current.includes(id)) {
        return current.filter((topicId) => topicId !== id);
      }
      return [...current, id];
    });
  }, []);

  // Zustand store
  const saveResult = useQuizStore((state) => state.saveResult);
  const setQuizSession = useQuizStore((state) => state.startSession);
  const recordAnswer = useQuizStore((state) => state.answerQuestion);
  const answers = useQuizStore((state) => state.answers);

  // Quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  const computeTimeSpent = useCallback(() => {
    if (startTime === null) return 0;
    return Math.max(0, Math.floor((Date.now() - startTime) / 1000));
  }, [startTime]);

  const { data: session, isLoading, isFetching, error } = useQuery({
    queryKey: [
      'quiz-session',
      topicId,
      selectedCount ?? 'default',
      durationKey,
      topicSelectionKey,
    ],
    queryFn: () => {
      const requestedCount = selectedCount === null ? 10 : selectedCount;
      return quizService.startQuizSession(topicId, {
        questionCount: requestedCount,
        durationMinutes: customDurationEnabled ? customDurationMinutes ?? undefined : undefined,
        topicIds: selectedTopicIds,
      });
    },
    enabled: hasStarted,
    retry: false,
  });

  const isSessionLoading = (isLoading || isFetching) && hasStarted;

  useEffect(() => {
    if (selectedCount === null) return;

    const params = new URLSearchParams(searchParams.toString());
    const desiredCount = selectedCount === 'all' ? 'all' : String(selectedCount);
    params.set('count', desiredCount);

    if (customDurationEnabled && customDurationMinutes) {
      params.set('durationMinutes', String(customDurationMinutes));
    } else {
      params.delete('durationMinutes');
      params.delete('duration');
    }

    if (selectedTopicIds.length > 0) {
      params.set('topicIds', selectedTopicIds.join(','));
    } else {
      params.delete('topicIds');
    }

    const nextQuery = params.toString();
    if (nextQuery === searchParams.toString()) {
      return;
    }

    router.replace(`/quiz/${topicId}?${nextQuery}`, { scroll: false });
  }, [
    selectedCount,
    customDurationEnabled,
    customDurationMinutes,
    selectedTopicIds,
    searchParams,
    router,
    topicId,
  ]);

  // Initialize Zustand session when quiz data loads
  useEffect(() => {
    if (!session) return;

    const sessionStartTime = Date.now();
    setStartTime(sessionStartTime);

    setQuizSession({
      topicId: session.topicId ?? topicId,
      topicName: session.topicName || topicName,
      subjectName: session.subjectName || subjectName,
      notesUrl: session.notesUrl ?? null,
      difficulty,
      questions: session.questions,
      startTime: sessionStartTime,
      duration: session.durationSeconds,
    });
  }, [session, topicId, topicName, subjectName, difficulty, setQuizSession, setStartTime]);

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
      const timeSpent = computeTimeSpent();
      
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

    const timeSpent = computeTimeSpent();
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
  }, [session, topicId, answers, computeTimeSpent, submitMutation]);

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
              Choose how many questions you’d like to answer, adjust the timer, and even mix in extra topics from this subject before you dive in.
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
            <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Time settings
            </p>
            <div className="mt-3 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Automatic pacing</p>
                  <p className="text-xs text-gray-500">
                    {estimatedAutoMinutes !== null && autoMinutesLabel
                      ? `≈ ${autoMinutesLabel} minute${Number(autoMinutesLabel) === 1 ? '' : 's'} (${DEFAULT_SECONDS_PER_QUESTION}s per question)`
                      : 'Time adjusts automatically to 30 seconds per question once the quiz begins.'}
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={customDurationEnabled}
                    onChange={handleCustomDurationToggle}
                  />
                  Set custom time
                </label>
              </div>

              {customDurationEnabled && (
                <div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      step={0.5}
                      value={durationMinutesInput}
                      onChange={handleDurationInputChange}
                      className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="e.g. 15"
                    />
                    <span className="text-sm font-medium text-gray-600">minutes</span>
                  </div>
                  {durationError && (
                    <p className="mt-2 text-sm text-red-600">{durationError}</p>
                  )}
                  <p className="mt-2 text-xs text-gray-500">
                    We’ll use your custom limit instead of the automatic pacing for this run.
                  </p>
                </div>
              )}
            </div>
          </div>

          {additionalTopics.length > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Mix related topics
              </p>
              <p className="mt-2 text-sm text-gray-600">
                Add more variety by including questions from other topics in this subject.
              </p>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {additionalTopics.map((topic) => {
                  const checked = selectedTopicIds.includes(topic.id);
                  const questionTotal = topic._count?.questions ?? null;
                  return (
                    <label
                      key={topic.id}
                      className={`flex items-center justify-between gap-3 rounded-xl border p-3 transition ${
                        checked ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{topic.name}</p>
                        {typeof questionTotal === 'number' && (
                          <p className="text-xs text-gray-500">{questionTotal} question{questionTotal === 1 ? '' : 's'}</p>
                        )}
                      </div>
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={checked}
                        onChange={() => handleTopicToggle(topic.id)}
                      />
                    </label>
                  );
                })}
              </div>
              {selectedTopicIds.length > 0 && (
                <p className="mt-2 text-xs text-blue-600">
                  We’ll mix in {selectedTopicIds.length} extra topic{selectedTopicIds.length > 1 ? 's' : ''} this time.
                </p>
              )}
            </div>
          )}

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
              Default run uses 10 questions with automatic pacing. Adjust the count (and timer) before starting.
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
                <h1 className="text-lg font-semibold text-gray-900">{session.topicName || topicName}</h1>
                <p className="text-sm text-gray-600">{session.subjectName || subjectName}</p>
                {session.includedTopicNames.length > 1 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Topics: {session.includedTopicNames.join(', ')}
                  </p>
                )}
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
              duration={session.durationSeconds}
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
