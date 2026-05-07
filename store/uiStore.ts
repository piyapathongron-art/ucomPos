import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Notification, NotificationType } from '@/types/ui';

interface UIState {
  isDarkMode: boolean;
  isMobileMenuOpen: boolean;
  notifications: Notification[];
  toggleDarkMode: () => void;
  setDarkMode: (dark: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  showNotification: (message: string, type?: NotificationType) => void;
  removeNotification: (id: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      isDarkMode: true,
      isMobileMenuOpen: false,
      notifications: [],
      toggleDarkMode: () => set((s) => ({ isDarkMode: !s.isDarkMode })),
      setDarkMode: (dark) => set({ isDarkMode: dark }),
      setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
      showNotification: (message, type = 'success') => {
        const id = Math.random().toString(36).slice(2);
        set((s) => ({
          notifications: [...s.notifications, { id, message, type }],
        }));
        setTimeout(() => {
          set((s) => ({
            notifications: s.notifications.filter((n) => n.id !== id),
          }));
        }, 3000);
      },
      removeNotification: (id) =>
        set((s) => ({
          notifications: s.notifications.filter((n) => n.id !== id),
        })),
    }),
    {
      name: 'ucompos-ui',
      partialize: (state) => ({ isDarkMode: state.isDarkMode }),
    }
  )
);
