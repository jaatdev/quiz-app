'use client';

import { usePathname } from 'next/navigation';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';

export function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideChrome =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/sign-up') ||
    pathname.startsWith('/welcome');

  return (
    <>
      {!hideChrome && <SiteHeader />}
      {children}
      {!hideChrome && <SiteFooter />}
    </>
  );
}
