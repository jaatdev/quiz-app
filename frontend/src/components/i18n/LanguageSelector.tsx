'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Check, Globe } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { LANGUAGES, type LanguageCode } from '@/lib/i18n/config';

interface LanguageSelectorProps {
  availableLanguages?: LanguageCode[];
  showLabel?: boolean;
  compact?: boolean;
}

export function LanguageSelector({
  availableLanguages,
  showLabel = true,
  compact = false
}: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  // Use all languages if not specified
  const languages = availableLanguages || Object.keys(LANGUAGES) as LanguageCode[];

  // If only one language available, don't show selector
  if (languages.length === 1) {
    return null;
  }

  const handleLanguageSelect = (langCode: LanguageCode) => {
    setLanguage(langCode);
    setIsOpen(false);
  };

  if (compact) {
    return (
      <div className="relative inline-block">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-all duration-200 shadow-sm"
        >
          <span className="text-lg">{LANGUAGES[language].flag}</span>
          <span className="text-sm font-medium hidden sm:inline">
            {LANGUAGES[language].nativeName}
          </span>
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full mt-2 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 min-w-[200px]"
            >
              {languages.map((langCode) => (
                <motion.button
                  key={langCode}
                  whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                  onClick={() => handleLanguageSelect(langCode)}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                    language === langCode
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="text-2xl">{LANGUAGES[langCode].flag}</span>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {LANGUAGES[langCode].nativeName}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {LANGUAGES[langCode].name}
                    </div>
                  </div>
                  {language === langCode && (
                    <Check className="w-5 h-5 text-blue-600" />
                  )}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Choose Your Language / अपनी भाषा चुनें
          </h3>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {languages.map((langCode) => (
          <motion.button
            key={langCode}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleLanguageSelect(langCode)}
            className={`relative p-6 rounded-2xl border-2 transition-all duration-300 ${
              language === langCode
                ? 'border-blue-600 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 shadow-lg'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-400'
            }`}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="text-5xl">{LANGUAGES[langCode].flag}</div>
              <div className={`text-2xl font-bold text-gray-900 dark:text-white text-center ${LANGUAGES[langCode].fontClass}`}>
                {LANGUAGES[langCode].nativeName}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {LANGUAGES[langCode].name}
              </div>
              {language === langCode && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-4 right-4"
                >
                  <Check className="w-8 h-8 text-blue-600" />
                </motion.div>
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
