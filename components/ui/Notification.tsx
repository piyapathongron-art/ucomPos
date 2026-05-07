'use client';

import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';
import { Icons } from './Icons';

const typeStyles = {
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
  warning: 'bg-orange-500 text-white',
  info: 'bg-blue-600 text-white',
};

export function NotificationStack() {
  const notifications = useUIStore((s) => s.notifications);
  const removeNotification = useUIStore((s) => s.removeNotification);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[70] flex flex-col gap-2 max-w-sm">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={cn(
            'px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in',
            typeStyles[n.type]
          )}
        >
          {n.type === 'success' ? <Icons.Check /> : <Icons.AlertCircle />}
          <span className="font-medium flex-1">{n.message}</span>
          <button
            onClick={() => removeNotification(n.id)}
            className="ml-2 hover:bg-white/20 rounded-full p-1"
            aria-label="ปิด"
          >
            <Icons.X />
          </button>
        </div>
      ))}
    </div>
  );
}
