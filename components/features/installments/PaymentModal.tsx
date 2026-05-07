'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { formatBaht, parseNum } from '@/lib/utils';
import type { PaymentMethod } from '@/types/domain';

interface PaymentModalProps {
  installmentId: string;
  isCommission: boolean; // true = CONSIGNMENT (รับคอม), false = SELF_MANAGED (รับงวด)
  remaining?: number; // for SELF_MANAGED
  onClose: () => void;
  onSaved: () => void;
}

export function PaymentModal({
  installmentId,
  isCommission,
  remaining,
  onClose,
  onSaved,
}: PaymentModalProps) {
  const [amount, setAmount] = useState(
    isCommission ? '0' : remaining ? String(remaining) : '0'
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const amountNum = parseNum(amount);

  const handleSubmit = async () => {
    setError('');
    if (amountNum <= 0) {
      setError('กรุณาระบุจำนวนเงิน');
      return;
    }
    if (!isCommission && remaining != null && amountNum > remaining) {
      setError(`จ่ายเกินยอดคงเหลือ (${formatBaht(remaining)})`);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/installments/${installmentId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountNum,
          paymentMethod,
          notes: notes.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'บันทึกไม่สำเร็จ');
        return;
      }
      onSaved();
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={isCommission ? 'รับคอมมิชชัน' : 'รับชำระค่างวด'}
      onClose={onClose}
      maxWidth="max-w-sm"
    >
      <div className="space-y-4">
        {!isCommission && remaining != null && (
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-sm">
            <div className="flex justify-between">
              <span className="text-amber-700 dark:text-amber-400">ยอดคงเหลือ</span>
              <span className="font-semibold text-amber-700 dark:text-amber-400">
                {formatBaht(remaining)}
              </span>
            </div>
          </div>
        )}

        <Input
          label={isCommission ? 'จำนวนคอมมิชชัน (฿) *' : 'จำนวนเงินที่รับ (฿) *'}
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min={0}
          autoFocus
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            ช่องทางการรับเงิน *
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('CASH')}
              className={`px-3 py-2 rounded-lg text-sm border ${
                paymentMethod === 'CASH'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'border-slate-200 dark:border-slate-600'
              }`}
            >
              เงินสด
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('TRANSFER')}
              className={`px-3 py-2 rounded-lg text-sm border ${
                paymentMethod === 'TRANSFER'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'border-slate-200 dark:border-slate-600'
              }`}
            >
              โอน
            </button>
          </div>
        </div>

        <Input
          label="หมายเหตุ"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex gap-2 pt-2">
          <Button variant="outline" fullWidth onClick={onClose} disabled={saving}>
            ยกเลิก
          </Button>
          <Button fullWidth onClick={handleSubmit} disabled={saving}>
            {saving ? 'กำลังบันทึก…' : 'บันทึก'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
