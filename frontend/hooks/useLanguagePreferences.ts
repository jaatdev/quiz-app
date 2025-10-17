'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { LanguageCode } from '@/lib/i18n/config';

interface LanguagePreference {
  preferredLanguage: LanguageCode;
  quizzesAttempted: Record<LanguageCode, number>;
  averageScores: Record<LanguageCode, number>;
  totalTimeSpent: Record<LanguageCode, number>;
  lastUsedLanguage: LanguageCode;
  lastUsedAt: string;
}

/**
 * Hook for tracking user language preferences and statistics
 * Stores data in localStorage and syncs with backend
 */
export const useLanguagePreferences = () => {
  const { language } = useLanguage();
  const [preferences, setPreferences] = useState<LanguagePreference | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize preferences from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('languagePreferences');
      if (stored) {
        setPreferences(JSON.parse(stored));
      } else {
        // Create default preferences
        const defaultPrefs: LanguagePreference = {
          preferredLanguage: language as LanguageCode,
          quizzesAttempted: { en: 0, hi: 0, es: 0, fr: 0 },
          averageScores: { en: 0, hi: 0, es: 0, fr: 0 },
          totalTimeSpent: { en: 0, hi: 0, es: 0, fr: 0 },
          lastUsedLanguage: language as LanguageCode,
          lastUsedAt: new Date().toISOString()
        };
        setPreferences(defaultPrefs);
        localStorage.setItem('languagePreferences', JSON.stringify(defaultPrefs));
      }
    } catch (error) {
      console.error('Error loading language preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update language preference
  const updatePreferredLanguage = useCallback((newLanguage: LanguageCode) => {
    setPreferences((prev) => {
      if (!prev) return null;
      const updated = {
        ...prev,
        preferredLanguage: newLanguage,
        lastUsedLanguage: newLanguage,
        lastUsedAt: new Date().toISOString()
      };
      localStorage.setItem('languagePreferences', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Record quiz attempt
  const recordAttempt = useCallback((lang: LanguageCode, score: number, timeSpent: number) => {
    setPreferences((prev) => {
      if (!prev) return null;

      const updated = {
        ...prev,
        quizzesAttempted: {
          ...prev.quizzesAttempted,
          [lang]: (prev.quizzesAttempted[lang] || 0) + 1
        },
        averageScores: {
          ...prev.averageScores,
          [lang]:
            (prev.averageScores[lang] * (prev.quizzesAttempted[lang] || 0) + score) /
            ((prev.quizzesAttempted[lang] || 0) + 1)
        },
        totalTimeSpent: {
          ...prev.totalTimeSpent,
          [lang]: (prev.totalTimeSpent[lang] || 0) + timeSpent
        },
        lastUsedLanguage: lang,
        lastUsedAt: new Date().toISOString()
      };

      localStorage.setItem('languagePreferences', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Get language statistics
  const getStatistics = useCallback(() => {
    if (!preferences) return null;

    const totalAttempts = Object.values(preferences.quizzesAttempted).reduce((a, b) => a + b, 0);
    const overallAverage =
      totalAttempts > 0
        ? Object.values(preferences.averageScores).reduce((a, b) => a + b, 0) /
          Object.keys(preferences.averageScores).length
        : 0;

    return {
      totalAttempts,
      overallAverage,
      byLanguage: Object.entries(preferences.quizzesAttempted).map(([lang, attempts]) => ({
        language: lang as LanguageCode,
        attempts,
        averageScore: preferences.averageScores[lang as LanguageCode],
        totalTime: preferences.totalTimeSpent[lang as LanguageCode]
      }))
    };
  }, [preferences]);

  // Sync with backend
  const syncWithBackend = useCallback(async (userId: string) => {
    if (!preferences) return;

    try {
      const response = await fetch('/api/user/language-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-clerk-user-id': userId
        },
        body: JSON.stringify(preferences)
      });

      if (!response.ok) {
        console.error('Failed to sync language preferences');
      }
    } catch (error) {
      console.error('Error syncing language preferences:', error);
    }
  }, [preferences]);

  return {
    preferences,
    isLoading,
    updatePreferredLanguage,
    recordAttempt,
    getStatistics,
    syncWithBackend
  };
};
