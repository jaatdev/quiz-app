'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Plus, Edit, Trash2, Search, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { QuestionForm } from '@/components/admin/question-form';
import { useToast } from '@/providers/toast-provider';
import { API_URL } from '@/lib/config';
import { cn } from '@/lib/utils';

interface SubjectWithTopics {
  id: string;
  name: string;
  topics: Array<{
    id: string;
    name: string;
  }>;
}

interface Option {
  id: string;
  text: string;
}

interface QuestionListItem {
  id: string;
  text: string;
  options: Option[];
  correctAnswerId: string;
  explanation: string | null;
  difficulty: string;
  pyq: string | null;
  topicId: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedQuestionsResponse {
  items: QuestionListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const QUESTIONS_PAGE_SIZE = 12;

function parseOptions(value: unknown): Option[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const maybeId = 'id' in entry ? String((entry as Record<string, unknown>).id ?? '') : '';
      const maybeText = 'text' in entry ? String((entry as Record<string, unknown>).text ?? '') : '';

      if (!maybeId || !maybeText) {
        return null;
      }

      return { id: maybeId, text: maybeText };
    })
    .filter(Boolean) as Option[];
}

export default function TopicQuestionManager() {
  const params = useParams<{ subjectId: string; topicId: string }>();
  const subjectId = params.subjectId;
  const topicId = params.topicId;
  const { user, isLoaded } = useUser();
  const { showToast } = useToast();

  const [subject, setSubject] = useState<SubjectWithTopics | null>(null);
  const [topicName, setTopicName] = useState<string>('');
  const [subjectLoading, setSubjectLoading] = useState(true);

  const [questionsResponse, setQuestionsResponse] = useState<PaginatedQuestionsResponse | null>(null);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<{
    id: string;
    text: string;
    options: Option[];
    correctAnswerId: string;
    explanation?: string;
    difficulty: string;
    pyq?: string | null;
    topic: { id: string };
  } | null>(null);

  useEffect(() => {
    setPage(1);
    setSearchInput('');
    setSearchTerm('');
    setQuestionsResponse(null);
    setQuestionsLoading(true);
  }, [topicId]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!user) {
      setSubject(null);
      setTopicName('');
      setSubjectLoading(false);
      return;
    }

    const fetchSubjectAndTopic = async () => {
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

        const payload = (await response.json()) as SubjectWithTopics;
        setSubject(payload);

        const foundTopic = payload.topics?.find((entry) => entry.id === topicId);
        setTopicName(foundTopic?.name ?? '');
      } catch (error) {
        console.error('Failed to fetch subject metadata:', error);
        showToast({
          variant: 'error',
          title: error instanceof Error ? error.message : 'Failed to fetch subject',
        });
        setSubject(null);
        setTopicName('');
      } finally {
        setSubjectLoading(false);
      }
    };

    fetchSubjectAndTopic();
  }, [user, isLoaded, subjectId, topicId, showToast]);

  useEffect(() => {
    if (!isLoaded || !user) {
      return;
    }

    const fetchQuestions = async () => {
      setQuestionsLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(QUESTIONS_PAGE_SIZE),
        });
        if (searchTerm.trim()) {
          params.set('q', searchTerm.trim());
        }

        const response = await fetch(
          `${API_URL}/admin/topics/${topicId}/questions?${params.toString()}`,
          {
            headers: {
              'x-clerk-user-id': user.id,
            },
          }
        );

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.error || 'Unable to load questions');
        }

        const payload = (await response.json()) as PaginatedQuestionsResponse;
        const normalizedItems = payload.items.map((item) => {
          const explanation =
            typeof item.explanation === 'string' && item.explanation.trim().length > 0
              ? item.explanation.trim()
              : null;
          const pyqLabel =
            typeof item.pyq === 'string' && item.pyq.trim().length > 0
              ? item.pyq.trim()
              : null;

          return {
            ...item,
            options: parseOptions(item.options),
            explanation,
            pyq: pyqLabel,
          };
        });
        setQuestionsResponse({ ...payload, items: normalizedItems });
      } catch (error) {
        console.error('Failed to fetch questions:', error);
        showToast({
          variant: 'error',
          title: error instanceof Error ? error.message : 'Failed to fetch questions',
        });
        setQuestionsResponse(null);
      } finally {
        setQuestionsLoading(false);
      }
    };

    fetchQuestions();
  }, [user, isLoaded, topicId, page, searchTerm, reloadToken, showToast]);

  const totalQuestions = questionsResponse?.total ?? 0;
  const totalPages = questionsResponse?.totalPages ?? 1;
  const questions = questionsResponse?.items ?? [];

  const headerTitle = useMemo(() => {
    if (subjectLoading) {
      return 'Loading topic...';
    }

    if (!subject) {
      return 'Subject not found';
    }

    return topicName || 'Topic not found';
  }, [subjectLoading, subject, topicName]);

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearchTerm(searchInput.trim());
  };

  const handleDelete = async (id: string) => {
    if (!user) {
      return;
    }

    const confirmed = window.confirm('Are you sure you want to delete this question?');
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/questions/${id}`, {
        method: 'DELETE',
        headers: {
          'x-clerk-user-id': user.id,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'Failed to delete question');
      }

      showToast({ variant: 'success', title: 'Question deleted successfully.' });
      setQuestionsResponse((previous) => {
        if (!previous) {
          return previous;
        }
        const remaining = previous.items.filter((item) => item.id !== id);
        return {
          ...previous,
          items: remaining,
          total: Math.max(0, previous.total - 1),
        };
      });
      setReloadToken((value) => value + 1);
    } catch (error) {
      console.error('Failed to delete question:', error);
      showToast({
        variant: 'error',
        title: error instanceof Error ? error.message : 'Failed to delete question',
      });
    }
  };

  const openCreateForm = () => {
    setEditingQuestion(null);
    setShowForm(true);
  };

  const openEditForm = (question: QuestionListItem) => {
    setEditingQuestion({
      id: question.id,
      text: question.text,
      options: question.options,
      correctAnswerId: question.correctAnswerId,
      explanation: question.explanation ?? undefined,
      difficulty: question.difficulty,
      pyq: question.pyq,
      topic: { id: question.topicId },
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingQuestion(null);
  };

  const refreshQuestions = () => {
    setQuestionsLoading(true);
    setReloadToken((value) => value + 1);
  };

  if (subjectLoading || (questionsLoading && !questionsResponse)) {
    return <Loading />;
  }

  if (!subject || !topicName) {
    return (
      <div className="space-y-4">
        <Link
          href={`/admin/questions/${subjectId}`}
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to topics
        </Link>
        <Card>
          <CardContent className="py-10 text-center text-gray-600">
            Topic not found. It may have been removed.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
            <Link
              href="/admin/questions"
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Subjects
            </Link>
            <Link
              href={`/admin/questions/${subjectId}`}
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Topics
            </Link>
            <span>{subject.name}</span>
          </div>
          <h1 className="mt-3 text-3xl font-bold text-gray-900">{headerTitle}</h1>
          <p className="text-gray-600">
            Manage questions for this topic. Showing {questions.length} of {totalQuestions} questions.
          </p>
        </div>
        <Button onClick={openCreateForm} className="w-full md:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add question
        </Button>
      </div>

      <form
        onSubmit={handleSearchSubmit}
        className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4"
      >
        <div className="relative w-full md:w-96">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search questions or explanations..."
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

      {questionsLoading && questions.length === 0 ? (
        <Loading />
      ) : questions.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-gray-600">
            No questions found. Add your first question for this topic.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {questions.map((question) => (
            <Card key={question.id}>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      {question.text}
                    </CardTitle>
                    <CardDescription className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                      <span className="capitalize">{question.difficulty}</span>
                      {question.pyq ? (
                        <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-700">
                          PYQ: {question.pyq}
                        </span>
                      ) : null}
                      <span className="text-xs text-gray-500">
                        Updated {new Date(question.updatedAt).toLocaleDateString()}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openEditForm(question)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(question.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  {question.options.map((option) => (
                    <div
                      key={option.id}
                      className={cn(
                        'rounded border px-3 py-2 text-sm',
                        option.id === question.correctAnswerId
                          ? 'border-green-300 bg-green-50 font-semibold text-green-700'
                          : 'border-gray-200 bg-gray-50 text-gray-700'
                      )}
                    >
                      {option.id.toUpperCase()}. {option.text}
                    </div>
                  ))}
                </div>
                {question.explanation ? (
                  <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
                    {question.explanation}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {questions.length > 0 && totalPages > 1 && (
        <div className="flex flex-col items-center gap-4 rounded-lg border bg-white p-4 text-sm text-gray-700 md:flex-row md:justify-between">
          <span>
            Page {page} of {totalPages} · {totalQuestions} total questions
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

      {showForm && (
        <QuestionForm
          question={editingQuestion}
          defaultTopicId={topicId}
          onClose={closeForm}
          onSave={() => {
            closeForm();
            refreshQuestions();
          }}
        />
      )}
    </div>
  );
}
