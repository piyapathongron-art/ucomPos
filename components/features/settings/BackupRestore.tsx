'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import { useUIStore } from '@/store/uiStore';

export function BackupRestore() {
  const showNotification = useUIStore((s) => s.showNotification);
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    categories: number;
    products: number;
  } | null>(null);

  const handleExport = () => {
    window.open('/api/backup/export', '_blank');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      const res = await fetch('/api/backup/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
      });
      const data = await res.json();

      if (res.ok) {
        setImportResult(data.stats);
        showNotification('นำเข้าข้อมูลเรียบร้อย', 'success');
      } else {
        showNotification(data.error || 'นำเข้าไม่สำเร็จ', 'error');
      }
    } catch {
      showNotification('ไฟล์ไม่ถูกต้อง หรือเกิดข้อผิดพลาด', 'error');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-slate-800 dark:text-white">สำรองและกู้คืนข้อมูล</h3>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Export */}
        <div className="rounded-lg border dark:border-slate-700 p-4 space-y-3">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
            <Icons.Download className="w-5 h-5 text-blue-500" />
            <span className="font-medium">ส่งออกข้อมูล</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            ดาวน์โหลดข้อมูลสินค้าและหมวดหมู่เป็นไฟล์ JSON
          </p>
          <Button fullWidth onClick={handleExport}>
            <Icons.Download className="w-4 h-4" />
            <span>ดาวน์โหลด Backup</span>
          </Button>
        </div>

        {/* Import */}
        <div className="rounded-lg border dark:border-slate-700 p-4 space-y-3">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
            <Icons.Upload className="w-5 h-5 text-emerald-500" />
            <span className="font-medium">นำเข้าข้อมูล</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            อัปโหลดไฟล์ JSON จาก backup เพื่อกู้คืนข้อมูล (สินค้าที่มีอยู่จะถูกอัปเดต)
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
          <Button
            fullWidth
            variant="outline"
            onClick={() => fileRef.current?.click()}
            disabled={importing}
          >
            {importing ? (
              <>
                <Icons.Loader className="w-4 h-4" />
                <span>กำลังนำเข้า…</span>
              </>
            ) : (
              <>
                <Icons.Upload className="w-4 h-4" />
                <span>เลือกไฟล์ Backup</span>
              </>
            )}
          </Button>

          {importResult && (
            <div className="text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded p-2 space-y-0.5">
              <p className="font-medium">นำเข้าสำเร็จ</p>
              <p>หมวดหมู่: {importResult.categories} รายการ</p>
              <p>สินค้า: {importResult.products} รายการ</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
