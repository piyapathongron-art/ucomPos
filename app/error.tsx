'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icons } from '@/components/ui/Icons';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100 dark:bg-slate-900">
      <Card className="max-w-md w-full p-8 text-center">
        <Icons.AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
          เกิดข้อผิดพลาด
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          {error.message || 'ไม่สามารถดำเนินการได้ในขณะนี้'}
        </p>
        <Button onClick={reset} fullWidth>
          ลองอีกครั้ง
        </Button>
      </Card>
    </div>
  );
}
