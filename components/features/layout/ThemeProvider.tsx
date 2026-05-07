'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/store/uiStore';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const isDarkMode = useUIStore((s) => s.isDarkMode);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return <>{children}</>;
}
