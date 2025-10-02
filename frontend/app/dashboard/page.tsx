'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/ui/stats-card';
import { 
  Trophy, TrendingUp, Clock, Target, Calendar, 
  BarChart3, Home, Trash2, Filter 
} from 'lucide-react';
import { formatTime, calculateGrade } from '@/lib/utils';
import { format, subDays } from 'date-fns';

interface QuizAttempt {
  id: string;
  topicId: string;
  topicName: string;
  subjectName: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  timestamp: number;
  timeSpent: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [history, setHistory] = useState<QuizAttempt[]>([]);
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month'>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const stored = localStorage.getItem('quiz-history');
    if (stored) {
      setHistory(JSON.parse(stored));
    }
  };

  // Filter history based on time
  const getFilteredHistory = () => {
    let filtered = [...history];
    
    if (timeFilter === 'week') {
      const weekAgo = subDays(new Date(), 7).getTime();
      filtered = filtered.filter(h => h.timestamp > weekAgo);
    } else if (timeFilter === 'month') {
      const monthAgo = subDays(new Date(), 30).getTime();
      filtered = filtered.filter(h => h.timestamp > monthAgo);
    }
    
    if (subjectFilter !== 'all') {
      filtered = filtered.filter(h => h.subjectName === subjectFilter);
    }
    
    return filtered;
  };

  const filteredHistory = getFilteredHistory();

  // Calculate statistics
  const calculateStats = () => {
    if (filteredHistory.length === 0) {
      return {
        totalQuizzes: 0,
        averageScore: 0,
        totalTime: 0,
        bestScore: 0,
        improvement: 0,
        streakDays: 0,
      };
    }

    const totalQuizzes = filteredHistory.length;
    const averageScore = filteredHistory.reduce((acc, h) => acc + h.percentage, 0) / totalQuizzes;
    const totalTime = filteredHistory.reduce((acc, h) => acc + h.timeSpent, 0);
    const bestScore = Math.max(...filteredHistory.map(h => h.percentage));
    
    // Calculate improvement (compare first half with second half)
    const midPoint = Math.floor(totalQuizzes / 2);
    const firstHalf = filteredHistory.slice(0, midPoint);
    const secondHalf = filteredHistory.slice(midPoint);
    
    const firstAvg = firstHalf.length > 0 
      ? firstHalf.reduce((acc, h) => acc + h.percentage, 0) / firstHalf.length 
      : 0;
    const secondAvg = secondHalf.length > 0 
      ? secondHalf.reduce((acc, h) => acc + h.percentage, 0) / secondHalf.length 
      : 0;
    const improvement = secondAvg - firstAvg;

    // Calculate streak
    const streakDays = calculateStreak(filteredHistory);

    return {
      totalQuizzes,
      averageScore,
      totalTime,
      bestScore,
      improvement,
      streakDays,
    };
  };

  const calculateStreak = (attempts: QuizAttempt[]) => {
    if (attempts.length === 0) return 0;
    
    const today = new Date().setHours(0, 0, 0, 0);
    const sortedAttempts = [...attempts].sort((a, b) => b.timestamp - a.timestamp);
    
    let streak = 0;
    let currentDate = today;
    
    for (const attempt of sortedAttempts) {
      const attemptDate = new Date(attempt.timestamp).setHours(0, 0, 0, 0);
      
      if (attemptDate === currentDate) {
        streak++;
        currentDate = new Date(currentDate).setDate(new Date(currentDate).getDate() - 1);
      } else if (attemptDate < currentDate) {
        break;
      }
    }
    
    return streak;
  };

  const stats = calculateStats();

  // Get unique subjects
  const subjects = Array.from(new Set(history.map(h => h.subjectName)));

  // Group by topic for performance chart
  const topicPerformance = filteredHistory.reduce((acc, attempt) => {
    const key = `${attempt.subjectName} - ${attempt.topicName}`;
    if (!acc[key]) {
      acc[key] = { attempts: 0, totalScore: 0, bestScore: 0 };
    }
    acc[key].attempts++;
    acc[key].totalScore += attempt.percentage;
    acc[key].bestScore = Math.max(acc[key].bestScore, attempt.percentage);
    return acc;
  }, {} as Record<string, { attempts: number; totalScore: number; bestScore: number }>);

  // Prepare data for charts
  const performanceData = Object.entries(topicPerformance)
    .map(([topic, data]) => ({
      topic,
      average: data.totalScore / data.attempts,
      best: data.bestScore,
      attempts: data.attempts,
    }))
    .sort((a, b) => b.average - a.average)
    .slice(0, 5);

  // Time distribution (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayStart = date.setHours(0, 0, 0, 0);
    const dayEnd = date.setHours(23, 59, 59, 999);
    
    const dayAttempts = filteredHistory.filter(
      h => h.timestamp >= dayStart && h.timestamp <= dayEnd
    );
    
    return {
      date: format(date, 'EEE'),
      count: dayAttempts.length,
      avgScore: dayAttempts.length > 0
        ? dayAttempts.reduce((acc, h) => acc + h.percentage, 0) / dayAttempts.length
        : 0,
    };
  });

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear all history?')) {
      localStorage.removeItem('quiz-history');
      setHistory([]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            </div>
            <Button onClick={() => router.push('/')} variant="outline">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-700 font-bold" />
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
              className="px-3 py-2 border-2 rounded-lg font-semibold"
            >
              <option value="all">All Time</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="px-3 py-2 border-2 rounded-lg font-semibold"
            >
              <option value="all">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
          <div className="ml-auto">
            <Button variant="destructive" size="sm" onClick={clearHistory} className="font-bold">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear History
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <StatsCard
            title="Total Quizzes"
            value={stats.totalQuizzes}
            icon={Target}
            color="blue"
          />
          <StatsCard
            title="Average Score"
            value={`${stats.averageScore.toFixed(1)}%`}
            icon={TrendingUp}
            color="green"
          />
          <StatsCard
            title="Best Score"
            value={`${stats.bestScore.toFixed(1)}%`}
            icon={Trophy}
            color="yellow"
          />
          <StatsCard
            title="Total Time"
            value={formatTime(stats.totalTime)}
            icon={Clock}
            color="purple"
          />
          <StatsCard
            title="Improvement"
            value={`${stats.improvement > 0 ? '+' : ''}${stats.improvement.toFixed(1)}%`}
            icon={TrendingUp}
            color={stats.improvement > 0 ? 'green' : 'red'}
          />
          <StatsCard
            title="Current Streak"
            value={`${stats.streakDays} days`}
            icon={Calendar}
            color="blue"
          />
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Activity Chart */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="font-bold">Last 7 Days Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {last7Days.map((day) => (
                  <div key={day.date} className="flex items-center gap-4">
                    <span className="text-sm font-bold w-12">{day.date}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-8 relative overflow-hidden">
                      <div
                        className="absolute left-0 top-0 h-full bg-blue-600 flex items-center justify-end pr-2"
                        style={{ width: `${Math.min(day.count * 20, 100)}%` }}
                      >
                        {day.count > 0 && (
                          <span className="text-xs text-white font-bold">{day.count}</span>
                        )}
                      </div>
                    </div>
                    {day.avgScore > 0 && (
                      <span className="text-sm font-bold text-gray-800 w-16 text-right">
                        {day.avgScore.toFixed(0)}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Topics Performance */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="font-bold">Top Topics Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceData.length > 0 ? performanceData.map((topic) => (
                  <div key={topic.topic}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold truncate flex-1">
                        {topic.topic}
                      </span>
                      <span className="text-sm font-bold text-gray-700 ml-2">
                        {topic.attempts} attempts
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <div className="text-xs font-bold text-gray-700 mb-1">Average</div>
                        <div className="bg-gray-200 rounded-full h-6 relative overflow-hidden">
                          <div
                            className="absolute left-0 top-0 h-full bg-blue-600 flex items-center justify-end pr-2"
                            style={{ width: `${topic.average}%` }}
                          >
                            <span className="text-xs text-white font-bold">{topic.average.toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-gray-700 mb-1">Best</div>
                        <div className="bg-gray-200 rounded-full h-6 relative overflow-hidden">
                          <div
                            className="absolute left-0 top-0 h-full bg-green-600 flex items-center justify-end pr-2"
                            style={{ width: `${topic.best}%` }}
                          >
                            <span className="text-xs text-white font-bold">{topic.best.toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <p className="text-center text-gray-600 py-8 font-semibold">No quiz attempts yet. Start taking quizzes to see your performance!</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Attempts */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="font-bold">Recent Attempts</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2">
                      <th className="text-left py-2 font-bold">Date</th>
                      <th className="text-left py-2 font-bold">Subject</th>
                      <th className="text-left py-2 font-bold">Topic</th>
                      <th className="text-left py-2 font-bold">Score</th>
                      <th className="text-left py-2 font-bold">Grade</th>
                      <th className="text-left py-2 font-bold">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.slice(0, 10).map((attempt) => {
                      const { grade, color } = calculateGrade(attempt.percentage);
                      return (
                        <tr key={attempt.id} className="border-b">
                          <td className="py-2 font-semibold">{format(attempt.timestamp, 'MMM d, yyyy')}</td>
                          <td className="py-2 font-semibold">{attempt.subjectName}</td>
                          <td className="py-2 font-semibold">{attempt.topicName}</td>
                          <td className="py-2 font-semibold">{attempt.score}/{attempt.totalQuestions}</td>
                          <td className={`py-2 font-bold text-lg ${color}`}>{grade}</td>
                          <td className="py-2 font-semibold">{formatTime(attempt.timeSpent)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-600 py-8 font-semibold">No quiz history available. Start taking quizzes to build your history!</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
