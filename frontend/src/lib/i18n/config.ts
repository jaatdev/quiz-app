/**
 * Internationalization (i18n) Configuration
 * Supports multiple languages with fallback mechanism
 */

export const LANGUAGES = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    direction: 'ltr' as const,
    fontClass: 'font-inter',
    fontFamily: "'Inter', sans-serif"
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिंदी',
    flag: '🇮🇳',
    direction: 'ltr' as const,
    fontClass: 'font-noto-sans-devanagari',
    fontFamily: "'Noto Sans Devanagari', sans-serif"
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    direction: 'ltr' as const,
    fontClass: 'font-inter',
    fontFamily: "'Inter', sans-serif"
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    direction: 'ltr' as const,
    fontClass: 'font-inter',
    fontFamily: "'Inter', sans-serif"
  }
} as const;

export type LanguageCode = keyof typeof LANGUAGES;

export const DEFAULT_LANGUAGE: LanguageCode = 'en';
export const SUPPORTED_LANGUAGES = Object.keys(LANGUAGES) as LanguageCode[];

/**
 * Get language config by code
 */
export function getLanguageConfig(code: string | null | undefined) {
  const normalizedCode = (code as LanguageCode) || DEFAULT_LANGUAGE;
  return LANGUAGES[normalizedCode] || LANGUAGES[DEFAULT_LANGUAGE];
}

/**
 * Check if language is supported
 */
export function isSupportedLanguage(code: string | null | undefined): code is LanguageCode {
  return code ? code in LANGUAGES : false;
}

/**
 * Get user's preferred language from browser
 */
export function detectBrowserLanguage(): LanguageCode {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  
  const browserLang = navigator.language.split('-')[0];
  return isSupportedLanguage(browserLang) ? browserLang : DEFAULT_LANGUAGE;
}

/**
 * Language localStorage keys
 */
export const STORAGE_KEYS = {
  PREFERRED_LANGUAGE: 'quiz-app:preferred-language',
  LANGUAGE_STATS: 'quiz-app:language-stats'
} as const;
