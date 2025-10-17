import { useState, useCallback, useEffect } from 'react';
import { LanguageCode } from '@/lib/i18n/config';

export type AchievementType =
  | 'first_quiz'
  | 'perfect_score'
  | 'polyglot'
  | 'speed_demon'
  | 'subject_master'
  | 'streak_5'
  | 'global_learner';

interface AchievementProgress {
  first_quiz?: { progress: number; maxProgress: number };
  perfect_score?: { progress: number; maxProgress: number };
  polyglot?: { progress: number; maxProgress: number };
  speed_demon?: { progress: number; maxProgress: number };
  subject_master?: { progress: number; maxProgress: number };
  streak_5?: { progress: number; maxProgress: number };
  global_learner?: { progress: number; maxProgress: number };
}

interface UserStatistics {
  totalAttempts: number;
  overallAverage: number;
  byLanguage: Record<LanguageCode, { attempts: number; average: number; totalPoints: number }>;
  perfectScores: number;
  currentStreak: number;
  maxStreak: number;
  averageTime: number;
  lastAttemptDate: Date | null;
}

const STORAGE_KEY = 'quiz-achievements';
const STATS_STORAGE_KEY = 'quiz-achievement-stats';

export const useAchievements = (userId?: string) => {
  const [unlockedAchievements, setUnlockedAchievements] = useState<AchievementType[]>([]);
  const [progressAchievements, setProgressAchievements] = useState<AchievementProgress>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load achievements from localStorage on mount
  useEffect(() => {
    const loadAchievements = () => {
      try {
        setIsLoading(true);
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const data = JSON.parse(stored);
          setUnlockedAchievements(data.unlocked || []);
          setProgressAchievements(data.progress || {});
        }
      } catch (err) {
        setError('Failed to load achievements');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAchievements();
  }, []);

  // Save achievements to localStorage
  const saveAchievements = useCallback(
    (unlocked: AchievementType[], progress: AchievementProgress) => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            unlocked,
            progress,
            lastUpdated: new Date().toISOString(),
            userId
          })
        );
      } catch (err) {
        setError('Failed to save achievements');
        console.error(err);
      }
    },
    [userId]
  );

  // Check and unlock achievements based on quiz attempt
  const recordQuizAttempt = useCallback(
    (attemptData: {
      language: LanguageCode;
      score: number;
      totalQuestions: number;
      timeSpent: number; // in seconds
      perfectScore: boolean;
    }) => {
      const newUnlocked = [...unlockedAchievements];
      const newProgress = { ...progressAchievements };

      // First Quiz
      if (!unlockedAchievements.includes('first_quiz')) {
        newUnlocked.push('first_quiz');
      }

      // Perfect Score
      if (attemptData.perfectScore && !unlockedAchievements.includes('perfect_score')) {
        newUnlocked.push('perfect_score');
      }

      // Speed Demon (< 2 minutes)
      if (attemptData.timeSpent < 120 && !unlockedAchievements.includes('speed_demon')) {
        newUnlocked.push('speed_demon');
      }

      // Update progress achievements
      updateProgressAchievements(newProgress, attemptData);

      setUnlockedAchievements(newUnlocked);
      setProgressAchievements(newProgress);
      saveAchievements(newUnlocked, newProgress);

      return {
        newlyUnlocked: newUnlocked.filter((a) => !unlockedAchievements.includes(a)),
        totalUnlocked: newUnlocked.length
      };
    },
    [unlockedAchievements, progressAchievements, saveAchievements]
  );

  // Update progress-based achievements
  const updateProgressAchievements = useCallback(
    (
      progress: AchievementProgress,
      data: { language?: LanguageCode; score?: number; totalQuestions?: number }
    ) => {
      try {
        const statsStr = localStorage.getItem(STATS_STORAGE_KEY);
        const stats: UserStatistics = statsStr
          ? JSON.parse(statsStr)
          : {
              totalAttempts: 0,
              overallAverage: 0,
              byLanguage: {},
              perfectScores: 0,
              currentStreak: 0,
              maxStreak: 0,
              averageTime: 0,
              lastAttemptDate: null
            };

        // Polyglot (all 4 languages)
        const languages = Object.keys(stats.byLanguage || {});
        if (languages.length === 4 && !unlockedAchievements.includes('polyglot')) {
          const updated = [...unlockedAchievements, 'polyglot'] as AchievementType[];
          setUnlockedAchievements(updated);
          saveAchievements(updated, progress);
        }

        // Subject Master (90%+ on 10 quizzes) - tracked via progress
        if (stats.totalAttempts >= 10 && stats.overallAverage >= 90) {
          progress.subject_master = {
            progress: stats.totalAttempts,
            maxProgress: 10
          };

          if (!unlockedAchievements.includes('subject_master')) {
            const updated = [...unlockedAchievements, 'subject_master'] as AchievementType[];
            setUnlockedAchievements(updated);
            saveAchievements(updated, progress);
          }
        } else {
          progress.subject_master = {
            progress: stats.totalAttempts || 0,
            maxProgress: 10
          };
        }

        // Streak (5 in a row) - tracked via progress
        progress.streak_5 = {
          progress: Math.min(stats.currentStreak || 0, 5),
          maxProgress: 5
        };

        if (stats.currentStreak >= 5 && !unlockedAchievements.includes('streak_5')) {
          const updated = [...unlockedAchievements, 'streak_5'] as AchievementType[];
          setUnlockedAchievements(updated);
          saveAchievements(updated, progress);
        }

        // Global Learner (100+ points per language)
        const globalProgress = Object.entries(stats.byLanguage || {}).filter(
          ([, langStats]) => (langStats.totalPoints || 0) >= 100
        ).length;
        progress.global_learner = {
          progress: globalProgress,
          maxProgress: 4
        };

        if (globalProgress === 4 && !unlockedAchievements.includes('global_learner')) {
          const updated = [...unlockedAchievements, 'global_learner'] as AchievementType[];
          setUnlockedAchievements(updated);
          saveAchievements(updated, progress);
        }
      } catch (err) {
        console.error('Failed to update progress achievements:', err);
      }
    },
    [unlockedAchievements, saveAchievements]
  );

  // Get all achievement data for display
  const getAchievementData = useCallback(() => {
    return {
      unlocked: unlockedAchievements,
      progress: progressAchievements,
      totalUnlocked: unlockedAchievements.length,
      totalAvailable: 7
    };
  }, [unlockedAchievements, progressAchievements]);

  // Sync achievements with backend
  const syncWithBackend = useCallback(
    async (userIdOverride?: string) => {
      if (!userIdOverride && !userId) {
        console.warn('No userId provided for backend sync');
        return;
      }

      try {
        const response = await fetch('/api/user/achievements', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-clerk-user-id': userIdOverride || userId || ''
          },
          body: JSON.stringify({
            unlocked: unlockedAchievements,
            progress: progressAchievements
          })
        });

        if (!response.ok) {
          throw new Error('Failed to sync achievements');
        }

        const data = await response.json();
        console.log('Achievements synced with backend:', data);
      } catch (err) {
        console.error('Achievement sync error:', err);
        setError('Failed to sync achievements with backend');
      }
    },
    [userId, unlockedAchievements, progressAchievements]
  );

  // Reset achievements (for testing)
  const resetAchievements = useCallback(() => {
    setUnlockedAchievements([]);
    setProgressAchievements({});
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STATS_STORAGE_KEY);
  }, []);

  return {
    // State
    unlockedAchievements,
    progressAchievements,
    isLoading,
    error,

    // Methods
    recordQuizAttempt,
    updateProgressAchievements,
    getAchievementData,
    syncWithBackend,
    resetAchievements
  };
};

export default useAchievements;
