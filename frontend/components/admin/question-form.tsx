'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { API_URL } from '@/lib/config';
import { useToast } from '@/providers/toast-provider';

interface QuestionFormProps {
  question?: {
    id: string;
    text: string;
    options: Array<{ id: string; text: string }>;
    correctAnswerId: string;
    explanation?: string;
    difficulty: string;
    pyq?: string | null;
    topic: {
      id: string;
    };
  } | null;
  defaultTopicId?: string;
  onClose: () => void;
  onSave: () => void;
}

interface Topic {
  id: string;
  name: string;
  subject: {
    name: string;
  };
}

interface SubTopic {
  id: string;
  name: string;
  topicId: string;
}

const initialOptions = [
  { id: 'a', text: '' },
  { id: 'b', text: '' },
  { id: 'c', text: '' },
  { id: 'd', text: '' },
];

const createInitialFormData = (topicId = '') => ({
  text: '',
  options: initialOptions.map((option) => ({ ...option })),
  correctAnswerId: 'a',
  explanation: '',
  difficulty: 'medium',
  topicId,
  subTopicId: '',
  pyq: '',
});

export function QuestionForm({ question, defaultTopicId, onClose, onSave }: QuestionFormProps) {
  const { user } = useUser();
  const router = useRouter();
  const [formData, setFormData] = useState(createInitialFormData(defaultTopicId));
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subTopics, setSubTopics] = useState<SubTopic[]>([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchTopics();
  }, [user]);

  useEffect(() => {
    if (formData.topicId) {
      fetchSubTopics(formData.topicId);
    } else {
      setSubTopics([]);
    }
  }, [formData.topicId, user]);

  useEffect(() => {
    if (question) {
      setFormData({
        text: question.text,
        options: question.options.map((option) => ({ ...option })),
        correctAnswerId: question.correctAnswerId,
        explanation: question.explanation || '',
        difficulty: question.difficulty,
        topicId: question.topic.id,
        subTopicId: (question as any).subTopicId || '',
        pyq: question.pyq ?? '',
      });
      return;
    }

    setFormData(createInitialFormData(defaultTopicId));
  }, [question, defaultTopicId]);

  const fetchTopics = async () => {
    if (!user) return;

    try {
      const response = await fetch(`${API_URL}/admin/topics`, {
        headers: {
          'x-clerk-user-id': user.id,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setTopics(data);
      }
    } catch (error) {
      console.error('Failed to fetch topics:', error);
    }
  };

  const fetchSubTopics = async (topicId: string) => {
    if (!user || !topicId) return;

    try {
      const response = await fetch(`${API_URL}/admin/topics/${topicId}/subtopics`, {
        headers: {
          'x-clerk-user-id': user.id,
        },
      });
      if (response.ok) {
        const data = await response.json();
        // Support both array payloads and paginated { items } payloads
        const items = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
        setSubTopics(items);
      }
    } catch (error) {
      console.error('Failed to fetch subtopics:', error);
      setSubTopics([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = question
        ? `${API_URL}/admin/questions/${question.id}`
        : `${API_URL}/admin/questions`;

      const method = question ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-clerk-user-id': user!.id,
        },
        body: JSON.stringify({
          ...formData,
          subTopicId: formData.subTopicId || null,
          pyq: formData.pyq.trim() || null,
        }),
      });

      if (response.ok) {
        showToast({
          variant: 'success',
          title: question ? 'Question updated successfully.' : 'Question created successfully.',
        });
        onSave();
      } else {
        let message = 'Failed to save question';
        try {
          const data = await response.json();
          message = data?.error || message;
        } catch {
          // ignore JSON parsing errors
        }
        showToast({ variant: 'error', title: message });
      }
    } catch (error) {
      console.error('Failed to save question:', error);
      showToast({ variant: 'error', title: 'Failed to save question' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
          <CardTitle>{question ? 'Edit Question' : 'Add Question'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Topic
              </label>
              <select
                value={formData.topicId}
                onChange={(e) => setFormData({ ...formData, topicId: e.target.value, subTopicId: '' })}
                className="w-full p-2 border rounded-lg"
                required
              >
                <option value="">Select a topic</option>
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.subject.name} - {topic.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sub-Topic (Optional)
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={formData.subTopicId}
                  onChange={(e) => setFormData({ ...formData, subTopicId: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  disabled={!formData.topicId}
                >
                  <option value="">Select a sub-topic (optional)</option>
                  {subTopics.map((subTopic) => (
                    <option key={subTopic.id} value={subTopic.id}>
                      {subTopic.name}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => formData.topicId && router.push(`/admin/topics/${formData.topicId}/subtopics`)}
                  disabled={!formData.topicId}
                  title="Manage sub-topics for this topic"
                >
                  Manage
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question Text
              </label>
              <textarea
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                className="w-full p-2 border rounded-lg"
                rows={3}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Options
              </label>
              {formData.options.map((option, index) => (
                <div key={option.id} className="flex gap-2 mb-2">
                  <span className="w-8 pt-2">{option.id.toUpperCase()}.</span>
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => {
                      const newOptions = [...formData.options];
                      newOptions[index].text = e.target.value;
                      setFormData({ ...formData, options: newOptions });
                    }}
                    className="flex-1 p-2 border rounded-lg"
                    required
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correct Answer
              </label>
              <select
                value={formData.correctAnswerId}
                onChange={(e) => setFormData({ ...formData, correctAnswerId: e.target.value })}
                className="w-full p-2 border rounded-lg"
              >
                {formData.options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.id.toUpperCase()}. {option.text || '(empty)'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="w-full p-2 border rounded-lg"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PYQ Label (Optional)
              </label>
              <input
                type="text"
                value={formData.pyq}
                onChange={(e) => setFormData({ ...formData, pyq: e.target.value })}
                className="w-full p-2 border rounded-lg"
                placeholder="e.g. [2024] or JEE Main 2023"
              />
              <p className="mt-1 text-xs text-gray-500">
                Shown as a badge (Previous Year Question). Leave blank if not applicable.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Explanation (Optional)
              </label>
              <textarea
                value={formData.explanation}
                onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                className="w-full p-2 border rounded-lg"
                rows={2}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Question'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
