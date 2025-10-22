'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Topic {
  id: string;
  name: { en: string; hi: string };
  description: { en: string; hi: string } | null;
  slug: string;
  subject: {
    id: string;
    name: { en: string; hi: string };
  };
  questionCount: number;
  hasHindiTranslation: boolean;
}

interface TranslationTopicsListProps {
  onUpdate: () => void;
}

export function TranslationTopicsList({ onUpdate }: TranslationTopicsListProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hindiName, setHindiName] = useState('');
  const [hindiDescription, setHindiDescription] = useState('');

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/translations/topics`,
        { credentials: 'include' }
      );

      if (!response.ok) throw new Error('Failed to fetch topics');

      const data = await response.json();
      setTopics(data.data);
    } catch (error) {
      console.error('Error fetching topics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (topic: Topic) => {
    setEditingTopic(topic);
    setHindiName(topic.name.hi || '');
    setHindiDescription(topic.description?.hi || '');
  };

  const handleSave = async () => {
    if (!editingTopic) return;

    if (!hindiName.trim()) {
      alert('Hindi name is required');
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/translations/topics/${editingTopic.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: {
              en: editingTopic.name.en,
              hi: hindiName
            },
            description: editingTopic.description ? {
              en: editingTopic.description.en,
              hi: hindiDescription
            } : null
          })
        }
      );

      if (!response.ok) throw new Error('Failed to save translation');

      alert('Topic translation saved successfully');

      setEditingTopic(null);
      fetchTopics();
      onUpdate();
    } catch (error) {
      console.error('Error saving translation:', error);
      alert('Failed to save translation');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Card className="p-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          </div>
        ) : (
          <div className="space-y-4">
            {topics.map((topic) => (
              <div key={topic.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium">{topic.name.en}</p>
                    {topic.name.hi && (
                      <p className="text-sm text-gray-600 mt-1">
                        [translate:{topic.name.hi}]
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {topic.subject.name.en} • {topic.questionCount} questions
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      topic.hasHindiTranslation
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {topic.hasHindiTranslation ? '✓ Translated' : '✗ Untranslated'}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(topic)}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Edit Modal */}
      {editingTopic && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Translate Topic</h2>
                <button
                  onClick={() => setEditingTopic(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    English Name <span className="text-xs bg-gray-100 px-2 py-1 rounded">Read-only</span>
                  </label>
                  <input
                    type="text"
                    value={editingTopic.name.en}
                    disabled
                    className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Hindi Name [translate:हिन्दी नाम]
                  </label>
                  <input
                    type="text"
                    value={hindiName}
                    onChange={(e) => setHindiName(e.target.value)}
                    placeholder="[translate:यहाँ हिन्दी नाम लिखें...]"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {editingTopic.description && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        English Description <span className="text-xs bg-gray-100 px-2 py-1 rounded">Read-only</span>
                      </label>
                      <input
                        type="text"
                        value={editingTopic.description.en}
                        disabled
                        className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                        readOnly
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Hindi Description [translate:हिन्दी विवरण]
                      </label>
                      <input
                        type="text"
                        value={hindiDescription}
                        onChange={(e) => setHindiDescription(e.target.value)}
                        placeholder="[translate:यहाँ हिन्दी विवरण लिखें...]"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setEditingTopic(null)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  )}
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}