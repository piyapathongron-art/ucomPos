import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/features/layout/ThemeProvider';
import { NotificationStack } from '@/components/ui/Notification';
import { APP_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: `${APP_NAME} - Mobile POS System`,
  description: 'Comprehensive Point-of-Sale system for mobile shops',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0f172a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-screen overflow-hidden">
        <ThemeProvider>
          {children}
          <NotificationStack />
        </ThemeProvider>
      </body>
    </html>
  );
}
