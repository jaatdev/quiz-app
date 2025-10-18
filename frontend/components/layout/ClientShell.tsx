'use client';

import { usePathname } from 'next/navigation';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';
import { useExamMode } from '@/src/context/ExamModeContext';

export function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { examMode } = useExamMode();
  const hideChrome =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/sign-up') ||
    pathname.startsWith('/welcome');
  // Also hide chrome during exam mode
  const shouldHide = hideChrome || examMode;

  return (
    <>
      {!shouldHide && <SiteHeader />}
      {children}
      {!shouldHide && <SiteFooter />}
    </>
  );
}
