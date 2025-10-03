'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Star, Zap, Target, BookOpen } from 'lucide-react';
import { format } from 'date-fns';

interface Achievement {
  id: string;
  type: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
}

interface AchievementDisplayProps {
  achievements: Achievement[];
}

export function AchievementDisplay({ achievements }: AchievementDisplayProps) {
  const getIconComponent = (icon: string) => {
    switch (icon) {
      case '🎯': return <Target className="w-8 h-8 text-blue-500" />;
      case '⭐': return <Star className="w-8 h-8 text-yellow-500" />;
      case '⚡': return <Zap className="w-8 h-8 text-purple-500" />;
      case '🏆': return <Trophy className="w-8 h-8 text-gold-500" />;
      case '📚': return <BookOpen className="w-8 h-8 text-green-500" />;
      default: return <Trophy className="w-8 h-8 text-gray-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Achievements
        </CardTitle>
      </CardHeader>
      <CardContent>
        {achievements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="flex items-start gap-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200"
              >
                <div className="text-2xl">{achievement.icon}</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{achievement.title}</h4>
                  <p className="text-sm text-gray-700">{achievement.description}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Unlocked {format(new Date(achievement.unlockedAt), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-700">No achievements yet. Keep playing to unlock!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
