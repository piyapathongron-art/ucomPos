'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/Modal';
import { TransactionForm } from './TransactionForm';
import { formatBaht, formatThaiDate } from '@/lib/utils';
import type { PartnerTxType } from '@/types/domain';

interface Transaction {
  id: string;
  type: PartnerTxType;
  amount: number;
  description: string;
  date: string;
  user?: { name: string };
}

interface PartnerDetailProps {
  partner: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    notes: string | null;
    totalDebt: number;
    totalCommission: number;
    transactions: Transaction[];
  };
  onClose: () => void;
  onEdit: () => void;
  onDeactivated: () => void;
  onTransactionRecorded: () => void;
}

const TX_STYLES: Record<PartnerTxType, string> = {
  DEBT: 'text-red-600 dark:text-red-400',
  PAYMENT: 'text-emerald-600 dark:text-emerald-400',
  COMMISSION: 'text-blue-600 dark:text-blue-400',
};

const TX_LABELS: Record<PartnerTxType, string> = {
  DEBT: 'หนี้',
  PAYMENT: 'ชำระ',
  COMMISSION: 'ค่าคอมฯ',
};

export function PartnerDetail({
  partner,
  onClose,
  onEdit,
  onDeactivated,
  onTransactionRecorded,
}: PartnerDetailProps) {
  const [txType, setTxType] = useState<PartnerTxType | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const handleDeactivate = async () => {
    setDeactivating(true);
    try {
      const res = await fetch(`/api/partners/${partner.id}`, { method: 'DELETE' });
      if (res.ok) {
        onDeactivated();
      }
    } finally {
      setDeactivating(false);
      setConfirmDeactivate(false);
    }
  };

  return (
    <>
      <Modal title={partner.name} onClose={onClose} maxWidth="max-w-2xl">
        <div className="space-y-5">
          {/* Info row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            {partner.phone && (
              <div>
                <p className="text-slate-400">เบอร์</p>
                <p className="font-medium text-slate-800 dark:text-white">{partner.phone}</p>
              </div>
            )}
            {partner.email && (
              <div>
                <p className="text-slate-400">อีเมล</p>
                <p className="font-medium text-slate-800 dark:text-white">{partner.email}</p>
              </div>
            )}
            <div>
              <p className="text-slate-400">หนี้คงเหลือ</p>
              <p className="font-bold text-red-600 dark:text-red-400">
                {formatBaht(Number(partner.totalDebt))}
              </p>
            </div>
            <div>
              <p className="text-slate-400">ค่าคอมฯ สะสม</p>
              <p className="font-bold text-blue-600 dark:text-blue-400">
                {formatBaht(Number(partner.totalCommission))}
              </p>
            </div>
          </div>

          {partner.notes && (
            <p className="text-sm text-slate-500 italic">{partner.notes}</p>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="danger"
              className="px-3 py-1.5 text-sm"
              onClick={() => setTxType('DEBT')}
            >
              + บันทึกหนี้
            </Button>
            <Button
              variant="success"
              className="px-3 py-1.5 text-sm"
              onClick={() => setTxType('PAYMENT')}
            >
              + บันทึกชำระ
            </Button>
            <Button
              variant="outline"
              className="px-3 py-1.5 text-sm"
              onClick={() => setTxType('COMMISSION')}
            >
              + ค่าคอมฯ
            </Button>
            <div className="ml-auto flex gap-2">
              <Button variant="secondary" className="px-3 py-1.5 text-sm" onClick={onEdit}>
                แก้ไข
              </Button>
              <Button
                variant="danger"
                className="px-3 py-1.5 text-sm"
                onClick={() => setConfirmDeactivate(true)}
                disabled={deactivating}
              >
                ปิดบัญชี
              </Button>
            </div>
          </div>

          {/* Transaction history */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
              ประวัติรายการ
            </h4>
            {partner.transactions.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">ยังไม่มีรายการ</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border dark:border-slate-700">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr className="text-left text-xs text-slate-500 dark:text-slate-400">
                      <th className="px-3 py-2 font-medium">วันที่</th>
                      <th className="px-3 py-2 font-medium">ประเภท</th>
                      <th className="px-3 py-2 font-medium">รายละเอียด</th>
                      <th className="px-3 py-2 font-medium text-right">จำนวน</th>
                      <th className="px-3 py-2 font-medium">โดย</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {partner.transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td className="px-3 py-2 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {formatThaiDate(tx.date)}
                        </td>
                        <td className={`px-3 py-2 font-medium whitespace-nowrap ${TX_STYLES[tx.type]}`}>
                          {TX_LABELS[tx.type]}
                        </td>
                        <td className="px-3 py-2 text-slate-700 dark:text-slate-200">
                          {tx.description}
                        </td>
                        <td className={`px-3 py-2 text-right font-semibold whitespace-nowrap ${TX_STYLES[tx.type]}`}>
                          {tx.type === 'PAYMENT' ? '-' : '+'}
                          {formatBaht(Number(tx.amount))}
                        </td>
                        <td className="px-3 py-2 text-slate-400 text-xs">
                          {tx.user?.name ?? '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {txType && (
        <TransactionForm
          partnerId={partner.id}
          partnerName={partner.name}
          initialType={txType}
          onClose={() => setTxType(null)}
          onSaved={() => {
            setTxType(null);
            onTransactionRecorded();
          }}
        />
      )}

      {confirmDeactivate && (
        <ConfirmModal
          title="ปิดบัญชีลูกค้า"
          message={`ต้องการปิดบัญชี "${partner.name}" ใช่หรือไม่? รายการจะถูกซ่อนจากรายการหลัก`}
          confirmLabel="ปิดบัญชี"
          onConfirm={handleDeactivate}
          onCancel={() => setConfirmDeactivate(false)}
        />
      )}
    </>
  );
}
