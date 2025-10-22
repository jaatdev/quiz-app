'use client';

import { useUser } from '@clerk/nextjs';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useToast } from '@/providers/toast-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { Error } from '@/components/ui/error';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { ArrowLeft, Search, Plus, Edit3, Save, Trash2, Target } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function AdminSubTopicsPage() {
  const { user } = useUser();
  const params = useParams();
  const router = useRouter();
  const topicId = params.topicId as string;
  const { showToast } = useToast();

  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [q, setQ] = useState('');
  const [createName, setCreateName] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Topic meta (name + subject)
  const { data: topicMeta, isLoading: loadingTopic } = useQuery({
    queryKey: ['admin-topic-meta', topicId],
    queryFn: async () => {
      const res = await fetch(`${API}/admin/topics/${topicId}`, {
        headers: { 'x-clerk-user-id': user?.id || '' },
        cache: 'no-store'
      });
      if (!res.ok) throw new window.Error('Failed to load topic');
      return res.json() as Promise<{ id: string; name: string; subject: { id: string; name: string } }>;
    },
    enabled: !!user && !!topicId
  });

  // Sub-topics list with pagination
  const { data, isLoading, error: queryError, refetch } = useQuery({
    queryKey: ['admin-subtopics', topicId, page, pageSize, q],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), q });
      const res = await fetch(`${API}/admin/topics/${topicId}/subtopics?` + params.toString(), {
        headers: { 'x-clerk-user-id': user?.id || '' },
        cache: 'no-store'
      });
      if (!res.ok) throw new window.Error('Failed to load sub-topics');
      return res.json() as Promise<{ items: any[]; total: number; totalPages: number; page: number; pageSize: number }>;
    },
    enabled: !!user && !!topicId
  });

  const items = data?.items || [];
  const totalPages = data?.totalPages || 1;

  const createSubTopic = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch(`${API}/admin/subtopics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-clerk-user-id': user?.id || '' },
        body: JSON.stringify({ name, topicId })
      });
      const data = await res.json();
      if (!res.ok) throw new window.Error(data?.error || 'Create failed');
      return data;
    },
    onSuccess: () => { setCreateName(''); refetch(); }
  });

  const updateSubTopic = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const res = await fetch(`${API}/admin/subtopics/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-clerk-user-id': user?.id || '' },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      if (!res.ok) throw new window.Error(data?.error || 'Update failed');
      return data;
    },
    onSuccess: () => { setEditingId(null); setEditingName(''); refetch(); }
  });

  const deleteSubTopic = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API}/admin/subtopics/${id}`, {
        method: 'DELETE',
        headers: { 'x-clerk-user-id': user?.id || '' }
      });
      const data = await res.json();
      if (!res.ok) throw new window.Error(data?.error || 'Delete failed');
      return data;
    },
    onSuccess: () => { setDeleteId(null); refetch(); }
  });

  const bulkCreate = useMutation({
    mutationFn: async (names: string[]) => {
      const res = await fetch(`${API}/admin/topics/${topicId}/subtopics/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-clerk-user-id': user?.id || '' },
        body: JSON.stringify({ names })
      });
      const data = await res.json();
      if (!res.ok) throw new window.Error(data?.error || 'Bulk create failed');
      return data as { success: boolean; created: number; duplicates: string[] };
    },
    onSuccess: () => { setBulkText(''); setPage(1); refetch(); }
  });

  // CSV Export/Import helpers
  const toCSV = (rows: any[]) => {
    const headers = ['id', 'name', 'topicId', 'questionsCount'];
    const esc = (s: any) => {
      if (s == null) return '';
      const str = String(s);
      return /[,"\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    };
    const lines = [headers.join(','), ...rows.map(r => headers.map(h => esc(r[h])).join(','))];
    return lines.join('\n');
  };

  const fetchAllSubTopics = async () => {
    const pageSize = 200;
    let page = 1;
    let all: any[] = [];
    while (true) {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      const res = await fetch(`${API}/admin/topics/${topicId}/subtopics?` + params.toString(), {
        headers: { 'x-clerk-user-id': user?.id || '' },
        cache: 'no-store'
      });
      if (!res.ok) break;
      const data = await res.json();
      const items = (data.items || []).map((st: any) => ({
        id: st.id,
        name: st.name,
        topicId: st.topicId,
        questionsCount: st._count?.questions || 0
      }));
      all = all.concat(items);
      if (page >= (data.totalPages || 1)) break;
      page++;
    }
    return all;
  };

  if (!user || isLoading || loadingTopic) {
    return <div className="min-h-screen flex items-center justify-center"><Loading /></div>;
  }
  if (queryError) {
    return <div className="min-h-screen flex items-center justify-center"><Error onRetry={()=>refetch()} /></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" onClick={()=>router.back()} aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Sub-Topics • {topicMeta?.name} <span className="text-sm text-gray-700 dark:text-gray-400">({topicMeta?.subject?.name})</span>
            </h1>
            <p className="text-sm text-gray-700 dark:text-gray-300">Manage sub-topics, edit names, and bulk create</p>
          </div>
        </div>
        <Button variant="outline" onClick={()=>router.push(`/admin/questions/${topicMeta?.subject?.id}/${topicId}`)}>
          Manage Questions
        </Button>
      </div>

      {/* Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search & Create</CardTitle>
          <CardDescription className="text-gray-700 dark:text-gray-300">Create sub-topics or search</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 dark:text-gray-400" />
              <input
                value={q}
                onChange={(e)=>{ setQ(e.target.value); setPage(1); }}
                placeholder="Search sub-topics..."
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-gray-900 dark:text-gray-100 dark:bg-gray-800"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                value={createName}
                onChange={(e)=>setCreateName(e.target.value)}
                placeholder="New sub-topic name"
                className="p-2 border rounded-lg text-gray-900 dark:text-gray-100 dark:bg-gray-800"
              />
              <Button onClick={()=>createName.trim() && createSubTopic.mutate(createName.trim())}>
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
          </div>

          <div className="mt-4 rounded-lg border p-4">
            <div className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Bulk create (one per line)</div>
            <textarea
              value={bulkText}
              onChange={(e)=>setBulkText(e.target.value)}
              rows={5}
              className="w-full p-2 border rounded-lg text-gray-900 dark:text-gray-100 dark:bg-gray-800"
              placeholder={'Basics\nArrays\nLoops\nPointers'}
            />
            <div className="mt-2">
              <Button
                variant="outline"
                onClick={()=>{
                  const names = Array.from(new Set(bulkText.split('\n').map(s=>s.trim()).filter(Boolean)));
                  if (names.length) bulkCreate.mutate(names);
                }}
                disabled={!bulkText.trim()}
              >
                Bulk Create
              </Button>
            </div>
          </div>

          {/* CSV Export/Import */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                const all = await fetchAllSubTopics();
                if (!all.length) { showToast({ variant: 'info', title: 'No sub-topics to export.' }); return; }
                const csv = toCSV(all);
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'subtopics.csv';
                a.click();
                URL.revokeObjectURL(url);
                showToast({ variant: 'success', title: 'Sub-topics exported.' });
              }}
            >
              Export CSV
            </Button>

            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={async (e) => {
                  try {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const text = await file.text();
                    const lines = text.split('\n').filter(Boolean);
                    if (lines.length <= 1) { showToast({ variant: 'error', title: 'Empty CSV' }); return; }
                    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                    const nameIdx = headers.indexOf('name');
                    if (nameIdx === -1) { showToast({ variant: 'error', title: 'CSV must contain "name" column' }); return; }
                    const names = Array.from(new Set(lines.slice(1).map(line => {
                      const cols = line.split(',');
                      return (cols[nameIdx] || '').replace(/^"|"$/g, '').trim();
                    }).filter(Boolean)));
                    if (!names.length) { showToast({ variant: 'error', title: 'No valid names in CSV' }); return; }
                    const res = await fetch(`${API}/admin/topics/${topicId}/subtopics/bulk`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'x-clerk-user-id': user?.id || '' },
                      body: JSON.stringify({ names })
                    });
                    const data = await res.json();
                    if (!res.ok) throw new window.Error(data?.error || 'Import failed');
                    setPage(1);
                    refetch();
                    showToast({ variant: 'success', title: `Created: ${data.created}${data.duplicates?.length ? ` • Duplicates: ${data.duplicates.length}` : ''}` });
                  } catch (err: any) {
                    showToast({ variant: 'error', title: err?.message || 'Failed to import CSV' });
                  } finally {
                    e.target.value = '';
                  }
                }}
              />
              <Button variant="outline">Import CSV</Button>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader><CardTitle>Sub-Topics</CardTitle></CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="py-10 text-center text-gray-700 dark:text-gray-300">No sub-topics found.</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((st: any) => (
                <div key={st.id} className="p-4 border rounded-lg bg-white dark:bg-gray-900">
                  {editingId !== st.id ? (
                    <>
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{st.name}</h3>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={()=>{ setEditingId(st.id); setEditingName(st.name); }}>
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={()=>setDeleteId(st.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-700 dark:text-gray-300 inline-flex items-center gap-1">
                        <Target className="w-4 h-4" /> {st._count?.questions || 0} questions
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        value={editingName}
                        onChange={(e)=>setEditingName(e.target.value)}
                        className="flex-1 p-2 border rounded-lg text-gray-900 dark:text-gray-100 dark:bg-gray-800"
                      />
                      <Button size="sm" onClick={()=>editingName.trim() && updateSubTopic.mutate({ id: st.id, name: editingName.trim() })}>
                        <Save className="w-4 h-4 mr-1" /> Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={()=>{ setEditingId(null); setEditingName(''); }}>
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={()=>setPage(p=>Math.max(1, p-1))} disabled={page===1}>Prev</Button>
              <span className="text-sm text-gray-800 dark:text-gray-300">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" onClick={()=>setPage(p=>Math.min(totalPages, p+1))} disabled={page===totalPages}>Next</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmationDialog
        isOpen={!!deleteId}
        title="Delete Sub-Topic?"
        message="This will remove the sub-topic. Questions may be affected based on cascade setup."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={()=>deleteId && deleteSubTopic.mutate(deleteId)}
        onCancel={()=>setDeleteId(null)}
        variant="danger"
      />
    </div>
  );
}
