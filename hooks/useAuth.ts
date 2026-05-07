'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

export function useAuth() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const logoutStore = useAuthStore((s) => s.logout);
  const showNotification = useUIStore((s) => s.showNotification);

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors during logout
    }
    logoutStore();
    showNotification('ออกจากระบบเรียบร้อย', 'success');
    router.push('/login');
    router.refresh();
  };

  return { user, isAuthenticated, hasPermission, logout };
}
