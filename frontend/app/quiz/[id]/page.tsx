import QuizClient from '@/components/quiz/QuizClient';
import { getQuizByTopicId } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';

async function fetchQuizData(topicId: string) {
  try {
    const quiz = await getQuizByTopicId(topicId);
    if (!quiz) return null;
    return quiz;
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

  return <QuizClient quiz={quiz} />;
}
