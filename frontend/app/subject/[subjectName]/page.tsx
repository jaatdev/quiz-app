'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { quizService } from '@/services/quiz.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { Error } from '@/components/ui/error';
import { ArrowLeft, Target, BookOpen } from 'lucide-react';
import type { Subject, Topic } from '@/types';

export default function SubjectTopicsPage() {
  const params = useParams();
  const router = useRouter();
  const rawParam = params?.subjectName;
  const subjectName = typeof rawParam === 'string' ? decodeURIComponent(rawParam) : '';

  const { data: subject, isLoading, error, refetch } = useQuery<Subject>({
    queryKey: ['subject-by-name', subjectName],
    queryFn: () => quizService.getSubjectByName(subjectName),
    enabled: Boolean(subjectName),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Error message="Failed to load subject" onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-gray-100"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{subject.name}</h1>
              <p className="text-sm text-gray-700">
                {subject.topics.length} topic{subject.topics.length === 1 ? '' : 's'} available
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => router.push('/')}>Home</Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {subject.topics.length === 0 ? (
          <Card className="max-w-3xl mx-auto">
            <CardContent className="py-10 text-center">
              <BookOpen className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-700">No topics available yet for this subject.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {subject.topics.map((topic: Topic) => (
              <Card key={topic.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{topic.name}</CardTitle>
                  <CardDescription className="text-gray-700">
                    <span className="inline-flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      {topic._count?.questions || 0} questions
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() =>
                      router.push(
                        `/quiz/${topic.id}?topic=${encodeURIComponent(topic.name)}&subject=${encodeURIComponent(subject.name)}`
                      )
                    }
                  >
                    Start Quiz
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
