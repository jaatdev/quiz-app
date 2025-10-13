'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { quizService } from '@/services/quiz.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserButton } from '@/components/ui/user-button';
import { Loading } from '@/components/ui/loading';
import { Error } from '@/components/ui/error';
import { StatsCard } from '@/components/ui/stats-card';
import { DifficultySelector, type DifficultyLevel } from '@/components/ui/difficulty-selector';
import { 
  BookOpen, Clock, Trophy, Target, ArrowRight, Users, Brain,
  Search, BarChart3, History, Sparkles, Zap, X
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [showDifficultyDialog, setShowDifficultyDialog] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<{
    topicId: string;
    topicName: string;
    subjectName: string;
  } | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('medium');

  const { data: subjects, isLoading, error, refetch } = useQuery({
    queryKey: ['subjects'],
    queryFn: quizService.getSubjects,
  });

  // Load recent activity from localStorage
  useEffect(() => {
    const history = localStorage.getItem('quiz-history');
    if (history) {
      try {
        const parsed = JSON.parse(history);
        setRecentActivity(parsed.slice(0, 3));
      } catch {}
    }
  }, []);

  // Filter logic
  const filteredSubjects = useMemo(() => {
    if (!subjects) return [];
    
    let filtered = [...subjects];
    
    // Filter by selected subject
    if (selectedSubject !== 'all') {
      filtered = filtered.filter(s => s.name === selectedSubject);
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.map(subject => ({
        ...subject,
        topics: subject.topics.filter(topic =>
          topic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          subject.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })).filter(subject => subject.topics.length > 0);
    }
    
    return filtered;
  }, [subjects, selectedSubject, searchTerm]);

  const handleStartQuiz = (topicId: string, topicName: string, subjectName: string) => {
    // Check if user is logged in
    if (!isLoaded) {
      // Wait for auth to load
      return;
    }

    if (!user) {
      // Redirect to sign-in with return URL
      const returnUrl = `/quiz/${topicId}?topic=${encodeURIComponent(topicName)}&subject=${encodeURIComponent(subjectName)}`;
      router.push(`/sign-in?redirect_url=${encodeURIComponent(returnUrl)}`);
      return;
    }

    // If logged in, proceed with difficulty selection
    setSelectedTopic({ topicId, topicName, subjectName });
    setShowDifficultyDialog(true);
  };

  const handleDifficultySelect = (difficulty: DifficultyLevel) => {
    setSelectedDifficulty(difficulty.id);
  };

  const handleStartQuizWithDifficulty = () => {
    if (!selectedTopic) return;
    setShowDifficultyDialog(false);
    router.push(
      `/quiz/${selectedTopic.topicId}?topic=${encodeURIComponent(selectedTopic.topicName)}&subject=${encodeURIComponent(selectedTopic.subjectName)}&difficulty=${selectedDifficulty}`
    );
  };

  const subjectCategories = subjects?.map(s => s.name) || [];

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
  const totalTopics = filteredSubjects?.reduce((acc, subject) => acc + subject.topics.length, 0) || 0;
  const totalQuestions = filteredSubjects?.reduce(
    (acc, subject) =>
      acc + subject.topics.reduce((topicAcc, topic) => topicAcc + (topic._count?.questions || 0), 0),
    0
  ) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation Header */}
      <header className="bg-white border-b-2 shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">QuizMaster Pro</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => router.push('/stats')} 
                variant="ghost"
                size="sm"
                className="font-bold"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Stats
              </Button>
              <Button 
                onClick={() => router.push('/history')} 
                variant="ghost"
                size="sm"
                className="font-bold"
              >
                <History className="w-4 h-4 mr-2" />
                History
              </Button>
              <Button 
                onClick={() => router.push('/leaderboard')} 
                variant="outline"
                className="font-bold"
              >
                <Trophy className="w-4 h-4 mr-2" />
                Leaderboard
              </Button>
              
              {/* User Authentication */}
              <UserButton />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Search */}
      <section className="container mx-auto px-4 py-8">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Learn • Practice • Master
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Test Your Knowledge
          </h2>
          <p className="text-lg text-gray-700 mb-8 font-medium">
            Challenge yourself with our comprehensive quiz platform. Track your progress and master new subjects.
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none font-bold text-gray-900 placeholder:text-gray-500"
            />
          </div>
          
          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <Button
              variant={selectedSubject === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSubject('all')}
              className="font-bold"
            >
              All Subjects
            </Button>
            {subjectCategories.map(category => (
              <Button
                key={category}
                variant={selectedSubject === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedSubject(category)}
                className="font-bold"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-3xl mx-auto">
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
            description="Total topics"
          />
          <StatsCard
            title="Questions"
            value={totalQuestions}
            icon={Brain}
            color="purple"
            description="Total questions"
          />
        </div>

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <div className="max-w-6xl mx-auto mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900">
              <Clock className="w-5 h-5" />
              Continue Learning
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              {recentActivity.map((activity) => {
                const percentage = activity.percentage ?? 0;
                return (
                  <Card key={activity.id} className="hover:shadow-md transition-shadow border-2">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{activity.topicName}</p>
                          <p className="text-sm text-gray-700 font-medium">{activity.subjectName}</p>
                        </div>
                        <span className={`text-lg font-bold ${percentage >= 80 ? 'text-green-600' : percentage >= 60 ? 'text-blue-600' : 'text-orange-600'}`}>
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full font-bold"
                        onClick={() => handleStartQuiz(activity.topicId, activity.topicName, activity.subjectName)}
                      >
                        Try Again
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Subjects Grid */}
        <div className="max-w-6xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            {selectedSubject === 'all' ? 'All Subjects' : selectedSubject}
            {searchTerm && ` - "${searchTerm}"`}
          </h3>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredSubjects?.map((subject) => (
              <Card
                key={subject.id}
                className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-200 overflow-hidden"
              >
                <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500" />
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
                    {subject.topics.slice(0, 2).map((topic) => (
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
                                ~{Math.ceil((topic._count?.questions || 10) * 0.5)} mins
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
                  {subject.topics.length > 2 && (
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/subject/${encodeURIComponent(subject.name)}`)}
                      >
                        Show all {subject.topics.length} topics
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {filteredSubjects?.length === 0 && (
            <Card className="text-center py-12 border-2">
              <CardContent>
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Results Found</h3>
                <p className="text-gray-600">
                  {searchTerm 
                    ? `No topics found matching "${searchTerm}"`
                    : 'No subjects available'}
                </p>
                {searchTerm && (
                  <Button
                    className="mt-4"
                    variant="outline"
                    onClick={() => setSearchTerm('')}
                  >
                    Clear Search
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-12 border-t">
        <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">Why Choose QuizMaster?</h3>
        <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          <Card className="text-center hover:shadow-lg transition-shadow border-2">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trophy className="w-6 h-6 text-yellow-600" />
              </div>
              <h4 className="font-semibold mb-2 text-gray-900">Track Progress</h4>
              <p className="text-sm text-gray-700 font-medium">
                Monitor your improvement with detailed analytics
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center hover:shadow-lg transition-shadow border-2">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-semibold mb-2 text-gray-900">Compete</h4>
              <p className="text-sm text-gray-700 font-medium">
                Challenge friends and climb the leaderboard
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center hover:shadow-lg transition-shadow border-2">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-semibold mb-2 text-gray-900">Learn</h4>
              <p className="text-sm text-gray-700 font-medium">
                Get detailed explanations for every question
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center hover:shadow-lg transition-shadow border-2">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-semibold mb-2 text-gray-900">Quick Practice</h4>
              <p className="text-sm text-gray-700 font-medium">
                Short quizzes perfect for daily practice
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-700 font-medium">
            © 2024 QuizMaster Pro. Built with ❤️ for learning.
          </div>
        </div>
      </footer>

      {/* Difficulty Selection Dialog */}
      {showDifficultyDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            {/* Dialog Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Select Difficulty</h2>
                {selectedTopic && (
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-semibold">{selectedTopic.topicName}</span> - {selectedTopic.subjectName}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowDifficultyDialog(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Difficulty Selector */}
            <div className="p-6">
              <DifficultySelector
                onSelect={handleDifficultySelect}
                selected={selectedDifficulty as any}
              />
            </div>

            {/* Dialog Footer */}
            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDifficultyDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleStartQuizWithDifficulty}
                className="font-bold"
              >
                Start Quiz
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
