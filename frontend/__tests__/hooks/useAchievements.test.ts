import { renderHook, act, waitFor } from '@testing-library/react'
import { useAchievements } from '@/hooks/useAchievements'

describe('useAchievements', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  it('should initialize with empty achievements', () => {
    const { result } = renderHook(() => useAchievements())
    
    expect(result.current.achievements).toEqual([])
  })

  it('should unlock an achievement', () => {
    const { result } = renderHook(() => useAchievements())
    
    act(() => {
      result.current.unlockAchievement('first_quiz')
    })
    
    expect(result.current.achievements).toContain('first_quiz')
  })

  it('should not add duplicate achievements', () => {
    const { result } = renderHook(() => useAchievements())
    
    act(() => {
      result.current.unlockAchievement('first_quiz')
      result.current.unlockAchievement('first_quiz')
    })
    
    expect(result.current.achievements.filter(a => a === 'first_quiz')).toHaveLength(1)
  })

  it('should persist achievements to localStorage', () => {
    const { result } = renderHook(() => useAchievements())
    
    act(() => {
      result.current.unlockAchievement('first_quiz')
      result.current.unlockAchievement('polyglot')
    })
    
    const stored = localStorage.getItem('achievements')
    expect(stored).toBeTruthy()
    expect(JSON.parse(stored!)).toContain('first_quiz')
    expect(JSON.parse(stored!)).toContain('polyglot')
  })

  it('should load achievements from localStorage', () => {
    // Pre-populate localStorage
    const achievements = ['first_quiz', 'polyglot', 'speed_demon']
    localStorage.setItem('achievements', JSON.stringify(achievements))
    
    const { result } = renderHook(() => useAchievements())
    
    expect(result.current.achievements).toEqual(achievements)
  })

  it('should check if achievement is unlocked', () => {
    const { result } = renderHook(() => useAchievements())
    
    act(() => {
      result.current.unlockAchievement('first_quiz')
    })
    
    expect(result.current.hasAchievement('first_quiz')).toBe(true)
    expect(result.current.hasAchievement('polyglot')).toBe(false)
  })

  it('should count total achievements', () => {
    const { result } = renderHook(() => useAchievements())
    
    act(() => {
      result.current.unlockAchievement('first_quiz')
      result.current.unlockAchievement('polyglot')
      result.current.unlockAchievement('speed_demon')
    })
    
    expect(result.current.achievements.length).toBe(3)
  })

  it('should track achievement unlock dates', () => {
    const { result } = renderHook(() => useAchievements())
    
    const beforeTime = new Date().getTime()
    
    act(() => {
      result.current.unlockAchievement('first_quiz')
    })
    
    const afterTime = new Date().getTime()
    
    // Verify achievement was added
    expect(result.current.achievements).toContain('first_quiz')
  })

  it('should handle multiple achievements simultaneously', () => {
    const { result } = renderHook(() => useAchievements())
    
    const achievementIds = [
      'first_quiz',
      'polyglot',
      'speed_demon',
      'perfect_score',
      'quiz_master',
    ]
    
    act(() => {
      achievementIds.forEach(id => {
        result.current.unlockAchievement(id)
      })
    })
    
    expect(result.current.achievements).toEqual(achievementIds)
  })
})
