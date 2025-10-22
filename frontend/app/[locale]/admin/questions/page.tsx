'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { Search, RefreshCcw } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import { API_URL } from '@/lib/config';
import { fetchSubjectsWithTopicsAction } from '@/app/admin/actions';
import { useToast } from '@/providers/toast-provider';
import { buttonVariants } from '@/components/ui/button';

interface SubjectResponse {
  id: string;
  name: string;
  topics: Array<{
    id: string;
    name: string;
    _count?: { questions?: number };
  }>;
  _count?: {
    topics?: number;
  };
}

export default function AdminSubjectOverview() {
  const { user, isLoaded } = useUser();
  const { showToast } = useToast();

  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!user) {
      setSubjects([]);
      setLoading(false);
      return;
    }

    fetchSubjects();
  }, [user, isLoaded]);

  const fetchSubjects = async () => {
    if (!user) {
      return;
    }

    setLoading(true);

    try {
      const resp = await fetchSubjectsWithTopicsAction();
      if (!resp?.success) {
        throw new Error(resp?.error || 'Failed to load subjects');
      }
      setSubjects(resp.data || []);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
      showToast({ variant: 'error', title: error instanceof Error ? error.message : 'Failed to load subjects' });
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) {
      return subjects;
    }

    return subjects.filter((subject) => {
      const haystack = [
        subject.name,
        ...subject.topics.map((topic) => topic.name),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalized);
    });
  }, [subjects, searchTerm]);

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Question Bank</h1>
          <p className="text-gray-600">Browse subjects to manage topics and questions</p>
        </div>
        <button
          type="button"
          onClick={fetchSubjects}
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
        <div className="relative w-full md:w-96">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search subjects or topics..."
            className="w-full rounded-lg border px-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {filteredSubjects.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-gray-600">
            No subjects found. Create a subject first, then add topics and questions.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredSubjects.map((subject) => {
            const totalTopics = subject._count?.topics ?? subject.topics.length;
            const totalQuestions = subject.topics.reduce((sum, topic) => {
              const count = topic._count?.questions ?? 0;
              return sum + count;
            }, 0);
            const topTopics = subject.topics.slice(0, 3);
            const remainingCount = Math.max(0, subject.topics.length - topTopics.length);

            return (
              <Card key={subject.id} className="flex flex-col justify-between">
                <div>
                  <CardHeader>
                    <CardTitle>{subject.name}</CardTitle>
                    <CardDescription>
                      {totalTopics} {totalTopics === 1 ? 'topic' : 'topics'} · {totalQuestions}{' '}
                      {totalQuestions === 1 ? 'question' : 'questions'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {topTopics.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {topTopics.map((topic) => (
                          <span
                            key={topic.id}
                            className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700"
                          >
                            {topic.name}
                          </span>
                        ))}
                        {remainingCount > 0 && (
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                            +{remainingCount} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">No topics yet. Add topics to start building questions.</p>
                    )}
                  </CardContent>
                </div>
                <CardFooter>
                  <Link
                    href={`/admin/questions/${subject.id}`}
                    className={buttonVariants({ variant: 'default', size: 'sm' })}
                  >
                    Manage Topics
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
