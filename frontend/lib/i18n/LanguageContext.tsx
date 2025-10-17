'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { LanguageCode } from './config';
import { DEFAULT_LANGUAGE, STORAGE_KEYS, detectBrowserLanguage } from './config';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  isLoaded: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(DEFAULT_LANGUAGE);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize language from storage or browser detection
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PREFERRED_LANGUAGE);
    
    if (saved) {
      setLanguageState(saved as LanguageCode);
    } else {
      const detected = detectBrowserLanguage();
      setLanguageState(detected);
    }
    
    setIsLoaded(true);
  }, []);

  // Update localStorage and HTML lang attribute when language changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEYS.PREFERRED_LANGUAGE, language);
      document.documentElement.lang = language;
      document.documentElement.dir = language === 'hi' ? 'ltr' : 'ltr';
    }
  }, [language, isLoaded]);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isLoaded }}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Hook to use language context
 */
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
