import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AppProvider } from '@/components/layout/AppProvider';
import AppShell from '@/components/layout/AppShell';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Performance Eval System',
  description: 'ระบบประเมินผลการปฏิบัติงานเจ้าหน้าที่ สอ.มก.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn('font-body antialiased')}>
        <AppProvider>
          <AppShell />
        </AppProvider>
        <Toaster />
      </body>
    </html>
  );
}
