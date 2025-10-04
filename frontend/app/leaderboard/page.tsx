'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Trophy, Medal, Crown, TrendingUp, TrendingDown, 
  Home, Filter, User
} from 'lucide-react';
import { useToast } from '@/providers/toast-provider';

interface LeaderboardUser {
  id: string;
  name: string;
  totalQuizzes: number;
  averageScore: number;
  bestScore: number;
  totalPoints: number;
  level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  rank: number;
  previousRank?: number;
}

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

export default function LeaderboardPage() {
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [timeFilter, setTimeFilter] = useState<'daily' | 'weekly' | 'all'>('all');
  const [currentUserId] = useState('current-user'); // In real app, get from auth
  const { showToast } = useToast();
  const hasShownEmptyToastRef = useRef(false);

  useEffect(() => {
    loadLeaderboard();
  }, [timeFilter]);

  const loadLeaderboard = () => {
    // Load quiz history for current user
    const stored = localStorage.getItem('quiz-history');
    let history: QuizAttempt[] = [];
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        history = Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        console.error('Failed to parse quiz history for leaderboard:', error);
        showToast({ variant: 'error', title: 'Failed to load local leaderboard data.' });
      }
    }
    if (history.length === 0 && !hasShownEmptyToastRef.current) {
      hasShownEmptyToastRef.current = true;
      showToast({
        variant: 'info',
        title: 'No quiz history yet.',
        description: 'Take a quiz to see yourself on the leaderboard.',
      });
    }
    
    // Filter by time
    let filtered = [...history];
    const now = Date.now();
    
    if (timeFilter === 'daily') {
      const oneDayAgo = now - 24 * 60 * 60 * 1000;
      filtered = filtered.filter(h => h.timestamp > oneDayAgo);
    } else if (timeFilter === 'weekly') {
      const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
      filtered = filtered.filter(h => h.timestamp > oneWeekAgo);
    }

    // Calculate user stats (real data from quiz history)
    const currentUser = calculateUserStats('current-user', 'You', filtered);
    
    // Always show mock users for competitive leaderboard experience
    // In a real app, this would fetch from an API
    const sampleUsers = [
      { id: 'user1', name: 'Alice Johnson' },
      { id: 'user2', name: 'Bob Smith' },
      { id: 'user3', name: 'Charlie Brown' },
      { id: 'user4', name: 'Diana Prince' },
      { id: 'user5', name: 'Ethan Hunt' },
      { id: 'user6', name: 'Fiona Chen' },
      { id: 'user7', name: 'George Wilson' },
      { id: 'user8', name: 'Hannah Lee' },
      { id: 'user9', name: 'Ivan Petrov' },
      { id: 'user10', name: 'Julia Martinez' },
      { id: 'user11', name: 'Kevin Park' },
      { id: 'user12', name: 'Lisa Anderson' },
      { id: 'user13', name: 'Michael Torres' },
      { id: 'user14', name: 'Nina Patel' },
      { id: 'user15', name: 'Oscar Rodriguez' },
    ];

    const allUsers = [
      currentUser,
      ...sampleUsers.map(u => generateSampleUser(u.id, u.name)),
    ];

    // Sort by total points and assign ranks
    allUsers.sort((a, b) => b.totalPoints - a.totalPoints);
    allUsers.forEach((user, index) => {
      user.rank = index + 1;
      user.previousRank = user.rank + Math.floor(Math.random() * 3) - 1; // Random rank change
    });

    if (history.length > 0 && filtered.length === 0) {
      showToast({
        variant: 'info',
        title: 'No attempts in this range.',
        description: 'Try a wider filter to see more leaderboard data.',
      });
    }

    setLeaderboard(allUsers);
  };

  const calculateUserStats = (id: string, name: string, history: QuizAttempt[]): LeaderboardUser => {
    if (history.length === 0) {
      return {
        id,
        name,
        totalQuizzes: 0,
        averageScore: 0,
        bestScore: 0,
        totalPoints: 0,
        level: 'Bronze',
        rank: 0,
      };
    }

    const totalQuizzes = history.length;
    const averageScore = history.reduce((acc, h) => acc + h.percentage, 0) / totalQuizzes;
    const bestScore = Math.max(...history.map(h => h.percentage));
    const totalPoints = Math.floor(history.reduce((acc, h) => acc + h.percentage, 0));

    const level = calculateLevel(totalPoints);

    return {
      id,
      name,
      totalQuizzes,
      averageScore,
      bestScore,
      totalPoints,
      level,
      rank: 0,
    };
  };

  const generateSampleUser = (id: string, name: string): LeaderboardUser => {
    const totalQuizzes = Math.floor(Math.random() * 50) + 10;
    const averageScore = Math.random() * 40 + 50; // 50-90%
    const bestScore = Math.min(averageScore + Math.random() * 20, 100);
    const totalPoints = Math.floor(averageScore * totalQuizzes);
    const level = calculateLevel(totalPoints);

    return {
      id,
      name,
      totalQuizzes,
      averageScore,
      bestScore,
      totalPoints,
      level,
      rank: 0,
    };
  };

  const calculateLevel = (totalPoints: number): 'Bronze' | 'Silver' | 'Gold' | 'Platinum' => {
    if (totalPoints >= 1000) return 'Platinum';
    if (totalPoints >= 500) return 'Gold';
    if (totalPoints >= 200) return 'Silver';
    return 'Bronze';
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Platinum': return 'text-cyan-500';
      case 'Gold': return 'text-yellow-500';
      case 'Silver': return 'text-gray-400';
      case 'Bronze': return 'text-orange-700';
      default: return 'text-gray-600';
    }
  };

  const getLevelBgColor = (level: string) => {
    switch (level) {
      case 'Platinum': return 'bg-cyan-100 border-cyan-500';
      case 'Gold': return 'bg-yellow-100 border-yellow-500';
      case 'Silver': return 'bg-gray-100 border-gray-400';
      case 'Bronze': return 'bg-orange-100 border-orange-700';
      default: return 'bg-gray-100 border-gray-400';
    }
  };

  const getRankChange = (user: LeaderboardUser) => {
    if (!user.previousRank) return null;
    const change = user.previousRank - user.rank;
    if (change > 0) {
      return (
        <div className="flex items-center text-green-600">
          <TrendingUp className="w-4 h-4" />
          <span className="ml-1 text-sm font-bold">+{change}</span>
        </div>
      );
    } else if (change < 0) {
      return (
        <div className="flex items-center text-red-600">
          <TrendingDown className="w-4 h-4" />
          <span className="ml-1 text-sm font-bold">{change}</span>
        </div>
      );
    }
    return <span className="text-gray-500 text-sm font-semibold">-</span>;
  };

  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white border-b-2 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
            </div>
            <Button onClick={() => router.push('/')} variant="outline" className="font-bold">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Time Filter */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Filter className="w-4 h-4 text-gray-700 font-bold" />
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as any)}
            className="px-4 py-2 border-2 rounded-lg font-bold text-gray-900"
          >
            <option value="daily">Today</option>
            <option value="weekly">This Week</option>
            <option value="all">All Time</option>
          </select>
        </div>

        {/* Podium - Top 3 */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-900">Top Performers</h2>
          <div className="flex items-end justify-center gap-4">
                {/* 2nd Place */}
                {topThree[1] && (
                  <div className="flex flex-col items-center">
                    <div className="relative mb-2">
                      <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center border-4 border-gray-400">
                        <Medal className="w-10 h-10 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 bg-gray-400 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg">
                        2
                      </div>
                    </div>
                    <div className={`${getLevelBgColor(topThree[1].level)} rounded-lg p-4 w-48 border-4`}>
                      <div className="text-center">
                        <p className="font-bold text-gray-900 truncate">{topThree[1].name}</p>
                        <p className={`text-sm font-bold ${getLevelColor(topThree[1].level)}`}>
                          {topThree[1].level}
                        </p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">
                          {topThree[1].totalPoints}
                        </p>
                        <p className="text-xs text-gray-700 font-semibold">points</p>
                      </div>
                    </div>
                    <div className="bg-gray-300 w-48 h-32 mt-2 rounded-t-lg border-4 border-gray-400"></div>
                  </div>
                )}

                {/* 1st Place */}
                {topThree[0] && (
                  <div className="flex flex-col items-center">
                    <div className="relative mb-2">
                      <div className="w-24 h-24 rounded-full bg-yellow-400 flex items-center justify-center border-4 border-yellow-600 shadow-lg">
                        <Crown className="w-12 h-12 text-yellow-900" />
                      </div>
                      <div className="absolute -top-2 -right-2 bg-yellow-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-xl">
                        1
                      </div>
                    </div>
                    <div className={`${getLevelBgColor(topThree[0].level)} rounded-lg p-4 w-52 border-4 shadow-lg`}>
                      <div className="text-center">
                        <p className="font-bold text-gray-900 truncate">{topThree[0].name}</p>
                        <p className={`text-sm font-bold ${getLevelColor(topThree[0].level)}`}>
                          {topThree[0].level}
                        </p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          {topThree[0].totalPoints}
                        </p>
                        <p className="text-xs text-gray-700 font-semibold">points</p>
                      </div>
                    </div>
                    <div className="bg-yellow-300 w-52 h-40 mt-2 rounded-t-lg border-4 border-yellow-600"></div>
                  </div>
                )}

                {/* 3rd Place */}
                {topThree[2] && (
                  <div className="flex flex-col items-center">
                    <div className="relative mb-2">
                      <div className="w-20 h-20 rounded-full bg-orange-400 flex items-center justify-center border-4 border-orange-600">
                        <Medal className="w-10 h-10 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg">
                        3
                      </div>
                    </div>
                    <div className={`${getLevelBgColor(topThree[2].level)} rounded-lg p-4 w-48 border-4`}>
                      <div className="text-center">
                        <p className="font-bold text-gray-900 truncate">{topThree[2].name}</p>
                        <p className={`text-sm font-bold ${getLevelColor(topThree[2].level)}`}>
                          {topThree[2].level}
                        </p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">
                          {topThree[2].totalPoints}
                        </p>
                        <p className="text-xs text-gray-700 font-semibold">points</p>
                      </div>
                    </div>
                    <div className="bg-orange-300 w-48 h-24 mt-2 rounded-t-lg border-4 border-orange-600"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Full Leaderboard */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="font-bold">Full Rankings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {rest.map((user) => {
                    const isCurrentUser = user.id === currentUserId;
                    return (
                      <div
                        key={user.id}
                        className={`flex items-center gap-4 p-4 rounded-lg border-2 ${
                          isCurrentUser
                            ? 'bg-blue-50 border-blue-500 shadow-md'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="w-12 text-center">
                          <span className="text-2xl font-bold text-gray-900">#{user.rank}</span>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {isCurrentUser && <User className="w-4 h-4 text-blue-600" />}
                            <span className={`font-bold ${isCurrentUser ? 'text-blue-900' : 'text-gray-900'}`}>
                              {user.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-1">
                            <span className={`text-sm font-bold ${getLevelColor(user.level)}`}>
                              {user.level}
                            </span>
                            <span className="text-sm text-gray-700 font-semibold">
                              {user.totalQuizzes} quizzes
                            </span>
                            <span className="text-sm text-gray-700 font-semibold">
                              Avg: {user.averageScore.toFixed(1)}%
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            {user.totalPoints}
                          </div>
                          <div className="text-xs text-gray-700 font-semibold">points</div>
                        </div>

                        <div className="w-16 text-center">
                          {getRankChange(user)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Level Guide */}
            <Card className="border-2 mt-8">
              <CardHeader>
                <CardTitle className="font-bold">Level System</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { level: 'Bronze', points: '0-199', color: 'orange' },
                    { level: 'Silver', points: '200-499', color: 'gray' },
                    { level: 'Gold', points: '500-999', color: 'yellow' },
                    { level: 'Platinum', points: '1000+', color: 'cyan' },
                  ].map(({ level, points, color }) => (
                    <div
                      key={level}
                      className={`p-4 rounded-lg border-2 ${getLevelBgColor(level)}`}
                    >
                      <p className={`font-bold text-lg ${getLevelColor(level)}`}>{level}</p>
                      <p className="text-sm text-gray-700 font-semibold">{points} points</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
      </div>
    </div>
  );
}
