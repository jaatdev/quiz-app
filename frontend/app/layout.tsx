import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { ToastProvider } from "@/providers/toast-provider";
import { ClerkProvider } from "@clerk/nextjs";
import { ClientShell } from '@/components/layout/ClientShell';
import { LanguageProvider } from "@/lib/i18n/LanguageContext";

export const metadata: Metadata = {
  title: "Quiz App - Test Your Knowledge",
  description: "A modern quiz application to test and improve your knowledge",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Noto+Sans+Devanagari:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        </head>
        <body className="font-sans">
          <LanguageProvider>
            <ToastProvider>
              <QueryProvider>
                <ClientShell>
                  <div className="min-h-screen bg-gray-50">
                    {children}
                  </div>
                </ClientShell>
              </QueryProvider>
            </ToastProvider>
          </LanguageProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
