import { useState, useEffect } from 'react';

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

export function useQuizHistory() {
  const [history, setHistory] = useState<QuizAttempt[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const stored = localStorage.getItem('quiz-history');
    if (stored) {
      setHistory(JSON.parse(stored));
    }
  };

  const addAttempt = (attempt: Omit<QuizAttempt, 'id' | 'timestamp'>) => {
    const newAttempt: QuizAttempt = {
      ...attempt,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };

    const updatedHistory = [newAttempt, ...history].slice(0, 50); // Keep last 50 attempts
    localStorage.setItem('quiz-history', JSON.stringify(updatedHistory));
    setHistory(updatedHistory);
  };

  const getTopicHistory = (topicId: string) => {
    return history.filter(attempt => attempt.topicId === topicId);
  };

  const getBestScore = (topicId: string) => {
    const topicHistory = getTopicHistory(topicId);
    if (topicHistory.length === 0) return null;
    return Math.max(...topicHistory.map(a => a.percentage));
  };

  const getAverageScore = (topicId: string) => {
    const topicHistory = getTopicHistory(topicId);
    if (topicHistory.length === 0) return null;
    const sum = topicHistory.reduce((acc, a) => acc + a.percentage, 0);
    return sum / topicHistory.length;
  };

  const clearHistory = () => {
    localStorage.removeItem('quiz-history');
    setHistory([]);
  };

  return {
    history,
    addAttempt,
    getTopicHistory,
    getBestScore,
    getAverageScore,
    clearHistory,
  };
}
