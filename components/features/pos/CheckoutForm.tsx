'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { formatBaht } from '@/lib/utils';
import { ReceiptPrint } from './ReceiptPrint';
import type { ReceiptData } from './ReceiptPrint';
import type { PaymentMethod } from '@/types/domain';

interface Props {
  onClose: () => void;
  onCompleted: () => void;
}

type Stage = 'form' | 'receipt';

export function CheckoutForm({ onClose, onCompleted }: Props) {
  const items = useCartStore((s) => s.items);
  const billDiscount = useCartStore((s) => s.billDiscount);
  const total = useCartStore((s) => s.total);
  const paymentMethod = useCartStore((s) => s.paymentMethod);
  const setPaymentMethod = useCartStore((s) => s.setPaymentMethod);
  const notes = useCartStore((s) => s.notes);
  const setNotes = useCartStore((s) => s.setNotes);
  const clear = useCartStore((s) => s.clear);
  const cashierName = useAuthStore((s) => s.user?.name ?? 'พนักงาน');
  const showNotification = useUIStore((s) => s.showNotification);

  const [stage, setStage] = useState<Stage>('form');
  const [submitting, setSubmitting] = useState(false);
  const [received, setReceived] = useState('');
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  const receivedNum = parseFloat(received || '0');
  const change = Math.max(0, receivedNum - total());

  const handleSubmit = async () => {
    setSubmitting(true);
    const payload = {
      items: items.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        productCode: i.productCode,
        qty: i.qty,
        cost: i.cost,
        price: i.price,
        itemDiscount: i.itemDiscount,
      })),
      billDiscount,
      paymentMethod,
      notes: notes || undefined,
    };

    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setSubmitting(false);

    if (res.ok) {
      const data = await res.json();
      const sale = data.sale;

      const receiptData: ReceiptData = {
        id: sale.id,
        date: sale.date,
        cashierName,
        items: sale.items.map((i: {
          productName: string;
          qty: number;
          price: number | string;
          itemDiscount: number | string;
          subtotal: number | string;
        }) => ({
          productName: i.productName,
          qty: i.qty,
          price: Number(i.price),
          itemDiscount: Number(i.itemDiscount),
          subtotal: Number(i.subtotal),
        })),
        subtotal: Number(sale.subtotal),
        itemDiscount: Number(sale.itemDiscount),
        billDiscount: Number(sale.billDiscount),
        total: Number(sale.total),
        paymentMethod: sale.paymentMethod,
        notes: sale.notes,
        receivedCash: paymentMethod === 'CASH' && received ? receivedNum : undefined,
      };

      clear();
      setReceipt(receiptData);
      setStage('receipt');
      onCompleted(); // triggers loadProducts in POSView
    } else {
      const data = await res.json();
      showNotification(data.error || 'บันทึกไม่สำเร็จ', 'error');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const methods: { value: PaymentMethod; label: string; icon: keyof typeof Icons }[] = [
    { value: 'CASH', label: 'เงินสด', icon: 'CreditCard' },
    { value: 'TRANSFER', label: 'โอน', icon: 'ArrowRightLeft' },
  ];

  if (stage === 'receipt' && receipt) {
    return (
      <>
        {/* Off-screen printable area — shown only when printing */}
        <div
          id="printable-area"
          aria-hidden="true"
          style={{ position: 'fixed', left: '-9999px', top: 0, width: '300px' }}
        >
          <ReceiptPrint data={receipt} />
        </div>

        {/* On-screen receipt preview */}
        <Modal title="บันทึกการขายสำเร็จ" onClose={onClose} maxWidth="max-w-sm">
          <div className="space-y-4">
            <div className="rounded-lg border dark:border-slate-700 overflow-hidden">
              <div className="bg-slate-50 dark:bg-slate-800 p-3">
                <ReceiptPrint data={receipt} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" fullWidth onClick={onClose}>
                <Icons.X className="w-4 h-4" />
                <span>ปิด</span>
              </Button>
              <Button fullWidth onClick={handlePrint}>
                <Icons.Download className="w-4 h-4" />
                <span>พิมพ์ใบเสร็จ</span>
              </Button>
            </div>
          </div>
        </Modal>
      </>
    );
  }

  return (
    <Modal title="ชำระเงิน" onClose={onClose} maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="bg-slate-50 dark:bg-slate-750 rounded-lg p-4 text-center">
          <div className="text-sm text-slate-500 dark:text-slate-400">ยอดที่ต้องชำระ</div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {formatBaht(total())}
          </div>
          <div className="text-xs text-slate-400 mt-1">{items.length} รายการ</div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            วิธีการชำระ
          </label>
          <div className="grid grid-cols-2 gap-2">
            {methods.map((m) => {
              const Icon = Icons[m.icon];
              const active = paymentMethod === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setPaymentMethod(m.value)}
                  className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors ${
                    active
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="font-medium">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {paymentMethod === 'CASH' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              รับเงินสด
            </label>
            <input
              type="number"
              value={received}
              onChange={(e) => setReceived(e.target.value)}
              className="w-full p-3 border rounded-lg dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white text-lg font-semibold outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
            {receivedNum >= total() && total() > 0 && (
              <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                เงินทอน: <strong>{formatBaht(change)}</strong>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            หมายเหตุ (ไม่บังคับ)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full p-2 border rounded-lg dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={submitting} className="flex-1">
            ยกเลิก
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            variant="success"
            className="flex-1"
          >
            {submitting ? (
              <>
                <Icons.Loader className="w-4 h-4" />
                <span>กำลังบันทึก…</span>
              </>
            ) : (
              'ยืนยันการขาย'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
