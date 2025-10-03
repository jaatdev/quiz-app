'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { QuestionForm } from '@/components/admin/question-form';
import { cn } from '@/lib/utils';

interface Question {
  id: string;
  text: string;
  options: Array<{ id: string; text: string }>;
  correctAnswerId: string;
  explanation?: string;
  difficulty: string;
  topic: {
    id: string;
    name: string;
    subject: {
      name: string;
    };
  };
}

export default function QuestionManagement() {
  const { user } = useUser();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchQuestions();
  }, [user]);

  const fetchQuestions = async () => {
    if (!user) return;

    try {
      const response = await fetch('http://localhost:5001/api/admin/questions', {
        headers: {
          'x-clerk-user-id': user.id,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setQuestions(data);
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      const response = await fetch(`http://localhost:5001/api/admin/questions/${id}`, {
        method: 'DELETE',
        headers: {
          'x-clerk-user-id': user!.id,
        },
      });

      if (response.ok) {
        setQuestions(questions.filter(q => q.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete question:', error);
    }
  };

  const filteredQuestions = questions.filter(q =>
    q.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.topic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.topic.subject.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Question Management</h1>
        <p className="text-gray-600">Manage quiz questions</p>
      </div>

      {/* Actions Bar */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search questions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Question
        </Button>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.length > 0 ? (
          filteredQuestions.map((question) => (
            <Card key={question.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-2">{question.text}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <span>{question.topic.subject.name}</span>
                      <span>•</span>
                      <span>{question.topic.name}</span>
                      <span>•</span>
                      <span className="capitalize">{question.difficulty}</span>
                    </div>
                    <div className="space-y-1">
                      {question.options.map((option) => (
                        <div
                          key={option.id}
                          className={cn(
                            'text-sm p-2 rounded',
                            option.id === question.correctAnswerId
                              ? 'bg-green-50 text-green-700 font-medium'
                              : 'bg-gray-50 text-gray-700'
                          )}
                        >
                          {option.id.toUpperCase()}. {option.text}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingQuestion(question);
                        setShowForm(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(question.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-500 py-8">
                {searchTerm ? 'No questions match your search' : 'No questions yet. Add your first question!'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Question Form Modal */}
      {showForm && (
        <QuestionForm
          question={editingQuestion}
          onClose={() => {
            setShowForm(false);
            setEditingQuestion(null);
          }}
          onSave={() => {
            fetchQuestions();
            setShowForm(false);
            setEditingQuestion(null);
          }}
        />
      )}
    </div>
  );
}
