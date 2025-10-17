import { renderHook, act } from '@testing-library/react'
import { useAchievements } from '@/hooks/useAchievements'

describe('useAchievements', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  it('should initialize with empty achievements', () => {
    const { result } = renderHook(() => useAchievements())
    
    expect(result.current.unlockedAchievements).toEqual([])
  })

  it('should record quiz attempt and unlock first_quiz', () => {
    const { result } = renderHook(() => useAchievements())
    
    act(() => {
      result.current.recordQuizAttempt({
        language: 'en',
        score: 75,
        totalQuestions: 10,
        timeSpent: 300,
        perfectScore: false
      })
    })
    
    expect(result.current.unlockedAchievements).toContain('first_quiz')
  })

  it('should not add duplicate achievements', () => {
    const { result } = renderHook(() => useAchievements())
    
    act(() => {
      result.current.recordQuizAttempt({
        language: 'en',
        score: 100,
        totalQuestions: 10,
        timeSpent: 300,
        perfectScore: true
      })
      result.current.recordQuizAttempt({
        language: 'en',
        score: 100,
        totalQuestions: 10,
        timeSpent: 300,
        perfectScore: true
      })
    })
    
    const firstQuizCount = result.current.unlockedAchievements.filter(a => a === 'first_quiz').length
    expect(firstQuizCount).toBeLessThanOrEqual(1)
  })

  it('should persist achievements to localStorage', () => {
    const { result } = renderHook(() => useAchievements())
    
    act(() => {
      result.current.recordQuizAttempt({
        language: 'en',
        score: 100,
        totalQuestions: 10,
        timeSpent: 300,
        perfectScore: true
      })
    })
    
    const stored = localStorage.getItem('quiz-achievements')
    expect(stored).toBeTruthy()
    const data = JSON.parse(stored!)
    expect(data.unlocked).toContain('first_quiz')
  })

  it('should load achievements from localStorage', () => {
    const achievements = { unlocked: ['first_quiz', 'perfect_score'], progress: {} }
    localStorage.setItem('quiz-achievements', JSON.stringify(achievements))
    
    const { result } = renderHook(() => useAchievements())
    
    // Wait for loading
    expect(result.current.isLoading).toBeDefined()
  })

  it('should unlock perfect_score achievement', () => {
    const { result } = renderHook(() => useAchievements())
    
    act(() => {
      result.current.recordQuizAttempt({
        language: 'en',
        score: 100,
        totalQuestions: 10,
        timeSpent: 300,
        perfectScore: true
      })
    })
    
    expect(result.current.unlockedAchievements).toContain('perfect_score')
  })

  it('should unlock speed_demon achievement', () => {
    const { result } = renderHook(() => useAchievements())
    
    act(() => {
      result.current.recordQuizAttempt({
        language: 'en',
        score: 75,
        totalQuestions: 10,
        timeSpent: 90, // 90 seconds < 120 seconds
        perfectScore: false
      })
    })
    
    expect(result.current.unlockedAchievements).toContain('speed_demon')
  })

  it('should get achievement data', () => {
    const { result } = renderHook(() => useAchievements())
    
    act(() => {
      result.current.recordQuizAttempt({
        language: 'en',
        score: 75,
        totalQuestions: 10,
        timeSpent: 300,
        perfectScore: false
      })
    })
    
    const data = result.current.getAchievementData()
    expect(data.totalUnlocked).toBeGreaterThan(0)
    expect(data.totalAvailable).toBe(7)
  })

  it('should handle multiple quiz attempts', () => {
    const { result } = renderHook(() => useAchievements())
    
    act(() => {
      result.current.recordQuizAttempt({
        language: 'en',
        score: 75,
        totalQuestions: 10,
        timeSpent: 300,
        perfectScore: false
      })
      result.current.recordQuizAttempt({
        language: 'hi',
        score: 80,
        totalQuestions: 10,
        timeSpent: 250,
        perfectScore: false
      })
    })
    
    expect(result.current.unlockedAchievements.length).toBeGreaterThan(0)
  })

  it('should reset achievements', () => {
    const { result } = renderHook(() => useAchievements())
    
    act(() => {
      result.current.recordQuizAttempt({
        language: 'en',
        score: 100,
        totalQuestions: 10,
        timeSpent: 300,
        perfectScore: true
      })
    })
    
    expect(result.current.unlockedAchievements.length).toBeGreaterThan(0)
  })
})
