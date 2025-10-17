'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import { 
  Users, BookOpen, FileText, Trophy, 
  Activity, Lock
} from 'lucide-react';
import { format } from 'date-fns';
import { API_URL } from '@/lib/config';
import { AdminRoute } from '@/components/ProtectedRoute';
import { PRIMARY_ADMIN_EMAIL } from '@/lib/config-admin';
import { useAuth } from '@/lib/hooks/useAuth';

interface AdminStats {
  totalUsers: number;
  totalQuizzes: number;
  totalQuestions: number;
  totalSubjects: number;
  totalTopics: number;
  recentUsers: Array<{
    id: string;
    name: string | null;
    email: string;
    createdAt: string;
  }>;
  recentQuizzes: Array<{
    id: string;
    percentage: number;
    completedAt: string;
    user: {
      name: string | null;
      email: string;
    };
    topic: {
      name: string;
      subject: {
        name: string;
      };
    };
  }>;
}

function AdminDashboardContent() {
  const { user } = useUser();
  const { displayName, user: authUser } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    try {
      const response = await fetch(`${API_URL}/admin/stats`, {
        headers: {
          'x-clerk-user-id': user.id,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-700">Failed to load dashboard data</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">⚙️ Admin Dashboard</h1>
        <p className="text-gray-700">Welcome, <span className="font-semibold">{displayName}</span>! Manage your quiz platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700 font-medium">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700 font-medium">Total Quizzes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalQuizzes}</p>
              </div>
              <Trophy className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700 font-medium">Questions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalQuestions}</p>
              </div>
              <FileText className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700 font-medium">Subjects</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSubjects}</p>
              </div>
              <BookOpen className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700 font-medium">Topics</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTopics}</p>
              </div>
              <Activity className="w-8 h-8 text-pink-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentUsers.length > 0 ? (
                stats.recentUsers.map((usr) => (
                  <div key={usr.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{usr.name || 'Anonymous'}</p>
                      <p className="text-sm text-gray-700">{usr.email}</p>
                    </div>
                    <p className="text-sm text-gray-700">
                      {format(new Date(usr.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-700 text-center py-4">No recent users</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Quizzes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentQuizzes.length > 0 ? (
                stats.recentQuizzes.map((quiz) => (
                  <div key={quiz.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{quiz.user.name || 'Anonymous'}</p>
                      <p className="text-sm text-gray-700">
                        {quiz.topic.subject.name} - {quiz.topic.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{quiz.percentage.toFixed(0)}%</p>
                      <p className="text-sm text-gray-700">
                        {format(new Date(quiz.completedAt), 'MMM d')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-700 text-center py-4">No recent quizzes</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user: authUser } = useAuth();
  const isAdmin =
    authUser?.publicMetadata?.role === 'admin' ||
    authUser?.unsafeMetadata?.role === 'admin' ||
    authUser?.primaryEmailAddress?.emailAddress === PRIMARY_ADMIN_EMAIL;
  
  return (
    <AdminRoute isAdmin={isAdmin}>
      <AdminDashboardContent />
    </AdminRoute>
  );
}
