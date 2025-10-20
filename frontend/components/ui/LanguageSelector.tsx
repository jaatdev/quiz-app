import { Lang } from '@/lib/quiz/normalize';

type Props = {
  availableLanguages: Lang[];
  currentLanguage: Lang;
  onLanguageChange: (lang: Lang) => void;
};

export default function LanguageSelector({ availableLanguages, currentLanguage, onLanguageChange }: Props) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Choose Your Language</h3>
      <div className="flex justify-center gap-4">
        {availableLanguages.includes('en') && (
          <button
            onClick={() => onLanguageChange('en')}
            className={`px-6 py-3 rounded-lg border-2 ${currentLanguage === 'en' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-300 dark:border-gray-600'}`}
          >
            <span className="text-2xl mr-2">🇬🇧</span> English
          </button>
        )}
        {availableLanguages.includes('hi') && (
          <button
            onClick={() => onLanguageChange('hi')}
            className={`px-6 py-3 rounded-lg border-2 ${currentLanguage === 'hi' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-300 dark:border-gray-600'}`}
          >
            <span className="text-2xl mr-2">🇮🇳</span> हिंदी
          </button>
        )}
      </div>
    </div>
  );
}
