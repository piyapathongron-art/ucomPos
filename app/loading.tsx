import { Icons } from '@/components/ui/Icons';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
      <div className="flex flex-col items-center gap-3">
        <Icons.Loader className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        <p className="text-sm text-slate-500 dark:text-slate-400">กำลังโหลด...</p>
      </div>
    </div>
  );
}
