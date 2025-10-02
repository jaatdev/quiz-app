'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { quizService } from '@/services/quiz.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { Error } from '@/components/ui/error';
import { StatsCard } from '@/components/ui/stats-card';
import { BookOpen, Clock, Trophy, Target, ArrowRight, Users, Brain } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { data: subjects, isLoading, error, refetch } = useQuery({
    queryKey: ['subjects'],
    queryFn: quizService.getSubjects,
  });

  const handleStartQuiz = (topicId: string, topicName: string, subjectName: string) => {
    // Navigate to quiz page with topic info
    router.push(`/quiz/${topicId}?topic=${encodeURIComponent(topicName)}&subject=${encodeURIComponent(subjectName)}`);
  };

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
        <Error message={error.message} onRetry={() => refetch()} />
      </div>
    );
  }

  // Calculate statistics
  const totalTopics = subjects?.reduce((acc, subject) => acc + subject.topics.length, 0) || 0;
  const totalQuestions = subjects?.reduce(
    (acc, subject) =>
      acc + subject.topics.reduce((topicAcc, topic) => topicAcc + (topic._count?.questions || 0), 0),
    0
  ) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation Header */}
      <header className="bg-white border-b-2 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Quiz Master</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={() => router.push('/dashboard')} 
                variant="outline"
                className="font-bold"
              >
                <Trophy className="w-4 h-4 mr-2" />
                Analytics
              </Button>
              <Button 
                onClick={() => router.push('/leaderboard')} 
                variant="outline"
                className="font-bold"
              >
                <Users className="w-4 h-4 mr-2" />
                Leaderboard
              </Button>
            </div>
          </div>
        </div>
      </header>



      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Test Your Knowledge
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Challenge yourself with our comprehensive quiz platform. Track your progress, compete with others, and master new subjects.
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            <StatsCard
              title="Subjects"
              value={subjects?.length || 0}
              icon={BookOpen}
              color="blue"
              description="Available subjects"
            />
            <StatsCard
              title="Topics"
              value={totalTopics}
              icon={Target}
              color="green"
              description="Total topics to explore"
            />
            <StatsCard
              title="Questions"
              value={totalQuestions}
              icon={Brain}
              color="purple"
              description="Questions in database"
            />
          </div>
        </div>

        {/* Subjects Grid */}
        <div className="max-w-6xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Choose Your Subject</h3>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {subjects?.map((subject) => (
              <Card
                key={subject.id}
                className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-200"
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="text-sm text-gray-500">
                      {subject.topics.length} {subject.topics.length === 1 ? 'topic' : 'topics'}
                    </span>
                  </div>
                  <CardTitle className="text-xl font-bold text-blue-900">{subject.name}</CardTitle>
                  <CardDescription className="text-base text-gray-800 font-medium">
                    Master {subject.name} with our comprehensive quiz collection
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {subject.topics.map((topic) => (
                      <div
                        key={topic.id}
                        className="group/topic p-3 rounded-lg border bg-gray-50 hover:bg-white hover:border-blue-200 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 mb-1">{topic.name}</h4>
                            <div className="flex items-center gap-4 text-sm text-gray-700 font-semibold">
                              <span className="flex items-center gap-1">
                                <Target className="w-3 h-3" />
                                {topic._count?.questions || 0} questions
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                10 mins
                              </span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleStartQuiz(topic.id, topic.name, subject.name)}
                            className="group-hover/topic:bg-blue-600 transition-colors"
                          >
                            Start
                            <ArrowRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {subjects?.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Subjects Available</h3>
                <p className="text-gray-600">Check back later for new quiz content!</p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-12 border-t">
        <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">Why Choose QuizMaster?</h3>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card className="text-center">
            <CardContent className="pt-6">
              <Trophy className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
              <h4 className="font-semibold mb-2">Track Progress</h4>
              <p className="text-sm text-gray-600">
                Monitor your improvement over time with detailed analytics
              </p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <Users className="w-10 h-10 text-blue-500 mx-auto mb-3" />
              <h4 className="font-semibold mb-2">Compete</h4>
              <p className="text-sm text-gray-600">
                Challenge friends and climb the global leaderboard
              </p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <Brain className="w-10 h-10 text-purple-500 mx-auto mb-3" />
              <h4 className="font-semibold mb-2">Learn</h4>
              <p className="text-sm text-gray-600">
                Get detailed explanations for every question
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-600">
            © 2024 QuizMaster Pro. Built with ❤️ for learning.
          </div>
        </div>
      </footer>
    </div>
  );
}
