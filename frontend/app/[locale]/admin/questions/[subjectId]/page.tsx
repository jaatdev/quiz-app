'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { ArrowLeft, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { API_URL } from '@/lib/config';
import { useToast } from '@/providers/toast-provider';

interface SubjectMeta {
  id: string;
  name: string;
  _count?: { topics?: number };
}

interface TopicSummary {
  id: string;
  name: string;
  _count?: { questions?: number };
}

interface PaginatedTopicsResponse {
  items: TopicSummary[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const PAGE_SIZE = 12;

export default function SubjectTopicsPage() {
  const params = useParams<{ subjectId: string }>();
  const subjectId = params.subjectId;
  const { user, isLoaded } = useUser();
  const { showToast } = useToast();

  const [subject, setSubject] = useState<SubjectMeta | null>(null);
  const [topicsResponse, setTopicsResponse] = useState<PaginatedTopicsResponse | null>(null);
  const [subjectLoading, setSubjectLoading] = useState(true);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setPage(1);
    setSearchInput('');
    setSearchTerm('');
    setTopicsResponse(null);
    setTopicsLoading(true);
  }, [subjectId]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!user) {
      setSubject(null);
      setSubjectLoading(false);
      return;
    }

    const fetchSubject = async () => {
      setSubjectLoading(true);
      try {
        const response = await fetch(`${API_URL}/admin/subjects/${subjectId}`, {
          headers: {
            'x-clerk-user-id': user.id,
          },
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.error || 'Unable to load subject');
        }

        const payload = (await response.json()) as SubjectMeta;
        setSubject(payload);
      } catch (error) {
        console.error('Failed to fetch subject:', error);
        showToast({
          variant: 'error',
          title: error instanceof Error ? error.message : 'Failed to fetch subject',
        });
        setSubject(null);
      } finally {
        setSubjectLoading(false);
      }
    };

    fetchSubject();
  }, [user, isLoaded, subjectId, showToast]);

  useEffect(() => {
    if (!isLoaded || !user) {
      return;
    }

    const fetchTopics = async () => {
      setTopicsLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(PAGE_SIZE),
        });
        if (searchTerm.trim()) {
          params.set('q', searchTerm.trim());
        }

        const response = await fetch(
          `${API_URL}/admin/subjects/${subjectId}/topics?${params.toString()}`,
          {
            headers: {
              'x-clerk-user-id': user.id,
            },
          }
        );

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.error || 'Unable to load topics');
        }

        const payload = (await response.json()) as PaginatedTopicsResponse;
        setTopicsResponse(payload);
      } catch (error) {
        console.error('Failed to fetch topics:', error);
        showToast({
          variant: 'error',
          title: error instanceof Error ? error.message : 'Failed to fetch topics',
        });
        setTopicsResponse(null);
      } finally {
        setTopicsLoading(false);
      }
    };

    fetchTopics();
  }, [user, isLoaded, subjectId, page, searchTerm, showToast]);

  const totalTopics = topicsResponse?.total ?? subject?._count?.topics ?? 0;
  const totalPages = topicsResponse?.totalPages ?? 1;

  const displayTitle = useMemo(() => {
    if (subjectLoading) {
      return 'Loading subject...';
    }

    return subject?.name ?? 'Subject not found';
  }, [subject, subjectLoading]);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearchTerm(searchInput.trim());
  };

  if (subjectLoading || (topicsLoading && !topicsResponse)) {
    return <Loading />;
  }

  if (!subject) {
    return (
      <div className="space-y-4">
        <Link href="/admin/questions" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to subjects
        </Link>
        <Card>
          <CardContent className="py-10 text-center text-gray-600">
            Subject not found or you no longer have access.
          </CardContent>
        </Card>
      </div>
    );
  }

  const topics = topicsResponse?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Link href="/admin/questions" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to subjects
            </Link>
            <span className="hidden md:inline">Subject overview</span>
          </div>
          <h1 className="mt-3 text-3xl font-bold text-gray-900">{displayTitle}</h1>
          <p className="text-gray-600">
            Manage topics and questions for this subject. Showing {topics.length} of {totalTopics} topics.
          </p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
        <div className="relative w-full md:w-96">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search topics..."
            className="w-full rounded-lg border px-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <button type="submit" className={buttonVariants({ variant: 'default', size: 'sm' })}>
            Apply
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              setSearchTerm('');
              setPage(1);
            }}
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            Clear
          </button>
        </div>
      </form>

      {topicsLoading && topics.length === 0 ? (
        <Loading />
      ) : topics.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-gray-600">
            No topics found. Create topics before adding questions.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {topics.map((topic) => {
            const questionCount = topic._count?.questions ?? 0;

            return (
              <Card key={topic.id} className="flex flex-col justify-between">
                <div>
                  <CardHeader>
                    <CardTitle className="text-xl">{topic.name}</CardTitle>
                    <CardDescription>
                      {questionCount} {questionCount === 1 ? 'question' : 'questions'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-gray-600">
                    <p>Keep questions organized by managing them within this topic.</p>
                  </CardContent>
                </div>
                <CardFooter>
                  <Link
                    href={`/admin/questions/${subject.id}/${topic.id}`}
                    className={buttonVariants({ variant: 'default', size: 'sm' })}
                  >
                    Manage questions
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {topics.length > 0 && totalPages > 1 && (
        <div className="flex flex-col items-center gap-4 rounded-lg border bg-white p-4 text-sm text-gray-700 md:flex-row md:justify-between">
          <span>
            Page {page} of {totalPages} · {totalTopics} total topics
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={page === 1}
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              disabled={page === totalPages}
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
