'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { parseNum } from '@/lib/utils';
import type { PartnerTxType } from '@/types/domain';

const TX_OPTIONS: { value: PartnerTxType; label: string; desc: string }[] = [
  { value: 'DEBT', label: 'บันทึกหนี้', desc: 'เพิ่มยอดหนี้คงเหลือ' },
  { value: 'PAYMENT', label: 'บันทึกชำระ', desc: 'หักยอดหนี้คงเหลือ' },
  { value: 'COMMISSION', label: 'ค่าคอมมิชชั่น', desc: 'เพิ่มค่าคอมมิชชั่นสะสม' },
];

interface TransactionFormProps {
  partnerId: string;
  partnerName: string;
  initialType?: PartnerTxType;
  onClose: () => void;
  onSaved: () => void;
}

export function TransactionForm({
  partnerId,
  partnerName,
  initialType = 'DEBT',
  onClose,
  onSaved,
}: TransactionFormProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [type, setType] = useState<PartnerTxType>(initialType);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const selectedOption = TX_OPTIONS.find((o) => o.value === type)!;

  const handleSubmit = async () => {
    const parsedAmount = parseNum(amount);
    if (parsedAmount <= 0) {
      setError('จำนวนเงินต้องมากกว่า 0');
      return;
    }
    if (!description.trim()) {
      setError('กรุณากรอกรายละเอียด');
      return;
    }
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/partners/${partnerId}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, amount: parsedAmount, description: description.trim() }),
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
      title={`${selectedOption.label} — ${partnerName}`}
      onClose={onClose}
      maxWidth="max-w-sm"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            ประเภทรายการ
          </label>
          <div className="grid grid-cols-3 gap-2">
            {TX_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => setType(o.value)}
                className={`p-2 rounded-lg border text-sm font-medium transition-colors ${
                  type === o.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-slate-400">{selectedOption.desc}</p>
        </div>

        <Input
          label="จำนวนเงิน (฿) *"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          min={0}
        />

        <Input
          label="รายละเอียด *"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={
            type === 'DEBT'
              ? 'เช่น Samsung S25 Ultra 512GB'
              : type === 'PAYMENT'
              ? 'เช่น ชำระงวดที่ 1'
              : 'เช่น ค่าคอมฯ เดือน พ.ค.'
          }
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
