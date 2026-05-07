'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from '@/components/ui/Icons';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import type { Permission } from '@/lib/constants';

interface NavItem {
  href: string;
  label: string;
  permission: Permission;
  icon: keyof typeof Icons;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/pos', label: 'ขายหน้าร้าน', permission: 'pos', icon: 'ShoppingCart' },
  { href: '/services', label: 'บริการ', permission: 'services', icon: 'Wrench' },
  { href: '/installments', label: 'ฝากผ่อน', permission: 'installments', icon: 'CreditCard' },
  { href: '/stock', label: 'จัดการสต็อก', permission: 'stock', icon: 'Package' },
  { href: '/reports', label: 'รายงาน', permission: 'report', icon: 'BarChart3' },
  { href: '/users', label: 'จัดการผู้ใช้', permission: 'users', icon: 'Users' },
  { href: '/audit', label: 'ประวัติการใช้งาน', permission: 'audit', icon: 'History' },
  { href: '/settings', label: 'ตั้งค่าระบบ', permission: 'settings', icon: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const isMobileMenuOpen = useUIStore((s) => s.isMobileMenuOpen);
  const setMobileMenuOpen = useUIStore((s) => s.setMobileMenuOpen);

  const visible = NAV_ITEMS.filter((item) => hasPermission(item.permission));

  return (
    <aside
      className={cn(
        'bg-white dark:bg-slate-800 border-r dark:border-slate-700',
        'w-64 flex flex-col flex-shrink-0',
        'transition-transform duration-300',
        'fixed inset-y-0 left-0 z-40 md:relative md:translate-x-0',
        'top-16 md:top-0',
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {visible.map((item) => {
          const Icon = Icons[item.icon];
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors',
                active
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
