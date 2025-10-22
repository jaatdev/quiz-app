import QuizClient from '@/components/quiz/QuizClient';
import { normalizeIncomingQuiz, type NormalizedQuiz } from '@/lib/quiz/normalize';
import { notFound } from 'next/navigation';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

async function fetchQuizData(topicId: string): Promise<NormalizedQuiz | { error: string } | null> {
  try {
    // Fetch quiz session from backend API
    const response = await fetch(`${API_BASE_URL}/quiz/session/${topicId}?count=10`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      if (response.status === 404 && errorData?.error === 'No questions found for this topic') {
        return { error: 'NO_QUESTIONS' };
      }
      console.error(`Failed to fetch quiz session: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();

    // Normalize the incoming quiz data to match our expected format
    const normalizedQuiz = normalizeIncomingQuiz(data, 'general-subject', topicId, 'general-subtopic');

    return normalizedQuiz as NormalizedQuiz;
  } catch (error) {
    console.error("Failed to fetch quiz for page:", error);
    return null;
  }
}

export default async function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quiz = await fetchQuizData(id);

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Oops!</h1>
          <p>Failed to load quiz. It might not exist or there was an error.</p>
          <Link href="/" className="text-blue-500 mt-4 inline-block">Go Home</Link>
        </div>
      </div>
    );
  }

  // Check if quiz is an error object
  if ('error' in quiz) {
    if (quiz.error === 'NO_QUESTIONS') {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold">No Questions Found</h1>
            <p>There are no questions available for this topic yet.</p>
            <p>Admins can add questions in the admin panel.</p>
            <Link href="/" className="text-blue-500 mt-4 inline-block">Go Home</Link>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Error</h1>
          <p>{quiz.error}</p>
          <Link href="/" className="text-blue-500 mt-4 inline-block">Go Home</Link>
        </div>
      </div>
    );
  }

  return <QuizClient quiz={quiz} />;
}
