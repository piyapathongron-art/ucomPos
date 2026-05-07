'use client';

import { Card } from '@/components/ui/Card';
import { CategoryManager } from './CategoryManager';
import { BackupRestore } from './BackupRestore';
import { DailyClose } from './DailyClose';
import { APP_NAME, APP_VERSION, LAST_UPDATE } from '@/lib/constants';

export function SettingsView() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white">ตั้งค่าระบบ</h1>

      {/* Daily Close */}
      <Card className="p-6">
        <DailyClose />
      </Card>

      {/* Categories */}
      <Card className="p-6">
        <CategoryManager />
      </Card>

      {/* Backup / Restore */}
      <Card className="p-6">
        <BackupRestore />
      </Card>

      {/* System info */}
      <Card className="p-6">
        <h3 className="font-semibold text-slate-800 dark:text-white mb-3">เกี่ยวกับระบบ</h3>
        <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
          <div>
            ระบบ: <span className="font-medium text-slate-800 dark:text-white">{APP_NAME}</span>
          </div>
          <div>
            เวอร์ชัน: <span className="font-mono">{APP_VERSION}</span>
          </div>
          <div>อัปเดตล่าสุด: {LAST_UPDATE}</div>
        </div>
      </Card>
    </div>
  );
}
