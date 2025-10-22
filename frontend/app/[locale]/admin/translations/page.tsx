'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileText,
  BookOpen,
  FolderOpen,
  TrendingUp,
  Languages,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { TranslationQuestionsList } from '@/components/admin/TranslationQuestionsList';
import { TranslationSubjectsList } from '@/components/admin/TranslationSubjectsList';
import { TranslationTopicsList } from '@/components/admin/TranslationTopicsList';

interface TranslationStats {
  questions: {
    total: number;
    translated: number;
    untranslated: number;
    percentage: number;
  };
  subjects: {
    total: number;
    translated: number;
    untranslated: number;
    percentage: number;
  };
  topics: {
    total: number;
    translated: number;
    untranslated: number;
    percentage: number;
  };
}

export default function AdminTranslationsPage() {
  const t = useTranslations('admin');
  const [stats, setStats] = useState<TranslationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('questions');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { fetchTranslationStatsAction } = await import('@/app/admin/actions');
      const resp = await fetchTranslationStatsAction();
      if (!resp?.success) throw new Error(String(resp?.error || 'Failed to fetch stats'));
      setStats(resp.data || null);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading translation management...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Languages className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Translation Management</h1>
        </div>
        <p className="text-muted-foreground">
          Manage Hindi translations for questions, subjects, and topics
        </p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          {/* Questions Stats */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Questions</h3>
              </div>
              <span className="text-2xl font-bold">{stats.questions.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${stats.questions.percentage}%` }}
              />
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-medium">{stats.questions.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Translated:
                </span>
                <span className="font-medium">{stats.questions.translated}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-600 flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  Untranslated:
                </span>
                <span className="font-medium">{stats.questions.untranslated}</span>
              </div>
            </div>
          </Card>

          {/* Subjects Stats */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Subjects</h3>
              </div>
              <span className="text-2xl font-bold">{stats.subjects.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${stats.subjects.percentage}%` }}
              />
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-medium">{stats.subjects.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Translated:
                </span>
                <span className="font-medium">{stats.subjects.translated}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-600 flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  Untranslated:
                </span>
                <span className="font-medium">{stats.subjects.untranslated}</span>
              </div>
            </div>
          </Card>

          {/* Topics Stats */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Topics</h3>
              </div>
              <span className="text-2xl font-bold">{stats.topics.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${stats.topics.percentage}%` }}
              />
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-medium">{stats.topics.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Translated:
                </span>
                <span className="font-medium">{stats.topics.translated}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-600 flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  Untranslated:
                </span>
                <span className="font-medium">{stats.topics.untranslated}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tabs for different translation sections */}
      <div className="space-y-6">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('questions')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm ${
              activeTab === 'questions'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="h-4 w-4" />
            Questions
          </button>
          <button
            onClick={() => setActiveTab('subjects')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm ${
              activeTab === 'subjects'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            Subjects
          </button>
          <button
            onClick={() => setActiveTab('topics')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm ${
              activeTab === 'topics'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FolderOpen className="h-4 w-4" />
            Topics
          </button>
        </div>

        {activeTab === 'questions' && (
          <TranslationQuestionsList onUpdate={fetchStats} />
        )}

        {activeTab === 'subjects' && (
          <TranslationSubjectsList onUpdate={fetchStats} />
        )}

        {activeTab === 'topics' && (
          <TranslationTopicsList onUpdate={fetchStats} />
        )}
      </div>
    </div>
  );
}