'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';

const languages = [
  { code: 'en', name: 'EN', flag: '🇺🇸', fullName: 'English' },
  { code: 'hi', name: 'हिं', flag: '🇮🇳', fullName: 'हिंदी' },
];

export function LanguageSwitcher() {
  const t = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const switchLanguage = (newLocale: string) => {
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
    });
  };

  const currentLanguage = languages.find(lang => lang.code === locale);
  const otherLanguage = languages.find(lang => lang.code !== locale);

  return (
    <div className="flex items-center gap-2">
      <Languages className="h-4 w-4 text-gray-500" />
      <div className="flex rounded-md border border-gray-300 overflow-hidden">
        {languages.map((language) => (
          <button
            key={language.code}
            onClick={() => switchLanguage(language.code)}
            disabled={isPending}
            className={`px-3 py-1 text-sm font-medium transition-colors ${
              locale === language.code
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            title={language.fullName}
          >
            {language.name}
          </button>
        ))}
      </div>
    </div>
  );
}