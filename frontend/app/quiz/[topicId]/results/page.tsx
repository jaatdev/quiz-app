'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
import { useQuizStore } from '@/stores/quiz-store';
import { quizService } from '@/services/quiz.service';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { ScoreDisplay } from '@/components/quiz/score-display';
import { Home, RefreshCw, BookOpen, TrendingUp, Clock, Target, Award, Download, Loader2 } from 'lucide-react';
import { calculateGrade } from '@/lib/utils';
import { generateProfessionalPDF } from '@/lib/pdf-generator';
import { useToast } from '@/providers/toast-provider';

// Simple UUID generator for browser
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export default function EnhancedResultsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const { showToast } = useToast();
  const topicId = params.topicId as string;
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const { lastResult, currentSession, clearSession, answers } = useQuizStore();

  // Fetch review questions for PDF export
  const questionIds = currentSession?.questions.map(q => q.id) || [];
  const { data: reviewQuestions } = useQuery({
    queryKey: ['review-questions', questionIds],
    queryFn: () => quizService.getReviewQuestions(questionIds),
    enabled: questionIds.length > 0,
    staleTime: Infinity, // Keep the data fresh
  });

  // Save to history
  useEffect(() => {
    if (lastResult && currentSession) {
      const history = JSON.parse(localStorage.getItem('quiz-history') || '[]');
      const newEntry = {
        id: generateId(),
        topicId: currentSession.topicId,
        topicName: currentSession.topicName,
        subjectName: currentSession.subjectName,
        score: lastResult.score,
        totalQuestions: lastResult.totalQuestions,
        correctAnswers: lastResult.correctAnswers,
        percentage: lastResult.percentage,
        timestamp: Date.now(),
        timeSpent: lastResult.timeSpent,
        difficulty: currentSession.difficulty || 'medium',
      };
      
      const updatedHistory = [newEntry, ...history].slice(0, 50);
      localStorage.setItem('quiz-history', JSON.stringify(updatedHistory));
    }
  }, [lastResult, currentSession]);

  // Redirect if no result
  useEffect(() => {
    if (!lastResult || !currentSession) {
      router.push('/');
    }
  }, [lastResult, currentSession, router]);

  if (!lastResult || !currentSession) {
    return null;
  }

  const { grade, color } = calculateGrade(lastResult.percentage);

  const handleRetry = () => {
    clearSession();
    router.push(`/quiz/${topicId}?topic=${encodeURIComponent(currentSession.topicName)}&subject=${encodeURIComponent(currentSession.subjectName)}`);
  };

  const handleReview = () => {
    router.push(`/quiz/${topicId}/review`);
  };

  const handleHome = () => {
    clearSession();
    router.push('/');
  };

  const handleExportPDF = async () => {
    console.log('Export PDF clicked!');
    setIsGeneratingPDF(true);
    setPdfError(null);
    
    try {
      console.log('Creating professional PDF...');
      console.log('Review Questions:', reviewQuestions);
      console.log('User Answers:', Array.from(answers.entries()));
      
      // Prepare questions data for PDF
      const questionsData = currentSession.questions.map((q, index) => {
        const reviewQ = reviewQuestions?.find(rq => rq.id === q.id);
        const userAnswer = answers.get(q.id);
        const correctAnswerId = reviewQ?.correctAnswerId;
        
        // Check if answer is correct - handle undefined/null cases
        const isCorrect = userAnswer && correctAnswerId && userAnswer === correctAnswerId;
        
        console.log(`Question ${index + 1}:`, {
          questionId: q.id,
          userAnswer: userAnswer || 'NOT ANSWERED',
          correctAnswerId: correctAnswerId || 'UNKNOWN',
          isCorrect,
          reviewQFound: !!reviewQ,
          options: q.options.map(o => ({ id: o.id, text: o.text.substring(0, 30) }))
        });
        
        return {
          questionNumber: index + 1,
          questionText: q.text,
          options: q.options,
          userAnswer: userAnswer || 'not-answered',
          correctAnswer: correctAnswerId || '',
          isCorrect: isCorrect || false, // Ensure it's always a boolean
          explanation: reviewQ?.explanation,
        };
      });

      console.log('Questions Data for PDF:', questionsData.map(q => ({
        num: q.questionNumber,
        userAns: q.userAnswer,
        correctAns: q.correctAnswer,
        isCorrect: q.isCorrect
      })));

      await generateProfessionalPDF({
        // User Info
        userName: user?.fullName || user?.firstName || 'Anonymous',
        userEmail: user?.primaryEmailAddress?.emailAddress || 'N/A',
        userImage: user?.imageUrl,
        
        // Quiz Info
        topicName: currentSession.topicName,
        subjectName: currentSession.subjectName,
        difficulty: currentSession.difficulty || 'medium',
        
        // Results
        score: lastResult.score,
        totalQuestions: lastResult.totalQuestions,
        correctAnswers: lastResult.correctAnswers,
        incorrectAnswers: lastResult.totalQuestions - lastResult.correctAnswers,
        percentage: lastResult.percentage,
        timeSpent: lastResult.timeSpent,
        completedAt: new Date(),
        
        // Questions
        questions: questionsData,
      });
      
      console.log('Professional PDF generated successfully!');
      setPdfError(null);
      showToast({
        variant: 'success',
        title: 'PDF ready.',
        description: 'Your detailed quiz report is downloading.',
      });
    } catch (error) {
      console.error('PDF generation failed:', error);
      setPdfError('Failed to generate PDF. Please try again.');
      showToast({ variant: 'error', title: 'Failed to generate PDF.' });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Calculate stats
  const averageTimePerQuestion = Math.floor(lastResult.timeSpent / lastResult.totalQuestions);
  const accuracy = (lastResult.correctAnswers / lastResult.totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {currentSession?.topicName || 'Quiz'} Complete!
          </h1>
          <p className="text-gray-700 font-semibold">{currentSession?.subjectName || ''}</p>
        </div>

        {/* Main Score Display */}
        <ScoreDisplay
          score={lastResult.score}
          totalQuestions={lastResult.totalQuestions}
          correctAnswers={lastResult.correctAnswers}
          percentage={lastResult.percentage}
          timeSpent={lastResult.timeSpent}
        />

        {/* Detailed Stats */}
        <div className="grid md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-8">
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-700 mb-1">Grade</p>
                  <p className={`text-3xl font-bold ${color}`}>{grade}</p>
                </div>
                <Award className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-700 mb-1">Accuracy</p>
                  <p className="text-3xl font-bold text-gray-900">{accuracy.toFixed(0)}%</p>
                </div>
                <Target className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-700 mb-1">Avg Time</p>
                  <p className="text-3xl font-bold text-gray-900">{averageTimePerQuestion}s</p>
                </div>
                <Clock className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-700 mb-1">Score</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {lastResult.score.toFixed(1)}/{lastResult.totalQuestions}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Message */}
        <Card className="max-w-4xl mx-auto mt-8 border-2">
          <CardContent className="pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Performance Analysis</h3>
            <div className="space-y-3">
              {lastResult.percentage >= 80 && (
                <p className="text-green-800 bg-green-100 p-4 rounded-lg font-semibold border-2 border-green-300">
                  🎉 Excellent work! You've demonstrated strong knowledge in this topic.
                </p>
              )}
              {lastResult.percentage >= 60 && lastResult.percentage < 80 && (
                <p className="text-blue-800 bg-blue-100 p-4 rounded-lg font-semibold border-2 border-blue-300">
                  👍 Good job! You're on the right track. Review the incorrect answers to improve further.
                </p>
              )}
              {lastResult.percentage < 60 && (
                <p className="text-orange-800 bg-orange-100 p-4 rounded-lg font-semibold border-2 border-orange-300">
                  📚 Keep practicing! Review the explanations carefully to strengthen your understanding.
                </p>
              )}
              
              {lastResult.incorrectAnswers.length > 0 && (
                <div className="mt-4 p-4 bg-gray-100 rounded-lg border-2">
                  <p className="text-sm font-bold text-gray-800 mb-3">
                    You got {lastResult.incorrectAnswers.length} question{lastResult.incorrectAnswers.length > 1 ? 's' : ''} wrong.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleReview}
                    className="font-bold"
                  >
                    Review Incorrect Answers
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* PDF Error Message */}
        {pdfError && (
          <div className="max-w-4xl mx-auto mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
            <p className="text-red-700 font-semibold">{pdfError}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8 max-w-3xl mx-auto">
          <Button
            onClick={handleHome}
            variant="outline"
            size="lg"
            className="flex items-center gap-2 font-bold"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </Button>
          <Button
            onClick={handleRetry}
            variant="outline"
            size="lg"
            className="flex items-center gap-2 font-bold"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </Button>
          <Button
            onClick={handleReview}
            size="lg"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 font-bold"
          >
            <BookOpen className="w-5 h-5" />
            Review All Answers
          </Button>
          <Button
            onClick={handleExportPDF}
            variant="outline"
            size="lg"
            disabled={isGeneratingPDF}
            className="flex items-center gap-2 font-bold"
          >
            {isGeneratingPDF ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Export PDF
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
