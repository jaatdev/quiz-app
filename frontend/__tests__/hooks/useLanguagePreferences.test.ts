import { renderHook, act } from '@testing-library/react'
import { useLanguagePreferences } from '@/hooks/useLanguagePreferences'

describe('useLanguagePreferences', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    jest.clearAllMocks()
  })

  it('should initialize with default language', () => {
    const { result } = renderHook(() => useLanguagePreferences())
    
    expect(result.current.preferences?.preferredLanguage).toBeDefined()
  })

  it('should retrieve language from localStorage', () => {
    // Set a language in localStorage
    const preferences = {
      preferredLanguage: 'hi',
      quizAttempts: {},
      totalAttempts: 0,
      lastUpdated: Date.now()
    }
    localStorage.setItem('language-preferences', JSON.stringify(preferences))
    
    const { result } = renderHook(() => useLanguagePreferences())
    
    expect(result.current.preferences?.preferredLanguage).toBe('hi')
  })

  it('should update language and persist to localStorage', () => {
    const { result } = renderHook(() => useLanguagePreferences())
    
    act(() => {
      result.current.updatePreferredLanguage('es')
    })
    
    expect(result.current.preferences?.preferredLanguage).toBe('es')
    const stored = localStorage.getItem('language-preferences')
    expect(stored).toBeTruthy()
    expect(JSON.parse(stored!).preferredLanguage).toBe('es')
  })

  it('should only accept valid language codes', () => {
    const { result } = renderHook(() => useLanguagePreferences())
    const originalLanguage = result.current.preferences?.preferredLanguage
    
    act(() => {
      // This should either throw or not change the language
      try {
        result.current.updatePreferredLanguage('invalid' as any)
      } catch (e) {
        // Expected to throw
      }
    })
    
    // Language should remain unchanged
    expect(['en', 'hi', 'es', 'fr']).toContain(result.current.preferences?.preferredLanguage)
  })

  it('should handle switching between multiple languages', () => {
    const { result } = renderHook(() => useLanguagePreferences())
    
    const languages = ['en', 'hi', 'es', 'fr']
    
    languages.forEach((lang: any) => {
      act(() => {
        result.current.updatePreferredLanguage(lang)
      })
      expect(result.current.preferences?.preferredLanguage).toBe(lang)
    })
  })

  it('should persist language preference across hook instances', () => {
    const { result: result1 } = renderHook(() => useLanguagePreferences())
    
    act(() => {
      result1.current.updatePreferredLanguage('fr')
    })
    
    // Create a new hook instance
    const { result: result2 } = renderHook(() => useLanguagePreferences())
    
    expect(result2.current.preferences?.preferredLanguage).toBe('fr')
  })

  it('should record quiz attempt', () => {
    const { result } = renderHook(() => useLanguagePreferences())
    
    act(() => {
      result.current.recordAttempt('en', 85, 10)
    })
    
    expect(result.current.preferences).toBeTruthy()
  })

  it('should get statistics for language', () => {
    const { result } = renderHook(() => useLanguagePreferences())
    
    act(() => {
      result.current.recordAttempt('en', 80, 10)
      result.current.recordAttempt('en', 90, 10)
    })
    
    const stats = result.current.getStatistics()
    expect(stats).toBeTruthy()
  })

  it('should sync with backend', () => {
    const { result } = renderHook(() => useLanguagePreferences())
    
    act(() => {
      result.current.syncWithBackend('user-123')
    })
    
    expect(result.current.preferences).toBeTruthy()
  })

  it('should handle loading state', () => {
    const { result } = renderHook(() => useLanguagePreferences())
    
    expect(result.current.isLoading).toBeDefined()
  })
})
