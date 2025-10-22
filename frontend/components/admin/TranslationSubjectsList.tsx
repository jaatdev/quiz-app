'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Subject {
  id: string;
  name: { en: string; hi: string };
  description: { en: string; hi: string } | null;
  slug: string;
  topicCount: number;
  hasHindiTranslation: boolean;
}

interface TranslationSubjectsListProps {
  onUpdate: () => void;
}

export function TranslationSubjectsList({ onUpdate }: TranslationSubjectsListProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hindiName, setHindiName] = useState('');
  const [hindiDescription, setHindiDescription] = useState('');

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setIsLoading(true);
      const { fetchTranslationSubjectsAction } = await import('@/app/admin/actions');
      const resp = await fetchTranslationSubjectsAction();
      if (!resp?.success) throw new Error(String(resp?.error || 'Failed to fetch subjects'));
      setSubjects(resp.data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setHindiName(subject.name.hi || '');
    setHindiDescription(subject.description?.hi || '');
  };

  const handleSave = async () => {
    if (!editingSubject) return;

    if (!hindiName.trim()) {
      alert('Hindi name is required');
      return;
    }

    try {
      setIsSaving(true);

      const { saveSubjectTranslationAction } = await import('@/app/admin/actions');
      const resp = await saveSubjectTranslationAction(editingSubject.id, {
        name: { en: editingSubject.name.en, hi: hindiName },
        description: editingSubject.description ? { en: editingSubject.description.en, hi: hindiDescription } : null
      });
      if (!resp?.success) throw new Error(String(resp?.error || 'Failed to save translation'));
      alert('Subject translation saved successfully');
      setEditingSubject(null);
      fetchSubjects();
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
            {subjects.map((subject) => (
              <div key={subject.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium">{subject.name.en}</p>
                    {subject.name.hi && (
                      <p className="text-sm text-gray-600 mt-1">
                        [translate:{subject.name.hi}]
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {subject.topicCount} topics
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      subject.hasHindiTranslation
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {subject.hasHindiTranslation ? '✓ Translated' : '✗ Untranslated'}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(subject)}
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
      {editingSubject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Translate Subject</h2>
                <button
                  onClick={() => setEditingSubject(null)}
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
                    value={editingSubject.name.en}
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

                {editingSubject.description && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        English Description <span className="text-xs bg-gray-100 px-2 py-1 rounded">Read-only</span>
                      </label>
                      <input
                        type="text"
                        value={editingSubject.description.en}
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
                  onClick={() => setEditingSubject(null)}
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