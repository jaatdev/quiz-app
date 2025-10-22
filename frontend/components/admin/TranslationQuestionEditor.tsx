'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface Question {
  id: string;
  text: {
    en: string;
    hi: string;
  };
  options: {
    en: Array<{ id: string; text: string }>;
    hi: Array<{ id: string; text: string }>;
  };
  explanation: {
    en: string;
    hi: string;
  } | null;
  difficulty: string;
  topic: {
    name: { en: string; hi: string };
  };
}

interface TranslationQuestionEditorProps {
  question: Question;
  onClose: () => void;
  onSave: () => void;
}

export function TranslationQuestionEditor({
  question,
  onClose,
  onSave
}: TranslationQuestionEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'question' | 'options' | 'explanation'>('question');

  const [hindiText, setHindiText] = useState(question.text.hi || '');
  const [hindiOptions, setHindiOptions] = useState<Array<{ id: string; text: string }>>(
    question.options.hi || question.options.en.map(opt => ({ ...opt, text: '' }))
  );
  const [hindiExplanation, setHindiExplanation] = useState(
    question.explanation?.hi || ''
  );

  const handleSave = async () => {
    // Validate
    if (!hindiText.trim()) {
      alert('Hindi question text is required');
      return;
    }

    const hasAllOptions = hindiOptions.every(opt => opt.text.trim());
    if (!hasAllOptions) {
      alert('All Hindi options must be filled');
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/translations/questions/${question.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            text: {
              en: question.text.en,
              hi: hindiText
            },
            options: {
              en: question.options.en,
              hi: hindiOptions
            },
            explanation: question.explanation ? {
              en: question.explanation.en,
              hi: hindiExplanation
            } : null
          })
        }
      );

      if (!response.ok) throw new Error('Failed to save translation');

      alert('Translation saved successfully');
      onSave();
    } catch (error) {
      console.error('Error saving translation:', error);
      alert('Failed to save translation');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Translate Question</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          <p className="text-gray-600 mb-4">
            Add Hindi translation for this question
          </p>

          {/* Tab Navigation */}
          <div className="flex border-b mb-4">
            <button
              onClick={() => setActiveTab('question')}
              className={`px-4 py-2 ${activeTab === 'question' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            >
              Question Text
            </button>
            <button
              onClick={() => setActiveTab('options')}
              className={`px-4 py-2 ${activeTab === 'options' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            >
              Options
            </button>
            <button
              onClick={() => setActiveTab('explanation')}
              className={`px-4 py-2 ${activeTab === 'explanation' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            >
              Explanation
            </button>
          </div>

          {/* Question Text Tab */}
          {activeTab === 'question' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  English (Original) <span className="text-xs bg-gray-100 px-2 py-1 rounded">Read-only</span>
                </label>
                <textarea
                  value={question.text.en}
                  disabled
                  className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 min-h-[100px]"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Hindi Translation [translate:हिन्दी अनुवाद]
                </label>
                <textarea
                  value={hindiText}
                  onChange={(e) => setHindiText(e.target.value)}
                  placeholder="[translate:यहाँ हिन्दी अनुवाद लिखें...]"
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tip: Use Google Translate or type directly in Hindi
                </p>
              </div>
            </div>
          )}

          {/* Options Tab */}
          {activeTab === 'options' && (
            <div className="space-y-4">
              {question.options.en.map((option, index) => (
                <div key={option.id} className="space-y-2 p-4 border rounded-lg">
                  <label className="block text-sm font-medium">
                    Option {String.fromCharCode(65 + index)}
                  </label>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">English</label>
                    <input
                      type="text"
                      value={option.text}
                      disabled
                      className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Hindi [translate:हिन्दी]
                    </label>
                    <input
                      type="text"
                      value={hindiOptions[index]?.text || ''}
                      onChange={(e) => {
                        const newOptions = [...hindiOptions];
                        newOptions[index] = {
                          id: option.id,
                          text: e.target.value
                        };
                        setHindiOptions(newOptions);
                      }}
                      placeholder="[translate:यहाँ हिन्दी विकल्प लिखें...]"
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Explanation Tab */}
          {activeTab === 'explanation' && (
            <div className="space-y-4">
              {question.explanation ? (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      English Explanation <span className="text-xs bg-gray-100 px-2 py-1 rounded">Read-only</span>
                    </label>
                    <textarea
                      value={question.explanation.en}
                      disabled
                      className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 min-h-[100px]"
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Hindi Explanation [translate:हिन्दी व्याख्या]
                    </label>
                    <textarea
                      value={hindiExplanation}
                      onChange={(e) => setHindiExplanation(e.target.value)}
                      placeholder="[translate:यहाँ हिन्दी व्याख्या लिखें...]"
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                    />
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No explanation available for this question
                </p>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              )}
              Save Translation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}