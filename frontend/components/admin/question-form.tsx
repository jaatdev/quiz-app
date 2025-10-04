'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { API_URL } from '@/lib/config';

interface QuestionFormProps {
  question?: {
    id: string;
    text: string;
    options: Array<{ id: string; text: string }>;
    correctAnswerId: string;
    explanation?: string;
    difficulty: string;
    topic: {
      id: string;
    };
  } | null;
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

export function QuestionForm({ question, onClose, onSave }: QuestionFormProps) {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    text: '',
    options: [
      { id: 'a', text: '' },
      { id: 'b', text: '' },
      { id: 'c', text: '' },
      { id: 'd', text: '' },
    ],
    correctAnswerId: 'a',
    explanation: '',
    difficulty: 'medium',
    topicId: '',
  });
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTopics();
    if (question) {
      setFormData({
        text: question.text,
        options: question.options,
        correctAnswerId: question.correctAnswerId,
        explanation: question.explanation || '',
        difficulty: question.difficulty,
        topicId: question.topic.id,
      });
    }
  }, [question]);

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
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSave();
      } else {
        alert('Failed to save question');
      }
    } catch (error) {
      console.error('Failed to save question:', error);
      alert('Failed to save question');
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
                onChange={(e) => setFormData({ ...formData, topicId: e.target.value })}
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
