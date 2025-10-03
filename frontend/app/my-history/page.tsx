'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { 
  Clock, Home, Search, Filter, Eye,
  ChevronLeft, ChevronRight, Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { calculateGrade } from '@/lib/utils';

interface QuizAttempt {
  id: string;
  topicId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  timeSpent: number;
  difficulty: string;
  completedAt: string;
  topic: {
    name: string;
    subject: {
      name: string;
    };
  };
}

export default function MyHistoryPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'subject'>('date');
  const itemsPerPage = 10;

  // Redirect if not logged in
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
    }
  }, [user, isLoaded, router]);

  // Fetch quiz history from database
  const { data: history, isLoading } = useQuery<QuizAttempt[]>({
    queryKey: ['user-history', user?.id],
    queryFn: async () => {
      const response = await fetch(`http://localhost:5000/api/user/history/${user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch history');
      return response.json();
    },
    enabled: !!user,
  });

  // Filter and sort history
  const getFilteredHistory = () => {
    if (!history) return [];
    
    let filtered = [...history];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.topic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.topic.subject.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
        case 'score':
          return b.percentage - a.percentage;
        case 'subject':
          return a.topic.subject.name.localeCompare(b.topic.subject.name);
        default:
          return 0;
      }
    });
    
    return filtered;
  };

  const filteredHistory = getFilteredHistory();
  
  // Pagination
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedHistory = filteredHistory.slice(startIndex, startIndex + itemsPerPage);

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Quiz History</h1>
              <p className="text-sm text-gray-600">View all your quiz attempts</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => router.push('/dashboard')} variant="outline">
                Dashboard
              </Button>
              <Button onClick={() => router.push('/')} variant="outline">
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
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search topics or subjects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                />
              </div>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="date">Sort by Date</option>
                <option value="score">Sort by Score</option>
                <option value="subject">Sort by Subject</option>
              </select>
            </div>
            
            <div className="flex gap-4 mt-4 text-sm text-gray-600">
              <span>Total: {filteredHistory.length} quizzes</span>
              <span>•</span>
              <span>
                Average: {filteredHistory.length > 0 
                  ? (filteredHistory.reduce((acc, h) => acc + h.percentage, 0) / filteredHistory.length).toFixed(1)
                  : 0}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* History Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-4 text-left">Date</th>
                    <th className="p-4 text-left">Subject</th>
                    <th className="p-4 text-left">Topic</th>
                    <th className="p-4 text-left">Score</th>
                    <th className="p-4 text-left">Grade</th>
                    <th className="p-4 text-left">Time</th>
                    <th className="p-4 text-left">Difficulty</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedHistory.map((item) => {
                    const { grade, color } = calculateGrade(item.percentage);
                    return (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                              <div>{format(new Date(item.completedAt), 'MMM d, yyyy')}</div>
                              <div className="text-xs text-gray-500">
                                {format(new Date(item.completedAt), 'h:mm a')}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">{item.topic.subject.name}</td>
                        <td className="p-4">{item.topic.name}</td>
                        <td className="p-4">
                          <div>{item.percentage.toFixed(1)}%</div>
                          <div className="text-xs text-gray-500">
                            {item.correctAnswers}/{item.totalQuestions}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`font-bold ${color}`}>{grade}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            {Math.floor(item.timeSpent / 60)}:{(item.timeSpent % 60).toString().padStart(2, '0')}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-gray-100 rounded text-xs capitalize">
                            {item.difficulty}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {paginatedHistory.length === 0 && (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">
                    {searchTerm ? 'No quizzes found matching your search' : 'No quiz history yet'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <span className="px-4 py-2">
              Page {currentPage} of {totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
