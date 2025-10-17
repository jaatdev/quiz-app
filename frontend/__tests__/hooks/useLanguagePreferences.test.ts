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
    
    expect(result.current.language).toBeDefined()
  })

  it('should retrieve language from localStorage', () => {
    // Set a language in localStorage
    localStorage.setItem('language', 'hi')
    
    const { result } = renderHook(() => useLanguagePreferences())
    
    expect(result.current.language).toBe('hi')
  })

  it('should update language and persist to localStorage', () => {
    const { result } = renderHook(() => useLanguagePreferences())
    
    act(() => {
      result.current.setLanguage('es')
    })
    
    expect(result.current.language).toBe('es')
    expect(localStorage.getItem('language')).toBe('es')
  })

  it('should only accept valid language codes', () => {
    const { result } = renderHook(() => useLanguagePreferences())
    const originalLanguage = result.current.language
    
    act(() => {
      // This should either throw or not change the language
      try {
        result.current.setLanguage('invalid' as any)
      } catch (e) {
        // Expected to throw
      }
    })
    
    // Language should remain unchanged
    expect(['en', 'hi', 'es', 'fr']).toContain(result.current.language)
  })

  it('should handle switching between multiple languages', () => {
    const { result } = renderHook(() => useLanguagePreferences())
    
    const languages = ['en', 'hi', 'es', 'fr']
    
    languages.forEach((lang: any) => {
      act(() => {
        result.current.setLanguage(lang)
      })
      expect(result.current.language).toBe(lang)
    })
  })

  it('should persist language preference across hook instances', () => {
    const { result: result1 } = renderHook(() => useLanguagePreferences())
    
    act(() => {
      result1.current.setLanguage('fr')
    })
    
    // Create a new hook instance
    const { result: result2 } = renderHook(() => useLanguagePreferences())
    
    expect(result2.current.language).toBe('fr')
  })
})
