'use client';

import { type ReactNode, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card } from './Card';
import { Icons } from './Icons';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
  open?: boolean;
}

export function Modal({ title, onClose, children, maxWidth = 'max-w-md', open = true }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
      <Card
        className={cn(
          'w-full overflow-hidden flex flex-col max-h-[90vh] shadow-2xl dark:shadow-slate-900/50',
          maxWidth
        )}
      >
        <div className="p-4 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-850 font-bold text-lg flex justify-between items-center text-slate-800 dark:text-white">
          <span>{title}</span>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400"
            aria-label="ปิด"
          >
            <Icons.X />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </Card>
    </div>
  );
}

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  title,
  message,
  confirmLabel = 'ยืนยัน',
  cancelLabel = 'ยกเลิก',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
      <Card className="w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center">
        <Icons.AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{title}</h3>
        <p className="text-slate-500 dark:text-slate-400 mb-6">{message}</p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </Card>
    </div>
  );
}
