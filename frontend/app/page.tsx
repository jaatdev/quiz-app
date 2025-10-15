'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { quizService } from '@/services/quiz.service';
import { AnimatedHero } from '@/components/home/AnimatedHero';
import { StatsBar } from '@/components/home/StatsBar';
import { FeaturedTopicsCarousel } from '@/components/home/FeaturedTopicsCarousel';
import { SpotlightCard } from '@/components/home/SpotlightCard';
import { LogoMarquee } from '@/components/home/LogoMarquee';
import { Testimonials } from '@/components/home/Testimonials';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { Error } from '@/components/ui/error';
import { motion } from 'framer-motion';
import { Target, Clock } from 'lucide-react';
import type { Subject, Topic } from '@/types';

export default function HomePage() {
  const router = useRouter();
  const {
    data: subjects,
    isLoading,
    error,
    refetch,
  } = useQuery<Subject[]>({
    queryKey: ['subjects'],
    queryFn: quizService.getSubjects,
    staleTime: 60_000,
  });

  const totals = useMemo(() => {
    return (
      subjects?.reduce(
        (acc, subject) => {
          acc.subjects += 1;
          acc.topics += subject.topics.length;
          acc.questions += subject.topics.reduce(
            (topicAcc, topic) => topicAcc + (topic._count?.questions || 0),
            0,
          );
          return acc;
        },
        { subjects: 0, topics: 0, questions: 0 },
      ) || { subjects: 0, topics: 0, questions: 0 }
    );
  }, [subjects]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Error message="Failed to load" onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50/50 dark:from-gray-950 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 md:py-10">
        <AnimatedHero />
        <StatsBar
          subjectsCount={totals.subjects}
          topicsCount={totals.topics}
          questionsCount={totals.questions}
        />

        {/* Featured topics carousel below hero/stats */}
        <div className="mt-8">
          <FeaturedTopicsCarousel
            subjects={subjects ?? []}
            onOpenTopic={(id, name, subject) =>
              router.push(`/quiz/${id}?topic=${encodeURIComponent(name)}&subject=${encodeURIComponent(subject)}`)
            }
          />
        </div>

        <div className="mt-8">
          <LogoMarquee />
        </div>

        <div className="mt-10">
          <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">Browse Subjects</h2>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {subjects?.map((subject, index) => (
              <motion.div
                key={subject.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
              >
                <SpotlightCard>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {subject.name}
                      </h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {subject.topics.length} topic
                        {subject.topics.length !== 1 ? 's' : ''} •
                        {' '}
                        {subject.topics.reduce(
                          (topicAcc: number, topic: Topic) =>
                            topicAcc + (topic._count?.questions || 0),
                          0,
                        )}{' '}
                        questions
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(`/subject/${encodeURIComponent(subject.name)}`)
                      }
                    >
                      View all
                    </Button>
                  </div>

                  <div className="mt-3 space-y-2">
                    {subject.topics.slice(0, 2).map((topic) => (
                      <div
                        key={topic.id}
                        className="flex items-center justify-between rounded-lg border bg-gray-50 px-3 py-2 dark:bg-gray-800/50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {topic.name}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-gray-700 dark:text-gray-300">
                            <Target className="h-3 w-3" />
                            {topic._count?.questions || 0}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/quiz/${topic.id}?topic=${encodeURIComponent(
                                topic.name,
                              )}&subject=${encodeURIComponent(subject.name)}`,
                            )
                          }
                        >
                          Start
                        </Button>
                      </div>
                    ))}

                    {subject.topics.length > 2 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                        onClick={() =>
                          router.push(`/subject/${encodeURIComponent(subject.name)}`)
                        }
                      >
                        Show all {subject.topics.length} topics →
                      </Button>
                    )}
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-12">
          <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
            Loved by learners
          </h2>
          <Testimonials />
        </div>

        <div className="mt-12">
          <Card className="bg-white/80 backdrop-blur dark:bg-gray-900/70">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Ready to start your next quiz?</CardTitle>
              <CardDescription className="text-gray-700 dark:text-gray-300">
                Pick any topic and try to beat your best score.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button onClick={() => router.push('/')}>Browse all subjects</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
