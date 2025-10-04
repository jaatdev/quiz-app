'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Trophy, TrendingUp, Clock, Target, Calendar, 
  BarChart3, Home, Download, Filter,
  Brain, Zap, Award, BookOpen
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { useToast } from '@/providers/toast-provider';

interface QuizAttempt {
  id: string;
  topicId: string;
  topicName: string;
  subjectName: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  timestamp: number;
  timeSpent: number;
  difficulty?: string;
}

export default function StatsPage() {
  const router = useRouter();
  const [history, setHistory] = useState<QuizAttempt[]>([]);
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const { showToast } = useToast();
  const emptyToastRef = useRef(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const stored = localStorage.getItem('quiz-history');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setHistory(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.error('Failed to parse quiz history for stats:', error);
        setHistory([]);
        showToast({ variant: 'error', title: 'Failed to load saved stats.' });
      }
    } else {
      setHistory([]);
    }
  };

  useEffect(() => {
    if (history.length === 0 && !emptyToastRef.current) {
      emptyToastRef.current = true;
      showToast({
        variant: 'info',
        title: 'No quiz data yet.',
        description: 'Complete quizzes to populate your stats dashboard.',
      });
    }
  }, [history.length, showToast]);

  // Advanced filtering
  const getFilteredHistory = () => {
    let filtered = [...history];
    
    // Time filter
    const now = Date.now();
    if (timeFilter === 'today') {
      const todayStart = new Date().setHours(0, 0, 0, 0);
      filtered = filtered.filter(h => h.timestamp >= todayStart);
    } else if (timeFilter === 'week') {
      const weekAgo = subDays(new Date(), 7).getTime();
      filtered = filtered.filter(h => h.timestamp >= weekAgo);
    } else if (timeFilter === 'month') {
      const monthAgo = subDays(new Date(), 30).getTime();
      filtered = filtered.filter(h => h.timestamp >= monthAgo);
    }
    
    // Subject filter
    if (subjectFilter !== 'all') {
      filtered = filtered.filter(h => h.subjectName === subjectFilter);
    }
    
    // Difficulty filter
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(h => (h.difficulty || 'medium') === difficultyFilter);
    }
    
    return filtered;
  };

  const filteredHistory = getFilteredHistory();

  // Calculate comprehensive stats
  const calculateStats = () => {
    if (filteredHistory.length === 0) {
      return {
        totalQuizzes: 0,
        averageScore: 0,
        bestScore: 0,
        totalTime: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        improvement: 0,
        streakDays: 0,
        favoriteSubject: 'N/A',
        strongestTopic: 'N/A',
        weakestTopic: 'N/A',
        averageTimePerQuestion: 0,
      };
    }

    const totalQuizzes = filteredHistory.length;
    const averageScore = filteredHistory.reduce((acc, h) => acc + h.percentage, 0) / totalQuizzes;
    const bestScore = Math.max(...filteredHistory.map(h => h.percentage));
    const totalTime = filteredHistory.reduce((acc, h) => acc + h.timeSpent, 0);
    const totalQuestions = filteredHistory.reduce((acc, h) => acc + h.totalQuestions, 0);
    const correctAnswers = filteredHistory.reduce((acc, h) => acc + h.correctAnswers, 0);
    
    // Calculate improvement
    const sortedByTime = [...filteredHistory].sort((a, b) => a.timestamp - b.timestamp);
    const recentHalf = sortedByTime.slice(Math.floor(totalQuizzes / 2));
    const olderHalf = sortedByTime.slice(0, Math.floor(totalQuizzes / 2));
    
    const recentAvg = recentHalf.length > 0 
      ? recentHalf.reduce((acc, h) => acc + h.percentage, 0) / recentHalf.length 
      : 0;
    const olderAvg = olderHalf.length > 0 
      ? olderHalf.reduce((acc, h) => acc + h.percentage, 0) / olderHalf.length 
      : 0;
    const improvement = recentAvg - olderAvg;

    // Calculate streak
    const streakDays = calculateStreak(filteredHistory);
    
    // Find favorite subject
    const subjectCounts = filteredHistory.reduce((acc, h) => {
      acc[h.subjectName] = (acc[h.subjectName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const favoriteSubject = Object.entries(subjectCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';
    
    // Find strongest and weakest topics
    const topicStats = filteredHistory.reduce((acc, h) => {
      if (!acc[h.topicName]) {
        acc[h.topicName] = { total: 0, count: 0 };
      }
      acc[h.topicName].total += h.percentage;
      acc[h.topicName].count++;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);
    
    const topicAverages = Object.entries(topicStats)
      .map(([topic, stats]) => ({
        topic,
        average: stats.total / stats.count
      }))
      .sort((a, b) => b.average - a.average);
    
    const strongestTopic = topicAverages[0]?.topic || 'N/A';
    const weakestTopic = topicAverages[topicAverages.length - 1]?.topic || 'N/A';
    
    const averageTimePerQuestion = totalQuestions > 0 ? totalTime / totalQuestions : 0;

    return {
      totalQuizzes,
      averageScore,
      bestScore,
      totalTime,
      totalQuestions,
      correctAnswers,
      improvement,
      streakDays,
      favoriteSubject,
      strongestTopic,
      weakestTopic,
      averageTimePerQuestion,
    };
  };

  const calculateStreak = (attempts: QuizAttempt[]) => {
    if (attempts.length === 0) return 0;
    
    const dates = attempts.map(a => new Date(a.timestamp).toDateString());
    const uniqueDates = Array.from(new Set(dates))
      .map(d => new Date(d))
      .sort((a, b) => b.getTime() - a.getTime());
    
    let streak = 0;
    const today = new Date().toDateString();
    
    if (uniqueDates[0]?.toDateString() !== today) {
      return 0; // Streak broken
    }
    
    for (let i = 0; i < uniqueDates.length - 1; i++) {
      const diff = (uniqueDates[i].getTime() - uniqueDates[i + 1].getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak + 1;
  };

  const stats = calculateStats();

  // Get unique values for filters
  const subjects = Array.from(new Set(history.map(h => h.subjectName)));
  const difficulties = Array.from(new Set(history.map(h => h.difficulty || 'medium')));

  // Prepare data for charts
  const getLast7DaysData = () => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = new Date(date).setHours(0, 0, 0, 0);
      const dayEnd = new Date(date).setHours(23, 59, 59, 999);
      
      const dayAttempts = filteredHistory.filter(
        h => h.timestamp >= dayStart && h.timestamp <= dayEnd
      );
      
      last7Days.push({
        date: format(date, 'EEE'),
        fullDate: format(date, 'MMM d'),
        count: dayAttempts.length,
        avgScore: dayAttempts.length > 0
          ? dayAttempts.reduce((acc, h) => acc + h.percentage, 0) / dayAttempts.length
          : 0,
      });
    }
    return last7Days;
  };

  const getTopicPerformance = () => {
    const topicMap = new Map<string, { attempts: number; totalScore: number; bestScore: number }>();
    
    filteredHistory.forEach(attempt => {
      const key = `${attempt.subjectName} - ${attempt.topicName}`;
      const existing = topicMap.get(key) || { attempts: 0, totalScore: 0, bestScore: 0 };
      
      topicMap.set(key, {
        attempts: existing.attempts + 1,
        totalScore: existing.totalScore + attempt.percentage,
        bestScore: Math.max(existing.bestScore, attempt.percentage),
      });
    });
    
    return Array.from(topicMap.entries())
      .map(([topic, data]) => ({
        topic,
        average: data.totalScore / data.attempts,
        best: data.bestScore,
        attempts: data.attempts,
      }))
      .sort((a, b) => b.average - a.average)
      .slice(0, 10);
  };

  const exportStats = () => {
    try {
      const dataStr = JSON.stringify(filteredHistory, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `quiz-stats-${format(new Date(), 'yyyy-MM-dd')}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();

      showToast({
        variant: 'success',
        title: 'Stats exported.',
        description: `${filteredHistory.length} record${filteredHistory.length === 1 ? '' : 's'} saved to JSON.`,
      });
    } catch (error) {
      console.error('Failed to export stats:', error);
      showToast({ variant: 'error', title: 'Failed to export stats.' });
    }
  };

  const last7DaysData = getLast7DaysData();
  const topicPerformance = getTopicPerformance();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Statistics Dashboard</h1>
                <p className="text-sm text-gray-700">Track your learning progress</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={exportStats} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button onClick={() => router.push('/')} variant="outline" size="sm">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-700" />
                <span className="text-sm font-medium">Filters:</span>
              </div>
              
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as any)}
                className="px-3 py-1.5 border rounded-lg text-sm font-bold"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
              
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="px-3 py-1.5 border rounded-lg text-sm font-bold"
              >
                <option value="all">All Subjects</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
              
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="px-3 py-1.5 border rounded-lg text-sm font-bold"
              >
                <option value="all">All Difficulties</option>
                {difficulties.map(diff => (
                  <option key={diff} value={diff}>
                    {diff.charAt(0).toUpperCase() + diff.slice(1)}
                  </option>
                ))}
              </select>
              
              <div className="ml-auto text-sm text-gray-700 font-bold">
                Showing {filteredHistory.length} of {history.length} quizzes
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-700 font-bold">Total Quizzes</p>
                  <p className="text-2xl font-bold">{stats.totalQuizzes}</p>
                </div>
                <Target className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-700 font-bold">Avg Score</p>
                  <p className="text-2xl font-bold">{stats.averageScore.toFixed(1)}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-700 font-bold">Best Score</p>
                  <p className="text-2xl font-bold">{stats.bestScore.toFixed(1)}%</p>
                </div>
                <Trophy className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-700 font-bold">Streak</p>
                  <p className="text-2xl font-bold">{stats.streakDays}d</p>
                </div>
                <Calendar className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-700 font-bold">Total Time</p>
                  <p className="text-2xl font-bold">
                    {Math.floor(stats.totalTime / 3600)}h
                  </p>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-700 font-bold">Improvement</p>
                  <p className={`text-2xl font-bold ${stats.improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.improvement >= 0 ? '+' : ''}{stats.improvement.toFixed(1)}%
                  </p>
                </div>
                <Zap className="w-8 h-8 text-indigo-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Insights Cards */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Learning Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-700 font-bold">Favorite Subject</p>
                  <p className="font-bold text-lg">{stats.favoriteSubject}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-700 font-bold">Strongest Topic</p>
                  <p className="font-bold text-lg text-green-600">{stats.strongestTopic}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-700 font-bold">Needs Improvement</p>
                  <p className="font-bold text-lg text-orange-600">{stats.weakestTopic}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Performance Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-700 font-bold">Questions Answered</p>
                  <p className="font-bold text-lg">{stats.totalQuestions}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-700 font-bold">Correct Answers</p>
                  <p className="font-bold text-lg text-green-600">{stats.correctAnswers}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-700 font-bold">Avg Time/Question</p>
                  <p className="font-bold text-lg">{stats.averageTimePerQuestion.toFixed(1)}s</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Goals & Targets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-700 font-bold">Next Goal</p>
                  <p className="font-bold text-lg">Reach 85% Average</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${Math.min((stats.averageScore / 85) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-700 font-bold">Quizzes to Next Level</p>
                  <p className="font-bold text-lg">{Math.max(0, 50 - stats.totalQuizzes)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* 7-Day Activity */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>7-Day Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {last7DaysData.map((day) => (
                  <div key={day.fullDate} className="flex items-center gap-3">
                    <div className="w-16 text-sm">
                      <div className="font-medium">{day.date}</div>
                      <div className="text-xs text-gray-700">{day.fullDate}</div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                          <div
                            className="absolute left-0 top-0 h-full bg-blue-500 flex items-center justify-end pr-2"
                            style={{ width: `${Math.min(day.count * 20, 100)}%` }}
                          >
                            {day.count > 0 && (
                              <span className="text-xs text-white font-medium">{day.count}</span>
                            )}
                          </div>
                        </div>
                        {day.avgScore > 0 && (
                          <span className="text-sm text-gray-700 font-bold w-12 text-right">
                            {day.avgScore.toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Topic Performance */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Topic Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topicPerformance.slice(0, 7).map((topic, index) => (
                  <div key={topic.topic}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate flex-1">
                        {index + 1}. {topic.topic}
                      </span>
                      <span className="text-xs text-gray-700 font-bold ml-2">
                        {topic.attempts} attempts
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <div className="bg-gray-200 rounded-full h-4 relative overflow-hidden">
                          <div
                            className="absolute left-0 top-0 h-full bg-blue-500"
                            style={{ width: `${topic.average}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs font-medium w-12 text-right">
                        {topic.average.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
                {topicPerformance.length === 0 && (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-700 font-bold">No quiz data yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
