'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/store/uiStore';

interface Category {
  id: string;
  name: string;
}

interface Props {
  categories: Category[];
  onClose: () => void;
  onImported: (count: number) => void;
}

const SAMPLE = JSON.stringify(
  [
    {
      productId: 'P-1001',
      name: 'ตัวอย่างสินค้า A',
      qty: 5,
      cost: 100,
      price: 150,
      isFavorite: false,
    },
    {
      productId: 'P-1002',
      name: 'ตัวอย่างสินค้า B',
      qty: 10,
      cost: 50,
      price: 80,
    },
  ],
  null,
  2
);

export function BulkImport({ onClose, onImported }: Props) {
  const showNotification = useUIStore((s) => s.showNotification);
  const [text, setText] = useState(SAMPLE);
  const [submitting, setSubmitting] = useState(false);

  const handleImport = async () => {
    setSubmitting(true);
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error('ต้องเป็น array ของสินค้า');

      const res = await fetch('/api/inventory/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: parsed }),
      });
      const data = await res.json();
      if (!res.ok) {
        showNotification(data.error || 'นำเข้าไม่สำเร็จ', 'error');
        return;
      }
      onImported(data.count);
    } catch (err: any) {
      showNotification(err.message || 'รูปแบบ JSON ไม่ถูกต้อง', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFile = async (file: File) => {
    const content = await file.text();
    setText(content);
  };

  return (
    <Modal title="นำเข้าสินค้า (JSON)" onClose={onClose} maxWidth="max-w-2xl">
      <div className="space-y-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          วาง JSON array ที่มีฟิลด์: <code>productId, name, qty, cost, price</code>
        </p>

        <input
          type="file"
          accept="application/json,.json"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
          className="text-sm"
        />

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={14}
          className="w-full p-3 border rounded-lg dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white font-mono text-xs"
          spellCheck={false}
        />

        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
            className="flex-1"
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleImport}
            disabled={submitting}
            className="flex-1"
          >
            {submitting ? 'กำลังนำเข้า...' : 'นำเข้า'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
