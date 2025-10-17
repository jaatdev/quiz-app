import { LanguageCode, LANGUAGES } from '@/lib/i18n/config';

export interface QuizRecommendation {
  quizId: string;
  title: string;
  category: string;
  difficulty: string;
  language: LanguageCode;
  matchScore: number; // 0-100
  reason: string;
  estimatedTime: number; // in minutes
}

export interface UserQuizPreferences {
  preferredLanguages: LanguageCode[];
  favoriteCategories: string[];
  preferredDifficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  averageScore: number;
  totalAttempts: number;
}

/**
 * Quiz Recommendations Service
 * Recommends quizzes based on user profile, language preference, and history
 */
export const quizRecommendationService = {
  /**
   * Get personalized quiz recommendations for user
   */
  async getRecommendations(
    userId: string,
    limit: number = 5,
    language?: LanguageCode
  ): Promise<QuizRecommendation[]> {
    try {
      // Fetch user preferences and stats
      const preferences = await fetchUserPreferences(userId);
      const attempts = await fetchUserAttempts(userId);

      // Fetch all available quizzes
      const quizzes = await fetchAvailableQuizzes(language || preferences.preferredLanguages[0]);

      // Score and rank each quiz
      const scoredQuizzes = quizzes.map((quiz) => ({
        ...quiz,
        matchScore: calculateMatchScore(quiz, preferences, attempts)
      }));

      // Sort by match score and return top recommendations
      return scoredQuizzes
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, limit)
        .map((quiz) => ({
          quizId: quiz.id,
          title: quiz.title,
          category: quiz.category,
          difficulty: quiz.difficulty,
          language: quiz.language || 'en',
          matchScore: quiz.matchScore,
          reason: generateRecommendationReason(quiz, preferences),
          estimatedTime: quiz.timeLimit || 15
        }));
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      return [];
    }
  },

  /**
   * Get trending quizzes across the platform
   */
  async getTrendingQuizzes(
    limit: number = 5,
    language?: LanguageCode
  ): Promise<QuizRecommendation[]> {
    try {
      const res = await fetch('/api/quizzes/multilingual?sort=trending&limit=' + limit, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) throw new Error('Failed to fetch trending quizzes');

      const data = await res.json();
      return data.data.map((quiz: any) => ({
        quizId: quiz.id,
        title: quiz.title.en || quiz.title,
        category: quiz.category,
        difficulty: quiz.difficulty,
        language: 'en',
        matchScore: 75,
        reason: 'Trending on platform',
        estimatedTime: quiz.timeLimit || 15
      }));
    } catch (error) {
      console.error('Error fetching trending quizzes:', error);
      return [];
    }
  },

  /**
   * Get difficulty-appropriate quizzes for progression
   */
  async getProgressionQuizzes(userId: string, limit: number = 5): Promise<QuizRecommendation[]> {
    try {
      const preferences = await fetchUserPreferences(userId);
      const nextDifficulty = suggestNextDifficulty(preferences.averageScore);

      const res = await fetch(
        `/api/quizzes/multilingual?difficulty=${nextDifficulty}&limit=${limit * 2}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-clerk-user-id': userId
          }
        }
      );

      if (!res.ok) throw new Error('Failed to fetch progression quizzes');

      const data = await res.json();
      return data.data.map((quiz: any) => ({
        quizId: quiz.id,
        title: quiz.title.en || quiz.title,
        category: quiz.category,
        difficulty: quiz.difficulty,
        language: 'en',
        matchScore: 80,
        reason: `Perfect for ${nextDifficulty} level learners`,
        estimatedTime: quiz.timeLimit || 15
      }));
    } catch (error) {
      console.error('Error fetching progression quizzes:', error);
      return [];
    }
  },

  /**
   * Get category-based recommendations
   */
  async getCategoryRecommendations(
    userId: string,
    category: string,
    limit: number = 5
  ): Promise<QuizRecommendation[]> {
    try {
      const preferences = await fetchUserPreferences(userId);

      const res = await fetch(`/api/quizzes/multilingual?category=${category}&limit=${limit}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) throw new Error('Failed to fetch category quizzes');

      const data = await res.json();
      return data.data.map((quiz: any) => ({
        quizId: quiz.id,
        title: quiz.title.en || quiz.title,
        category: quiz.category,
        difficulty: quiz.difficulty,
        language: 'en',
        matchScore: 70,
        reason: `Related to ${category}`,
        estimatedTime: quiz.timeLimit || 15
      }));
    } catch (error) {
      console.error('Error fetching category quizzes:', error);
      return [];
    }
  },

  /**
   * Get language-specific recommendations
   */
  async getLanguageRecommendations(
    userId: string,
    language: LanguageCode,
    limit: number = 5
  ): Promise<QuizRecommendation[]> {
    try {
      const res = await fetch(`/api/quizzes/multilingual?language=${language}&limit=${limit}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) throw new Error('Failed to fetch language quizzes');

      const data = await res.json();
      return data.data.map((quiz: any) => ({
        quizId: quiz.id,
        title: quiz.title[language] || quiz.title.en,
        category: quiz.category,
        difficulty: quiz.difficulty,
        language,
        matchScore: 85,
        reason: `Available in ${LANGUAGES[language].nativeName}`,
        estimatedTime: quiz.timeLimit || 15
      }));
    } catch (error) {
      console.error('Error fetching language quizzes:', error);
      return [];
    }
  }
};

/**
 * Calculate recommendation match score (0-100)
 * Factors:
 * - Language match (25%)
 * - Category interest (20%)
 * - Difficulty progression (25%)
 * - Completion status (15%)
 * - Popularity/trending (15%)
 */
function calculateMatchScore(
  quiz: any,
  preferences: UserQuizPreferences,
  attempts: any[]
): number {
  let score = 0;

  // Language match (25%)
  const languageMatch = preferences.preferredLanguages.includes(quiz.language) ? 25 : 10;
  score += languageMatch;

  // Category interest (20%)
  const categoryMatch = preferences.favoriteCategories.includes(quiz.category) ? 20 : 5;
  score += categoryMatch;

  // Difficulty progression (25%)
  const userLevel = getSkillLevel(preferences.averageScore);
  const difficultyMatch = calculateDifficultyMatch(quiz.difficulty, userLevel);
  score += difficultyMatch * 0.25;

  // Completion status (15%) - not attempted
  const attemptedCount = attempts.filter((a) => a.quizId === quiz.id).length;
  const completionBonus = attemptedCount === 0 ? 15 : Math.max(0, 15 - attemptedCount * 5);
  score += completionBonus;

  // Popularity/trending (15%)
  const popularityScore = quiz.popularity || 10;
  score += Math.min(15, popularityScore / 5);

  return Math.min(100, Math.max(0, score));
}

/**
 * Generate human-readable recommendation reason
 */
function generateRecommendationReason(quiz: any, preferences: UserQuizPreferences): string {
  const reasons: string[] = [];

  if (preferences.favoriteCategories.includes(quiz.category)) {
    reasons.push(`You enjoy ${quiz.category} quizzes`);
  }

  if (preferences.preferredLanguages.includes(quiz.language)) {
    reasons.push(`Available in your preferred language`);
  }

  const userLevel = getSkillLevel(preferences.averageScore);
  if (matchesDifficulty(quiz.difficulty, userLevel)) {
    reasons.push(`Perfect difficulty for your level`);
  }

  if (reasons.length === 0) {
    reasons.push('Recommended for you');
  }

  return reasons.join(' • ');
}

/**
 * Helper functions
 */

async function fetchUserPreferences(userId: string): Promise<UserQuizPreferences> {
  try {
    const res = await fetch('/api/user/language-preferences', {
      headers: {
        'x-clerk-user-id': userId
      }
    });

    if (!res.ok) {
      return getDefaultPreferences();
    }

    const data = await res.json();
    return data.preferences;
  } catch {
    return getDefaultPreferences();
  }
}

function getDefaultPreferences(): UserQuizPreferences {
  return {
    preferredLanguages: ['en'],
    favoriteCategories: [],
    preferredDifficulty: 'medium',
    averageScore: 65,
    totalAttempts: 0
  };
}

async function fetchUserAttempts(userId: string): Promise<any[]> {
  try {
    const res = await fetch('/api/quizzes/multilingual/attempts', {
      headers: {
        'x-clerk-user-id': userId
      }
    });

    if (!res.ok) return [];

    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

async function fetchAvailableQuizzes(language: LanguageCode): Promise<any[]> {
  try {
    const res = await fetch(`/api/quizzes/multilingual?language=${language}&limit=50`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) return [];

    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

function getSkillLevel(averageScore: number): 'beginner' | 'intermediate' | 'advanced' {
  if (averageScore < 60) return 'beginner';
  if (averageScore < 80) return 'intermediate';
  return 'advanced';
}

function calculateDifficultyMatch(
  difficulty: string,
  userLevel: 'beginner' | 'intermediate' | 'advanced'
): number {
  const difficultyMap: Record<string, Record<string, number>> = {
    easy: { beginner: 100, intermediate: 50, advanced: 20 },
    medium: { beginner: 70, intermediate: 100, advanced: 80 },
    hard: { beginner: 30, intermediate: 80, advanced: 100 }
  };

  return difficultyMap[difficulty]?.[userLevel] || 50;
}

function matchesDifficulty(
  difficulty: string,
  userLevel: 'beginner' | 'intermediate' | 'advanced'
): boolean {
  const matches: Record<string, string[]> = {
    easy: ['beginner'],
    medium: ['beginner', 'intermediate', 'advanced'],
    hard: ['intermediate', 'advanced']
  };

  return matches[difficulty]?.includes(userLevel) || false;
}

function suggestNextDifficulty(
  averageScore: number
): 'easy' | 'medium' | 'hard' {
  if (averageScore < 60) return 'easy';
  if (averageScore < 75) return 'medium';
  return 'hard';
}

export default quizRecommendationService;
