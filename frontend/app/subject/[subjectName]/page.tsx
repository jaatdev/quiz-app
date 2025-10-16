'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { quizService } from '@/services/quiz.service';
import { SubjectHero } from '@/components/subject/SubjectHero';
import { SpotlightCard } from '@/components/home/SpotlightCard';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { Error } from '@/components/ui/error';
import { Card, CardContent } from '@/components/ui/card';
import { CustomQuizDrawer } from '@/components/subject/CustomQuizDrawer';
import { motion } from 'framer-motion';
import { Target, Search, Plus, BookOpen } from 'lucide-react';
import type { Subject, Topic } from '@/types';

// Import subject animation (reuse hero animation or use a different one)
import subjectAnim from '@/public/lottie/hero.json';

export default function SubjectTopicsPage() {
  const params = useParams();
  const router = useRouter();
  const rawParam = params?.subjectName;
  const subjectName = typeof rawParam === 'string' ? decodeURIComponent(rawParam) : '';
  const [showCustomQuiz, setShowCustomQuiz] = useState(false);
  const [query, setQuery] = useState('');
  const [questionCount, setQuestionCount] = useState(10);

  const { data: subject, isLoading, error, refetch } = useQuery<Subject>({
    queryKey: ['subject-by-name', subjectName],
    queryFn: () => quizService.getSubjectByName(subjectName),
    enabled: Boolean(subjectName),
    staleTime: 60_000,
  });

  const topics = subject?.topics || [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return topics;
    return topics.filter((t: Topic) => {
      const nameMatch = t.name.toLowerCase().includes(q);
      const subMatch = (t.subTopics || []).some((st) => st.name.toLowerCase().includes(q));
      return nameMatch || subMatch;
    });
  }, [topics, query]);

  const totals = useMemo(() => {
    const allSubTopicIds = topics.flatMap((t: Topic) => (t.subTopics || []).map((st) => st.id));
    const totalQuestions = topics.reduce((sum: number, t: Topic) => sum + (t._count?.questions || 0), 0);
    return { topicsCount: topics.length, questionsCount: totalQuestions, allSubTopicIds };
  }, [topics]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Error message="Failed to load subject" onRetry={() => refetch()} />
      </div>
    );
  }

  const handleCustomQuizStart = async (subTopicIds: string[], count: number) => {
    try {
      // Create custom quiz session
      const session = await quizService.createCustomQuizSession(subTopicIds, count);
      setShowCustomQuiz(false);
      // Use topicId if session doesn't have id
      const sessionId = session.id || session.topicId || 'custom';
      router.push(`/quiz/${sessionId}?custom=true&subject=${encodeURIComponent(subject.name)}`);
    } catch (error) {
      console.error('Failed to create custom quiz:', error);
      alert('Failed to create custom quiz. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50/50 dark:from-gray-950 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <SubjectHero
          subjectName={subject.name}
          topicsCount={totals.topicsCount}
          questionsCount={totals.questionsCount}
          lottie={subjectAnim}
        />

        {/* Toolbar */}
        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search topics or sub‑topics..."
                className="w-full rounded-lg border bg-white/80 pl-9 pr-3 py-2 text-gray-900 shadow-sm backdrop-blur placeholder-gray-600 focus:border-blue-500 focus:outline-none dark:bg-gray-900/70 dark:text-gray-100"
              />
            </div>
            <div className="inline-flex items-center gap-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">Questions:</span>
              <div className="inline-flex rounded-lg border bg-white/70 p-1 dark:bg-gray-900/70">
                {[10, 20, 30].map((n) => (
                  <button
                    key={n}
                    onClick={() => setQuestionCount(n)}
                    className={`px-3 py-1 text-sm rounded-md ${questionCount === n ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {totals.allSubTopicIds.length > 0 && (
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    const session = await quizService.createCustomQuizSession(totals.allSubTopicIds, questionCount);
                    const sessionId = session.id || session.topicId || 'custom';
                    router.push(`/quiz/${sessionId}?custom=true&subject=${encodeURIComponent(subject.name)}`);
                  } catch (error) {
                    console.error('Failed to create quiz:', error);
                    alert('Failed to start quiz. Please try again.');
                  }
                }}
              >
                <BookOpen className="h-4 w-4 mr-1" />
                Start All Sub‑Topics ({totals.allSubTopicIds.length})
              </Button>
            )}

            <Button onClick={() => setShowCustomQuiz(true)}>
              <Plus className="h-4 w-4 mr-1" /> Build Custom Quiz
            </Button>
          </div>
        </div>

        {/* Topics grid */}
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((topic: Topic, idx: number) => (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.25, delay: idx * 0.04 }}
            >
              <SpotlightCard>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{topic.name}</h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {topic.subTopics?.length || 0} sub‑topic{(topic.subTopics?.length || 0) === 1 ? '' : 's'} • {topic._count?.questions || 0} questions
                    </p>
                  </div>
                </div>

                {topic.subTopics && topic.subTopics.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {topic.subTopics.slice(0, 6).map((st) => (
                      <span key={st.id} className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
                        {st.name}
                      </span>
                    ))}
                    {topic.subTopics.length > 6 && (
                      <span className="text-xs text-gray-700 dark:text-gray-300">+ {topic.subTopics.length - 6} more</span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => router.push(`/quiz/${topic.id}?topic=${encodeURIComponent(topic.name)}&subject=${encodeURIComponent(subject.name)}&count=${questionCount}`)}
                  >
                    <Target className="h-4 w-4 mr-1" />
                    Start Quiz
                  </Button>
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <Card className="mt-6">
            <CardContent className="py-10 text-center text-gray-700 dark:text-gray-300">
              No topics match your search.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Custom Quiz Drawer */}
      {subject && (
        <CustomQuizDrawer
          subject={subject}
          open={showCustomQuiz}
          onClose={() => setShowCustomQuiz(false)}
          onStart={handleCustomQuizStart}
        />
      )}
    </div>
  );
}
