// backend/src/services/i18n.service.ts

/**
 * Supported languages in the application
 */
export type SupportedLanguage = 'en' | 'hi';

/**
 * Interface for multilingual content
 */
export interface MultilingualContent {
  en: string;
  hi: string;
}

/**
 * Interface for multilingual option
 */
export interface MultilingualOption {
  id: string;
  text: string;
}

/**
 * Service to handle internationalization logic
 */
export class I18nService {
  /**
   * List of supported languages
   */
  static readonly SUPPORTED_LANGUAGES: SupportedLanguage[] = ['en', 'hi'];

  /**
   * Default fallback language
   */
  static readonly DEFAULT_LANGUAGE: SupportedLanguage = 'en';

  /**
   * Extract content in user's preferred language
   * Falls back to English if translation not available
   * Falls back to first available content if English not available
   *
   * @param content - Multilingual content object
   * @param language - Preferred language
   * @returns Content in requested language or fallback
   */
  static extractContent(
    content: any,
    language: SupportedLanguage = 'en'
  ): any {
    // Handle null/undefined
    if (!content) return null;

    // If it's a primitive value, return as-is
    if (typeof content !== 'object') return content;

    // If it's a multilingual object with language keys
    if (this.isMultilingualContent(content)) {
      const value = content[language] || content[this.DEFAULT_LANGUAGE] || '';

      // If the value is empty string and we're not using default language, try default
      if (value === '' && language !== this.DEFAULT_LANGUAGE) {
        return content[this.DEFAULT_LANGUAGE] || '';
      }

      return value;
    }

    // If it's an array, recursively extract each item
    if (Array.isArray(content)) {
      return content.map(item => this.extractContent(item, language));
    }

    // If it's an object, recursively extract each field
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(content)) {
      result[key] = this.extractContent(value, language);
    }

    return result;
  }

  /**
   * Check if an object is multilingual content
   */
  private static isMultilingualContent(obj: any): obj is MultilingualContent {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      ('en' in obj || 'hi' in obj)
    );
  }

  /**
   * Detect language from Accept-Language header
   *
   * @param acceptLanguage - Accept-Language header value
   * @returns Detected language or default
   */
  static detectLanguage(acceptLanguage?: string): SupportedLanguage {
    if (!acceptLanguage) return this.DEFAULT_LANGUAGE;

    // Parse Accept-Language header
    // Format: "en-US,en;q=0.9,hi;q=0.8"
    const languages = acceptLanguage
      .split(',')
      .map(lang => {
        const [code, qValue] = lang.split(';');
        const quality = qValue ? parseFloat(qValue.split('=')[1]) : 1.0;
        return {
          code: code.trim().toLowerCase().split('-')[0], // Extract base language
          quality
        };
      })
      .sort((a, b) => b.quality - a.quality); // Sort by quality

    // Find first supported language
    for (const { code } of languages) {
      if (this.SUPPORTED_LANGUAGES.includes(code as SupportedLanguage)) {
        return code as SupportedLanguage;
      }
    }

    return this.DEFAULT_LANGUAGE;
  }

  /**
   * Validate if a language code is supported
   */
  static isSupported(language: string): language is SupportedLanguage {
    return this.SUPPORTED_LANGUAGES.includes(language as SupportedLanguage);
  }

  /**
   * Get language name in native script
   */
  static getLanguageName(language: SupportedLanguage): string {
    const names: Record<SupportedLanguage, string> = {
      en: 'English',
      hi: 'हिन्दी'
    };
    return names[language];
  }
}