import Link from 'next/link';
import { Card } from '@/components/ui/Card';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100 dark:bg-slate-900">
      <Card className="max-w-md w-full p-8 text-center">
        <h1 className="text-6xl font-bold text-slate-300 dark:text-slate-600 mb-2">404</h1>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
          ไม่พบหน้านี้
        </h2>
        <Link
          href="/"
          className="inline-block px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          กลับหน้าหลัก
        </Link>
      </Card>
    </div>
  );
}
