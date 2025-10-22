// frontend/i18n/routing.ts

import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  // All supported locales
  locales: ['en', 'hi'],

  // Default locale when none is specified
  defaultLocale: 'en',

  // When to show locale prefix in URL
  // 'as-needed' means: /dashboard (English), /hi/dashboard (Hindi)
  localePrefix: 'as-needed',

  // Optional: Locale detection strategy
  localeDetection: true
});

// Type-safe navigation functions
export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);

export type Locale = (typeof routing.locales)[number];