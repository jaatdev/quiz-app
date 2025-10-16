'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { Plus, Edit, Trash2, BookOpen, FileText, X, Download, Loader2, Upload } from 'lucide-react';
import { API_URL } from '@/lib/config';
import { useToast } from '@/providers/toast-provider';

interface Subject {
  id: string;
  name: string;
  topics: Topic[];
}

interface Topic {
  id: string;
  name: string;
  notesUrl?: string | null;
  _count?: {
    questions: number;
    subTopics?: number;
  };
}

export default function SubjectManagementPage() {
  const { user } = useUser();
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [downloadingTopicId, setDownloadingTopicId] = useState<string | null>(null);
  const { showToast } = useToast();
  const subjectsFileInputRef = useRef<HTMLInputElement>(null);
  const topicsFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSubjects();
  }, [user]);

  const fetchSubjects = async () => {
    if (!user) return;

    try {
      const response = await fetch(`${API_URL}/admin/subjects`, {
        headers: {
          'x-clerk-user-id': user.id,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubjects(data);
      }
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadNotes = async (topic: Topic) => {
    if (!topic.notesUrl) {
      showToast({ variant: 'error', title: 'No notes available for this topic.' });
      return;
    }

    setDownloadingTopicId(topic.id);
    try {
      const downloadUrl = `/api/download/note/${encodeURIComponent(topic.id)}`;
      const response = await fetch(downloadUrl, { credentials: 'include' });

      if (!response.ok) {
        const text = await response.text().catch(() => null);
        throw new Error(text || `Failed to download notes (${response.status}).`);
      }

      const contentDisposition = response.headers.get('content-disposition') ?? '';
      const match = /filename\*?=(?:UTF-8'')?"?([^;"\n]+)/i.exec(contentDisposition);
      const safeTopic = (topic.name || 'notes')
        .replace(/[^a-z0-9._-]+/gi, '_')
        .replace(/_{2,}/g, '_')
        .replace(/^_+|_+$/g, '') || 'notes';
      const filename = match && match[1] ? decodeURIComponent(match[1]) : `${safeTopic}-notes.pdf`;

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast({ variant: 'success', title: 'Notes download started.' });
    } catch (error) {
      console.error('Failed to download notes:', error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Failed to download notes. Please try again.';
      showToast({ variant: 'error', title: message });
    } finally {
      setDownloadingTopicId(null);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!confirm('Are you sure? This will delete all topics and questions under this subject.')) return;

    try {
      const response = await fetch(`${API_URL}/admin/subjects/${id}`, {
        method: 'DELETE',
        headers: {
          'x-clerk-user-id': user!.id,
        },
      });

      if (response.ok) {
        setSubjects(prev => prev.filter(s => s.id !== id));
        showToast({ variant: 'success', title: 'Subject deleted successfully.' });
      } else {
        let data: any = null;
        try {
          data = await response.json();
        } catch {
          data = null;
        }
        showToast({ variant: 'error', title: data?.error || 'Failed to delete subject.' });
      }
    } catch (error) {
      console.error('Failed to delete subject:', error);
      showToast({ variant: 'error', title: 'Failed to delete subject.' });
    }
  };

  const handleDeleteTopic = async (id: string) => {
    if (!confirm('Are you sure? This will delete all questions under this topic.')) return;

    try {
      const response = await fetch(`${API_URL}/admin/topics/${id}`, {
        method: 'DELETE',
        headers: {
          'x-clerk-user-id': user!.id,
        },
      });

      if (response.ok) {
        await fetchSubjects();
        showToast({ variant: 'success', title: 'Topic deleted successfully.' });
      } else {
        let data: any = null;
        try {
          data = await response.json();
        } catch {
          data = null;
        }
        showToast({ variant: 'error', title: data?.error || 'Failed to delete topic.' });
      }
    } catch (error) {
      console.error('Failed to delete topic:', error);
      showToast({ variant: 'error', title: 'Failed to delete topic.' });
    }
  };

  // CSV Export for Subjects
  const handleExportSubjects = () => {
    try {
      const csvContent = [
        ['Subject Name'].join(','),
        ...subjects.map(s => [s.name].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `subjects_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      showToast({ variant: 'success', title: 'Subjects exported successfully.' });
    } catch (error) {
      console.error('Failed to export subjects:', error);
      showToast({ variant: 'error', title: 'Failed to export subjects.' });
    }
  };

  // CSV Import for Subjects
  const handleImportSubjects = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        
        // Skip header if present
        const start = lines[0]?.toLowerCase().includes('subject') ? 1 : 0;
        const names = lines.slice(start).map(l => l.replace(/^"|"$/g, '').trim()).filter(Boolean);

        if (names.length === 0) {
          showToast({ variant: 'error', title: 'No valid subjects found in CSV.' });
          return;
        }

        const response = await fetch(`${API_URL}/admin/subjects/bulk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-clerk-user-id': user!.id,
          },
          body: JSON.stringify({ names }),
        });

        if (response.ok) {
          const data = await response.json();
          await fetchSubjects();
          showToast({ 
            variant: 'success', 
            title: `Imported ${data.created} subjects. ${data.duplicates?.length || 0} duplicates skipped.` 
          });
        } else {
          const data = await response.json();
          showToast({ variant: 'error', title: data?.error || 'Failed to import subjects.' });
        }
      } catch (error) {
        console.error('Failed to import subjects:', error);
        showToast({ variant: 'error', title: 'Failed to import subjects.' });
      } finally {
        // Reset file input
        if (subjectsFileInputRef.current) {
          subjectsFileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  // CSV Export for Topics
  const handleExportTopics = () => {
    try {
      const rows: string[][] = [['Subject Name', 'Topic Name']];
      
      subjects.forEach(subject => {
        subject.topics.forEach(topic => {
          rows.push([subject.name, topic.name]);
        });
      });

      const csvContent = rows.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `topics_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      showToast({ variant: 'success', title: 'Topics exported successfully.' });
    } catch (error) {
      console.error('Failed to export topics:', error);
      showToast({ variant: 'error', title: 'Failed to export topics.' });
    }
  };

  // CSV Export for ALL Sub-Topics across ALL subjects
  const handleExportAllSubTopics = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/subjects-with-topics`, {
        headers: { 'x-clerk-user-id': user!.id },
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Failed to fetch subjects');
      const subjects = await res.json();

      const rows: Array<{ subjectName: string; topicName: string; subTopicId: string; subTopicName: string; questionsCount: number }>= [];
      for (const s of subjects || []) {
        for (const t of (s.topics || [])) {
          let page = 1;
          const pageSize = 200;
          let totalPages = 1;
          while (page <= totalPages) {
            const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
            const stRes = await fetch(`${API_URL}/admin/topics/${t.id}/subtopics?` + params.toString(), {
              headers: { 'x-clerk-user-id': user!.id },
              cache: 'no-store',
            });
            if (!stRes.ok) break;
            const stData = await stRes.json();
            totalPages = stData.totalPages || 1;
            (stData.items || []).forEach((st: any) => {
              rows.push({
                subjectName: s.name,
                topicName: t.name,
                subTopicId: st.id,
                subTopicName: st.name,
                questionsCount: st._count?.questions || 0,
              });
            });
            page++;
          }
        }
      }

      if (!rows.length) {
        showToast({ variant: 'info', title: 'No sub-topics to export.' });
        return;
      }

      const headers = ['subjectName','topicName','subTopicId','subTopicName','questionsCount'];
      const esc = (s: any) => s == null ? '' : /[",\n]/.test(String(s)) ? `"${String(s).replace(/"/g, '""')}"` : String(s);
      const csv = [headers.join(','), ...rows.map(r => headers.map(h => esc((r as any)[h])).join(','))].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `all-subtopics_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      showToast({ variant: 'success', title: 'Sub-Topics exported successfully.' });
    } catch (error) {
      console.error('Failed to export sub-topics:', error);
      showToast({ variant: 'error', title: 'Failed to export sub-topics.' });
    }
  };

  // CSV Import for Topics
  const handleImportTopics = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        
        // Skip header if present
        const start = lines[0]?.toLowerCase().includes('subject') ? 1 : 0;
        const rows = lines.slice(start).map(line => {
          const [subjectName, topicName] = line.split(',').map(s => s.replace(/^"|"$/g, '').trim());
          return { subjectName, topicName };
        }).filter(r => r.subjectName && r.topicName);

        if (rows.length === 0) {
          showToast({ variant: 'error', title: 'No valid topics found in CSV.' });
          return;
        }

        const response = await fetch(`${API_URL}/admin/topics/bulk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-clerk-user-id': user!.id,
          },
          body: JSON.stringify({ rows }),
        });

        if (response.ok) {
          const data = await response.json();
          await fetchSubjects();
          showToast({ 
            variant: 'success', 
            title: `Imported ${data.created} topics. ${data.duplicates?.length || 0} duplicates skipped.` 
          });
        } else {
          const data = await response.json();
          showToast({ variant: 'error', title: data?.error || 'Failed to import topics.' });
        }
      } catch (error) {
        console.error('Failed to import topics:', error);
        showToast({ variant: 'error', title: 'Failed to import topics.' });
      } finally {
        // Reset file input
        if (topicsFileInputRef.current) {
          topicsFileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Subject & Topic Management</h1>
        <p className="text-gray-600">Organize your quiz content structure</p>
      </div>

      {/* Add Subject Button */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setShowSubjectForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Subject
          </Button>
          
          {/* Subjects CSV Actions */}
          <Button variant="outline" onClick={handleExportSubjects}>
            <Download className="w-4 h-4 mr-2" />
            Export Subjects CSV
          </Button>
          <Button variant="outline" onClick={() => subjectsFileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" />
            Import Subjects CSV
          </Button>
          <input
            ref={subjectsFileInputRef}
            type="file"
            accept=".csv"
            onChange={handleImportSubjects}
            className="hidden"
          />
          
          {/* Topics CSV Actions */}
          <Button variant="outline" onClick={handleExportTopics}>
            <Download className="w-4 h-4 mr-2" />
            Export Topics CSV
          </Button>
          <Button variant="outline" onClick={handleExportAllSubTopics}>
            <Download className="w-4 h-4 mr-2" />
            Export ALL Sub-Topics CSV
          </Button>
          <Button variant="outline" onClick={() => topicsFileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" />
            Import Topics CSV
          </Button>
          <input
            ref={topicsFileInputRef}
            type="file"
            accept=".csv"
            onChange={handleImportTopics}
            className="hidden"
          />
        </div>
      </div>

      {/* Subjects Grid */}
      <div className="grid gap-6">
        {subjects.map((subject) => (
          <Card key={subject.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <CardTitle>{subject.name}</CardTitle>
                  <span className="text-sm text-gray-700">
                    {subject.topics.length} topics
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/subject/${subject.id}`)}
                  >
                    Manage topics
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingSubject(subject);
                      setShowSubjectForm(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteSubject(subject.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                {subject.topics.map((topic) => {
                  const notesAvailable = Boolean(topic.notesUrl);

                  return (
                    <div
                      key={topic.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-gray-900">{topic.name}</span>
                        <span className="text-sm text-gray-500">
                          {topic._count?.questions || 0} questions • {topic._count?.subTopics || 0} Sub-topics
                        </span>
                        <span
                          className={`text-xs font-medium ${notesAvailable ? 'text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full' : 'text-gray-400 italic'}`}
                        >
                          {notesAvailable ? 'Notes PDF' : 'No notes'}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/topics/${topic.id}/subtopics`)}
                        >
                          Sub-Topics
                        </Button>
                        {notesAvailable && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadNotes(topic)}
                            disabled={downloadingTopicId === topic.id}
                          >
                            {downloadingTopicId === topic.id ? (
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            ) : (
                              <Download className="w-3 h-3 mr-1" />
                            )}
                            {downloadingTopicId === topic.id ? 'Preparing...' : 'Notes'}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingTopic(topic);
                            setSelectedSubjectId(subject.id);
                            setShowTopicForm(true);
                          }}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteTopic(topic.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedSubjectId(subject.id);
                  setShowTopicForm(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Topic
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Subject Form Modal */}
      {showSubjectForm && (
        <SubjectForm
          subject={editingSubject}
          onClose={() => {
            setShowSubjectForm(false);
            setEditingSubject(null);
          }}
          onSave={() => {
            fetchSubjects();
            setShowSubjectForm(false);
            setEditingSubject(null);
          }}
        />
      )}

      {/* Topic Form Modal */}
      {showTopicForm && (
        <TopicForm
          topic={editingTopic}
          subjectId={selectedSubjectId!}
          onClose={() => {
            setShowTopicForm(false);
            setEditingTopic(null);
            setSelectedSubjectId(null);
          }}
          onSave={() => {
            fetchSubjects();
            setShowTopicForm(false);
            setEditingTopic(null);
            setSelectedSubjectId(null);
          }}
        />
      )}
    </div>
  );
}

// Subject Form Component
function SubjectForm({ subject, onClose, onSave }: any) {
  const { user } = useUser();
  const [name, setName] = useState(subject?.name || '');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const url = subject
        ? `${API_URL}/admin/subjects/${subject.id}`
        : `${API_URL}/admin/subjects`;
      
      const method = subject ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-clerk-user-id': user!.id,
        },
        body: JSON.stringify({ name }),
      });

      if (response.ok) {
        showToast({
          variant: 'success',
          title: subject ? 'Subject updated successfully.' : 'Subject created successfully.',
        });
        onSave();
      } else {
        let data: any = null;
        try {
          data = await response.json();
        } catch {
          data = null;
        }
        setErrorMessage(data?.error || 'Failed to save subject');
        showToast({ variant: 'error', title: data?.error || 'Failed to save subject' });
      }
    } catch (error) {
      console.error('Failed to save subject:', error);
      setErrorMessage('Failed to save subject');
      showToast({ variant: 'error', title: 'Failed to save subject' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
          <CardTitle>{subject ? 'Edit Subject' : 'Add Subject'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            {errorMessage && (
              <p className="mb-3 text-sm text-red-600">{errorMessage}</p>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Topic Form Component
function TopicForm({ topic, subjectId, onClose, onSave }: any) {
  const { user } = useUser();
  const [name, setName] = useState(topic?.name || '');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notesFile, setNotesFile] = useState<File | null>(null);
  const [isRemovingNotes, setIsRemovingNotes] = useState(false);
  const { showToast } = useToast();
  const currentNotesLink = topic?.notesUrl && topic?.id
    ? `/api/download/note/${encodeURIComponent(topic.id)}`
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId) {
      setErrorMessage('Select a subject before saving the topic.');
      return;
    }
    setLoading(true);
    setErrorMessage(null);

    try {
      const url = topic
        ? `${API_URL}/admin/topics/${topic.id}`
        : `${API_URL}/admin/topics`;
      
      const method = topic ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-clerk-user-id': user!.id,
        },
        body: JSON.stringify({ name, subjectId }),
      });

      if (response.ok) {
        let savedTopic: any = null;
        try {
          savedTopic = await response.json();
        } catch {
          savedTopic = null;
        }

        let uploadError: string | null = null;

        if (notesFile && savedTopic?.id) {
          try {
            const formData = new FormData();
            formData.append('notes', notesFile);

            const uploadResponse = await fetch(`${API_URL}/admin/topics/${savedTopic.id}/notes`, {
              method: 'POST',
              headers: {
                'x-clerk-user-id': user!.id,
              },
              body: formData,
            });

            if (!uploadResponse.ok) {
              let uploadData: any = null;
              try {
                uploadData = await uploadResponse.json();
              } catch {
                uploadData = null;
              }
              uploadError = uploadData?.error || 'Topic saved, but uploading notes failed. Please try again.';
            }
          } catch (uploadErr) {
            console.error('Failed to upload notes:', uploadErr);
            uploadError = 'Topic saved, but uploading notes failed. Please try again.';
          }
        }

        setNotesFile(null);
        setErrorMessage(null);

        showToast({
          variant: 'success',
          title: topic ? 'Topic updated successfully.' : 'Topic created successfully.',
        });

        if (uploadError) {
          setErrorMessage(uploadError);
          showToast({ variant: 'error', title: uploadError });
        }

        onSave();
      } else {
        let data: any = null;
        try {
          data = await response.json();
        } catch {
          data = null;
        }
        setErrorMessage(data?.error || 'Failed to save topic');
        showToast({ variant: 'error', title: data?.error || 'Failed to save topic' });
      }
    } catch (error) {
      console.error('Failed to save topic:', error);
      setErrorMessage('Failed to save topic');
      showToast({ variant: 'error', title: 'Failed to save topic' });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveNotes = async () => {
    if (!topic?.id) return;

    setIsRemovingNotes(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`${API_URL}/admin/topics/${topic.id}/notes`, {
        method: 'DELETE',
        headers: {
          'x-clerk-user-id': user!.id,
        },
      });

      if (response.ok) {
        showToast({ variant: 'success', title: 'Notes removed successfully.' });
        onSave();
      } else {
        let data: any = null;
        try {
          data = await response.json();
        } catch {
          data = null;
        }
        const message = data?.error || 'Failed to remove notes';
        setErrorMessage(message);
        showToast({ variant: 'error', title: message });
      }
    } catch (error) {
      console.error('Failed to remove notes:', error);
      const message = 'Failed to remove notes';
      setErrorMessage(message);
      showToast({ variant: 'error', title: message });
    } finally {
      setIsRemovingNotes(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
          <CardTitle>{topic ? 'Edit Topic' : 'Add Topic'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            {errorMessage && (
              <p className="mb-3 text-sm text-red-600">{errorMessage}</p>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Topic Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes PDF (optional)
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(event) => setNotesFile(event.target.files?.[0] || null)}
                className="w-full text-sm text-gray-700"
              />
              <p className="mt-1 text-xs text-gray-500">
                Uploading a new file will replace any existing notes. Maximum size 10MB.
              </p>
              {notesFile && (
                <div className="mt-2 flex items-center justify-between rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                  <span className="truncate" title={notesFile.name}>
                    Selected: {notesFile.name}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setNotesFile(null)}
                  >
                    Clear
                  </Button>
                </div>
              )}
              {currentNotesLink && (
                <div className="mt-3 flex items-center justify-between rounded border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                  <a
                    href={currentNotesLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold underline"
                  >
                    View current notes
                  </a>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveNotes}
                    disabled={isRemovingNotes || loading}
                  >
                    {isRemovingNotes ? 'Removing...' : 'Remove Notes'}
                  </Button>
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

