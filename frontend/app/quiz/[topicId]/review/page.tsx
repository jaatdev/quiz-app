'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { quizService } from '@/services/quiz.service';
import { ReviewQuestion } from '@/components/quiz/review-question';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { Error } from '@/components/ui/error';
import { StatsCard } from '@/components/ui/stats-card';
import { Home, RefreshCw, ChevronLeft, ChevronRight, CheckCircle, XCircle, Target, Clock } from 'lucide-react';
import type { QuestionWithAnswer } from '@/types';

export default function ReviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const topicId = params.topicId as string;
  const score = parseFloat(searchParams.get('score') || '0');
  const total = parseInt(searchParams.get('total') || '0');
  const correct = parseInt(searchParams.get('correct') || '0');
  const timeSpent = parseInt(searchParams.get('time') || '0');

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswersMap, setUserAnswersMap] = useState<Map<string, string>>(new Map());

  // Get question IDs from session storage (stored during quiz)
  const [questionIds, setQuestionIds] = useState<string[]>([]);

  useEffect(() => {
    // Try to get stored quiz data from sessionStorage
    const storedAnswers = sessionStorage.getItem(`quiz_answers_${topicId}`);
    const storedQuestions = sessionStorage.getItem(`quiz_questions_${topicId}`);
    
    if (storedAnswers && storedQuestions) {
      const answers = JSON.parse(storedAnswers);
      const questions = JSON.parse(storedQuestions);
      
      setUserAnswersMap(new Map(Object.entries(answers)));
      setQuestionIds(questions);
    }
  }, [topicId]);

  // Fetch review questions
  const { data: reviewData, isLoading, error, refetch } = useQuery({
    queryKey: ['review-questions', questionIds],
    queryFn: () => quizService.getReviewQuestions(questionIds),
    enabled: questionIds.length > 0,
    retry: false,
  });

  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const goToNext = () => {
    if (reviewData && currentQuestionIndex < reviewData.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleHome = () => {
    // Clear session storage
    sessionStorage.removeItem(`quiz_answers_${topicId}`);
    sessionStorage.removeItem(`quiz_questions_${topicId}`);
    router.push('/');
  };

  const handleRetry = () => {
    // Clear session storage
    sessionStorage.removeItem(`quiz_answers_${topicId}`);
    sessionStorage.removeItem(`quiz_questions_${topicId}`);
    router.push(`/quiz/${topicId}`);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentQuestionIndex, reviewData]);

  if (isLoading || questionIds.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error || !reviewData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Error 
          message="Failed to load review questions" 
          onRetry={() => refetch()} 
        />
      </div>
    );
  }

  const currentQuestion = reviewData[currentQuestionIndex];
  const userAnswer = userAnswersMap.get(currentQuestion.id);
  const isCorrect = userAnswer === currentQuestion.correctAnswerId;

  // Calculate statistics
  const incorrect = total - correct;
  const answeredCount = userAnswersMap.size;
  const skipped = total - answeredCount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleHome}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Home className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Quiz Review</h1>
                <p className="text-sm text-gray-600">Review your answers and learn</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRetry}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Summary Stats */}
      <section className="container mx-auto px-4 py-6 border-b bg-white">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <StatsCard
            title="Score"
            value={`${score.toFixed(1)}/${total}`}
            icon={Target}
            color="blue"
            description={`${((score / total) * 100).toFixed(1)}%`}
          />
          <StatsCard
            title="Correct"
            value={correct}
            icon={CheckCircle}
            color="green"
            description={`${((correct / total) * 100).toFixed(0)}% accuracy`}
          />
          <StatsCard
            title="Incorrect"
            value={incorrect}
            icon={XCircle}
            color="red"
            description={skipped > 0 ? `${skipped} skipped` : 'All answered'}
          />
          <StatsCard
            title="Time"
            value={`${Math.floor(timeSpent / 60)}:${(timeSpent % 60).toString().padStart(2, '0')}`}
            icon={Clock}
            color="purple"
            description={`${Math.floor(timeSpent / total)}s per question`}
          />
        </div>
      </section>

      {/* Review Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Question Navigation */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Question {currentQuestionIndex + 1} of {reviewData.length}
              </h2>
              <div className="flex items-center gap-2">
                {isCorrect ? (
                  <span className="flex items-center gap-1 text-green-600 font-medium">
                    <CheckCircle className="w-5 h-5" />
                    Correct
                  </span>
                ) : userAnswer ? (
                  <span className="flex items-center gap-1 text-red-600 font-medium">
                    <XCircle className="w-5 h-5" />
                    Incorrect
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-gray-500 font-medium">
                    <Target className="w-5 h-5" />
                    Skipped
                  </span>
                )}
              </div>
            </div>

            {/* Question Grid Navigator */}
            <div className="bg-white rounded-lg border p-4">
              <div className="grid grid-cols-10 gap-2">
                {reviewData.map((q: QuestionWithAnswer, idx: number) => {
                  const qUserAnswer = userAnswersMap.get(q.id);
                  const qIsCorrect = qUserAnswer === q.correctAnswerId;
                  
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`
                        w-10 h-10 rounded-lg border-2 text-sm font-medium transition-all
                        ${currentQuestionIndex === idx
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : qIsCorrect
                          ? 'border-green-500 bg-green-50 text-green-700 hover:bg-green-100'
                          : qUserAnswer
                          ? 'border-red-500 bg-red-50 text-red-700 hover:bg-red-100'
                          : 'border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100'
                        }
                      `}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded border-2 border-blue-500 bg-blue-500"></div>
                  <span className="text-gray-600">Current</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded border-2 border-green-500 bg-green-50"></div>
                  <span className="text-gray-600">Correct</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded border-2 border-red-500 bg-red-50"></div>
                  <span className="text-gray-600">Incorrect</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded border-2 border-gray-300 bg-gray-50"></div>
                  <span className="text-gray-600">Skipped</span>
                </div>
              </div>
            </div>
          </div>

          {/* Question Review Card */}
          <ReviewQuestion
            question={currentQuestion}
            userAnswer={userAnswer}
            questionNumber={currentQuestionIndex + 1}
          />

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="outline"
              onClick={goToPrevious}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            <div className="text-sm text-gray-600">
              Use arrow keys to navigate
            </div>

            <Button
              variant="outline"
              onClick={goToNext}
              disabled={currentQuestionIndex === reviewData.length - 1}
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8 pt-8 border-t">
            <Button
              onClick={handleHome}
              variant="outline"
              size="lg"
              className="flex items-center gap-2"
            >
              <Home className="w-5 h-5" />
              Back to Home
            </Button>
            <Button
              onClick={handleRetry}
              size="lg"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
