'use client';

import { motion } from 'framer-motion';
import { ArrowRightLeft } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { LANGUAGES, type LanguageCode } from '@/lib/i18n/config';

interface LanguageToggleProps {
  availableLanguages?: LanguageCode[];
}

export function LanguageToggle({ availableLanguages }: LanguageToggleProps) {
  const { language, setLanguage } = useLanguage();

  const languages = availableLanguages || Object.keys(LANGUAGES) as LanguageCode[];

  if (languages.length === 1) return null;

  const handleToggle = () => {
    const currentIndex = languages.indexOf(language);
    const nextIndex = (currentIndex + 1) % languages.length;
    setLanguage(languages[nextIndex]);
  };

  const nextLanguage = languages[(languages.indexOf(language) + 1) % languages.length];

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleToggle}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all duration-300"
      title={`Switch to ${LANGUAGES[nextLanguage].nativeName}`}
    >
      <span className="text-lg font-semibold">
        {LANGUAGES[language].flag} {language.toUpperCase()}
      </span>

      <motion.div
        animate={{ rotate: [0, 180, 360] }}
        transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 3 }}
      >
        <ArrowRightLeft className="w-5 h-5" />
      </motion.div>

      <span className="text-lg font-semibold">
        {LANGUAGES[nextLanguage].flag} {nextLanguage.toUpperCase()}
      </span>

      {/* Tooltip */}
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        Switch Language
      </div>
    </motion.button>
  );
}
