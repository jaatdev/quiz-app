'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { Plus, Edit, Trash2, BookOpen, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Subject {
  id: string;
  name: string;
  topics: Topic[];
}

interface Topic {
  id: string;
  name: string;
  _count?: {
    questions: number;
  };
}

export default function SubjectManagementPage() {
  const { user } = useUser();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  useEffect(() => {
    fetchSubjects();
  }, [user]);

  const fetchSubjects = async () => {
    if (!user) return;

    try {
      const response = await fetch('http://localhost:5001/api/admin/subjects', {
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

  const handleDeleteSubject = async (id: string) => {
    if (!confirm('Are you sure? This will delete all topics and questions under this subject.')) return;

    try {
      const response = await fetch(`http://localhost:5001/api/admin/subjects/${id}`, {
        method: 'DELETE',
        headers: {
          'x-clerk-user-id': user!.id,
        },
      });

      if (response.ok) {
        setSubjects(subjects.filter(s => s.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete subject:', error);
    }
  };

  const handleDeleteTopic = async (id: string) => {
    if (!confirm('Are you sure? This will delete all questions under this topic.')) return;

    try {
      const response = await fetch(`http://localhost:5001/api/admin/topics/${id}`, {
        method: 'DELETE',
        headers: {
          'x-clerk-user-id': user!.id,
        },
      });

      if (response.ok) {
        fetchSubjects();
      }
    } catch (error) {
      console.error('Failed to delete topic:', error);
    }
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
        <Button onClick={() => setShowSubjectForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Subject
        </Button>
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
                {subject.topics.map((topic) => (
                  <div
                    key={topic.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-gray-600" />
                      <span className="font-medium text-gray-900">{topic.name}</span>
                      <span className="text-sm text-gray-500">
                        {topic._count?.questions || 0} questions
                      </span>
                    </div>
                    <div className="flex gap-2">
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
                ))}
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = subject
        ? `http://localhost:5001/api/admin/subjects/${subject.id}`
        : 'http://localhost:5001/api/admin/subjects';
      
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
        onSave();
      }
    } catch (error) {
      console.error('Failed to save subject:', error);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = topic
        ? `http://localhost:5001/api/admin/topics/${topic.id}`
        : 'http://localhost:5001/api/admin/topics';
      
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
        onSave();
      }
    } catch (error) {
      console.error('Failed to save topic:', error);
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
          <CardTitle>{topic ? 'Edit Topic' : 'Add Topic'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
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
