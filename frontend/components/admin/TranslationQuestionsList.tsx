'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TranslationQuestionEditor } from './TranslationQuestionEditor';

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
    id: string;
    name: { en: string; hi: string };
    subject: {
      id: string;
      name: { en: string; hi: string };
    };
  };
  hasHindiTranslation: boolean;
}

interface TranslationQuestionsListProps {
  onUpdate: () => void;
}

export function TranslationQuestionsList({ onUpdate }: TranslationQuestionsListProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'translated' | 'untranslated'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  useEffect(() => {
    fetchQuestions();
  }, [page, filter]);

  const fetchQuestions = async () => {
    try {
      setIsLoading(true);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });

      if (filter !== 'all') {
        params.append('hasHindiTranslation', filter === 'translated' ? 'true' : 'false');
      }

      if (search) {
        params.append('search', search);
      }
      const { fetchTranslationQuestionsAction } = await import('@/app/admin/actions');
      const hasHindi = filter === 'translated' ? true : filter === 'untranslated' ? false : undefined;
      const resp = await fetchTranslationQuestionsAction(page, 20, search || undefined, hasHindi as any);
      if (!resp?.success) throw new Error(String(resp?.error || 'Failed to fetch questions'));
      setQuestions(resp.data?.questions || []);
      setTotalPages(resp.data?.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchQuestions();
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
  };

  const handleSave = () => {
    setEditingQuestion(null);
    fetchQuestions();
    onUpdate();
  };

  return (
    <>
      <Card className="p-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              placeholder="Search questions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button onClick={handleSearch}>
              Search
            </Button>
          </div>

          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value as any);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Questions</option>
            <option value="translated">Translated</option>
            <option value="untranslated">Untranslated</option>
          </select>
        </div>

        {/* Questions List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No questions found
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {questions.map((question) => (
                <div key={question.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="font-medium">{question.text.en}</p>
                      {question.text.hi && (
                        <p className="text-sm text-gray-600 mt-1">
                          [translate:{question.text.hi}]
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {question.topic.subject.name.en} → {question.topic.name.en}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        question.hasHindiTranslation
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {question.hasHindiTranslation ? '✓ Translated' : '✗ Untranslated'}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(question)}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Editor Dialog */}
      {editingQuestion && (
        <TranslationQuestionEditor
          question={editingQuestion}
          onClose={() => setEditingQuestion(null)}
          onSave={handleSave}
        />
      )}
    </>
  );
}