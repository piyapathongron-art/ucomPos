'use client';

import { useRouter } from 'next/navigation';
import { Icons } from '@/components/ui/Icons';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { APP_NAME } from '@/lib/constants';

export function TopBar() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isDarkMode = useUIStore((s) => s.isDarkMode);
  const toggleDarkMode = useUIStore((s) => s.toggleDarkMode);
  const setMobileMenuOpen = useUIStore((s) => s.setMobileMenuOpen);
  const isMobileMenuOpen = useUIStore((s) => s.isMobileMenuOpen);
  const showNotification = useUIStore((s) => s.showNotification);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors during logout
    }
    logout();
    showNotification('ออกจากระบบเรียบร้อย', 'success');
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-800 border-b dark:border-slate-700 flex items-center px-4 md:px-6 flex-shrink-0 z-50">
      <button
        type="button"
        onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
        aria-label="Toggle menu"
      >
        <Icons.Menu className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-2 ml-2 md:ml-0">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
          <Icons.Smartphone className="w-5 h-5" />
        </div>
        <span className="font-bold text-lg text-slate-800 dark:text-white hidden sm:inline">
          {APP_NAME}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={toggleDarkMode}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          aria-label="Toggle theme"
        >
          {isDarkMode ? <Icons.Sun className="w-5 h-5" /> : <Icons.Moon className="w-5 h-5" />}
        </button>

        {user && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700">
            <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="text-sm">
              <div className="font-medium text-slate-800 dark:text-white">{user.name}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {user.role === 'ADMIN' ? 'ผู้ดูแลระบบ' : 'พนักงาน'}
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleLogout}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400"
          aria-label="Logout"
          title="ออกจากระบบ"
        >
          <Icons.LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
