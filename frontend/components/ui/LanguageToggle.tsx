import { motion } from 'framer-motion';
import { Lang } from '@/lib/quiz/normalize';

type Props = {
  currentLanguage: Lang;
  onToggle: () => void;
};

export default function LanguageToggle({ currentLanguage, onToggle }: Props) {
  const otherLang = currentLanguage === 'en' ? 'hi' : 'en';
  return (
    <motion.button
      onClick={onToggle}
      whileHover={{ scale: 1.1 }}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-full shadow-lg border dark:border-gray-600"
      title={`Switch to ${otherLang === 'en' ? 'English' : 'Hindi'}`}
    >
      <span className="text-xl">{currentLanguage === 'en' ? '🇬🇧' : '🇮🇳'}</span>
      <span className="text-xl">⇄</span>
      <span className="text-xl">{otherLang === 'en' ? '🇬🇧' : '🇮🇳'}</span>
    </motion.button>
  );
}
