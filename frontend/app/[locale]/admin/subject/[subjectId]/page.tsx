'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { Error as ErrorState } from '@/components/ui/error';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { ArrowLeft, Edit3, Pencil, Plus, Save, Search, Target, Trash2 } from 'lucide-react';
import { useToast } from '@/providers/toast-provider';
import { API_URL } from '@/lib/config';
import type { Subject, Topic } from '@/types';

interface PaginatedTopics {
  items: (Topic & { _count?: { questions: number; subTopics?: number } })[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function AdminSubjectPage() {
  const { user } = useUser();
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const subjectId = params?.subjectId as string | undefined;

  const [renameMode, setRenameMode] = useState(false);
  const [subjectName, setSubjectName] = useState('');

  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [newTopicName, setNewTopicName] = useState('');
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editingTopicName, setEditingTopicName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [showBulk, setShowBulk] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkResult, setBulkResult] = useState<{ created: number; duplicates: string[] } | null>(null);

  const subjectQuery = useQuery<Subject, Error>({
    queryKey: ['admin-subject-meta', subjectId],
    queryFn: async () => {
      const { fetchSubjectByIdAction } = await import('@/app/admin/actions');
      const resp = await fetchSubjectByIdAction(subjectId as string);
      if (!resp?.success) throw new Error(String(resp?.error || 'Failed to load subject'));
      return resp.data as Subject;
    },
    enabled: Boolean(user && subjectId),
  });

  useEffect(() => {
    if (subjectQuery.data?.name && !renameMode) {
      setSubjectName(subjectQuery.data.name);
    }
  }, [subjectQuery.data?.name, renameMode]);

  const topicsQuery = useQuery<PaginatedTopics, Error>({
    queryKey: ['admin-subject-topics', subjectId, page, pageSize, search],
    queryFn: async () => {
      const resp = await (await import('@/app/admin/actions')).fetchTopicsForSubjectAction(subjectId as string, page, pageSize, search || undefined);
      if (!resp?.success) throw new Error(String(resp?.error || 'Failed to load topics'));
      return resp.data as PaginatedTopics;
    },
    enabled: Boolean(user && subjectId),
  });

  const totalPages = topicsQuery.data?.totalPages ?? 1;

  const renameSubject = useMutation<Subject, Error, string>({
    mutationFn: async (name: string) => {
      const { saveSubjectAction } = await import('@/app/admin/actions');
      const resp = await saveSubjectAction({ id: subjectId, name });
      if (!resp?.success) throw new Error(String(resp?.error || 'Failed to rename subject'));
      return resp.data as Subject;
    },
    onSuccess: (data) => {
      showToast({ variant: 'success', title: 'Subject renamed.' });
      queryClient.invalidateQueries({ queryKey: ['admin-subject-meta', subjectId] });
      setSubjectName(data.name);
      setRenameMode(false);
    },
    onError: (error: any) => {
      showToast({ variant: 'error', title: error?.message || 'Failed to rename subject' });
    },
  });

  const createTopic = useMutation<Topic, Error, string>({
    mutationFn: async (name: string) => {
      const { saveTopicAction } = await import('@/app/admin/actions');
      const resp = await saveTopicAction({ name, subjectId: subjectId as string });
      if (!resp?.success) throw new Error(String(resp?.error || 'Failed to create topic'));
      return resp.data as Topic;
    },
    onSuccess: () => {
      setNewTopicName('');
      showToast({ variant: 'success', title: 'Topic created.' });
      queryClient.invalidateQueries({ queryKey: ['admin-subject-topics', subjectId] });
    },
    onError: (error: any) => {
      showToast({ variant: 'error', title: error?.message || 'Failed to create topic' });
    },
  });

  const updateTopic = useMutation<Topic, Error, { id: string; name: string }>({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { saveTopicAction } = await import('@/app/admin/actions');
      const resp = await saveTopicAction({ id, name, subjectId: subjectId as string });
      if (!resp?.success) throw new Error(String(resp?.error || 'Failed to update topic'));
      return resp.data as Topic;
    },
    onSuccess: () => {
      showToast({ variant: 'success', title: 'Topic updated.' });
      setEditingTopicId(null);
      setEditingTopicName('');
      queryClient.invalidateQueries({ queryKey: ['admin-subject-topics', subjectId] });
    },
    onError: (error: any) => {
      showToast({ variant: 'error', title: error?.message || 'Failed to update topic' });
    },
  });

  const deleteTopic = useMutation<unknown, Error, string>({
    mutationFn: async (topicId: string) => {
      const { deleteTopicAction } = await import('@/app/admin/actions');
      const resp = await deleteTopicAction(topicId);
      if (!resp?.success) throw new Error(String(resp?.error || 'Failed to delete topic'));
      return resp.data;
    },
    onSuccess: () => {
      showToast({ variant: 'success', title: 'Topic deleted.' });
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-subject-topics', subjectId] });
    },
    onError: (error: any) => {
      showToast({ variant: 'error', title: error?.message || 'Failed to delete topic' });
    },
  });

  const bulkCreateTopics = useMutation<{ created: number; duplicates: string[] }, Error, string[]>({
    mutationFn: async (names: string[]) => {
      const { bulkCreateTopicsAction } = await import('@/app/admin/actions');
      const resp = await bulkCreateTopicsAction(subjectId as string, names);
      if (!resp?.success) throw new Error(String(resp?.error || 'Failed to bulk create topics'));
      return resp.data as { created: number; duplicates: string[] };
    },
    onSuccess: (data) => {
      showToast({ variant: 'success', title: `Created ${data.created} topics` });
      setBulkResult({ created: data.created, duplicates: data.duplicates || [] });
      setBulkText('');
      setPage(1);
      queryClient.invalidateQueries({ queryKey: ['admin-subject-topics', subjectId] });
    },
    onError: (error: any) => {
      showToast({ variant: 'error', title: error?.message || 'Failed to bulk create topics' });
    },
  });

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput.trim());
  };

  const isLoading = subjectQuery.isLoading || topicsQuery.isLoading || !user;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (subjectQuery.isError || topicsQuery.isError || !subjectQuery.data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ErrorState
          message="Failed to load subject or topics"
          onRetry={() => {
            subjectQuery.refetch();
            topicsQuery.refetch();
          }}
        />
      </div>
    );
  }

  const currentSubject = subjectQuery.data;
  const topics: PaginatedTopics['items'] = topicsQuery.data?.items ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              {!renameMode ? (
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">{currentSubject.name}</h1>
                  <Button variant="outline" size="sm" onClick={() => setRenameMode(true)}>
                    <Pencil className="w-4 h-4 mr-1" /> Rename
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    className="p-2 border rounded-lg text-gray-900"
                    placeholder="Subject name"
                  />
                  <Button
                    size="sm"
                    onClick={() => subjectName.trim() && renameSubject.mutate(subjectName.trim())}
                    disabled={!subjectName.trim() || renameSubject.isPending}
                  >
                    <Save className="w-4 h-4 mr-1" /> Save
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setRenameMode(false)}>
                    Cancel
                  </Button>
                </div>
              )}
              <p className="text-sm text-gray-700">
                Manage topics under this subject
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => router.push('/admin/subjects')}>
            All Subjects
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Topics</CardTitle>
            <CardDescription className="text-gray-700">
              Search, add, edit, delete, and bulk-create topics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-9 pr-3 py-2 border rounded-lg text-gray-900"
                  placeholder="Search topics..."
                />
              </div>
              <Button variant="outline" onClick={handleSearch}>
                Search
              </Button>
              <div className="flex gap-2">
                <input
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  className="p-2 border rounded-lg text-gray-900"
                  placeholder="New topic name"
                />
                <Button
                  onClick={() => newTopicName.trim() && createTopic.mutate(newTopicName.trim())}
                  disabled={!newTopicName.trim() || createTopic.isPending}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>
              <Button variant="outline" onClick={() => setShowBulk((prev) => !prev)}>
                {showBulk ? 'Hide Bulk' : 'Bulk Create'}
              </Button>
            </div>

            {showBulk && (
              <div className="rounded-lg border p-4 mb-4">
                <p className="text-sm text-gray-700 mb-2">
                  Paste topic names (one per line). Duplicates will be skipped.
                </p>
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  rows={6}
                  className="w-full p-2 border rounded-lg text-gray-900"
                  placeholder={`Basics\nFundamentals\nAdvanced`}
                />
                <div className="mt-2 flex items-center gap-2">
                  <Button
                    onClick={() => {
                      const names = bulkText
                        .split('\n')
                        .map((line) => line.trim())
                        .filter(Boolean);
                      if (names.length) {
                        bulkCreateTopics.mutate(names);
                      }
                    }}
                    disabled={!bulkText.trim() || bulkCreateTopics.isPending}
                  >
                    Create Topics
                  </Button>
                  {bulkResult && (
                    <p className="text-sm text-gray-700">
                      Created {bulkResult.created}
                      {bulkResult.duplicates.length
                        ? `, ${bulkResult.duplicates.length} duplicates skipped`
                        : ''}
                    </p>
                  )}
                </div>
              </div>
            )}

            {topics.length ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topics.map((topic) => (
                  <div key={topic.id} className="p-4 border rounded-lg bg-white">
                    {editingTopicId !== topic.id ? (
                      <>
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900">{topic.name}</h3>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingTopicId(topic.id);
                                setEditingTopicName(topic.name);
                              }}
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setDeletingId(topic.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-gray-700 inline-flex items-center gap-1">
                          <Target className="w-4 h-4" />
                          {topic._count?.questions || 0} questions • {topic._count?.subTopics || 0} Sub-topics
                        </div>
                        <div className="mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              subjectId && router.push(`/admin/questions/${subjectId}/${topic.id}`)
                            }
                          >
                            Manage questions
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="ml-2"
                            onClick={() => router.push(`/admin/topics/${topic.id}/subtopics`)}
                          >
                            Sub-Topics
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          value={editingTopicName}
                          onChange={(e) => setEditingTopicName(e.target.value)}
                          className="flex-1 p-2 border rounded-lg text-gray-900"
                        />
                        <Button
                          size="sm"
                          onClick={() =>
                            editingTopicName.trim() &&
                            updateTopic.mutate({ id: topic.id, name: editingTopicName.trim() })
                          }
                          disabled={!editingTopicName.trim() || updateTopic.isPending}
                        >
                          <Save className="w-4 h-4 mr-1" /> Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingTopicId(null);
                            setEditingTopicName('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-700">No topics found.</p>
            )}

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1}
                >
                  Prev
                </Button>
                <span className="text-sm text-gray-800">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <ConfirmationDialog
        isOpen={Boolean(deletingId)}
        title="Delete Topic?"
        message="This will remove the topic and may remove related questions depending on cascade rules. Continue?"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => deletingId && deleteTopic.mutate(deletingId)}
        onCancel={() => setDeletingId(null)}
        variant="danger"
      />
    </div>
  );
}
