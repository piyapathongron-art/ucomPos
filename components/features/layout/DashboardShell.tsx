'use client';

import { useEffect, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import type { CurrentUser } from '@/types/domain';

interface Props {
  user: CurrentUser;
  children: ReactNode;
}

export function DashboardShell({ user, children }: Props) {
  const setUser = useAuthStore((s) => s.setUser);
  const isMobileMenuOpen = useUIStore((s) => s.isMobileMenuOpen);
  const setMobileMenuOpen = useUIStore((s) => s.setMobileMenuOpen);

  useEffect(() => {
    setUser(user);
  }, [user, setUser]);

  return (
    <div className="h-screen flex flex-col">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
        <main className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-900 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
