'use client';

import { useCallback, useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import { PaymentModal } from './PaymentModal';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { formatBaht, formatThaiDateTime } from '@/lib/utils';
import type { Installment } from '@/types/domain';

interface InstallmentDetailProps {
  installmentId: string;
  onClose: () => void;
  onChanged: () => Promise<void> | void;
}

export function InstallmentDetail({
  installmentId,
  onClose,
  onChanged,
}: InstallmentDetailProps) {
  const showNotification = useUIStore((s) => s.showNotification);
  const isAdmin = useAuthStore((s) => s.user?.role === 'ADMIN');

  const [data, setData] = useState<Installment | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/installments/${installmentId}`);
      const json = await res.json();
      if (res.ok) setData(json.installment);
    } finally {
      setLoading(false);
    }
  }, [installmentId]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePaid = async () => {
    setShowPayment(false);
    await load();
    await onChanged();
    showNotification('บันทึกการชำระเรียบร้อย', 'success');
  };

  if (loading || !data) {
    return (
      <Modal title="รายละเอียดบิลผ่อน" onClose={onClose} maxWidth="max-w-2xl">
        <div className="py-8 text-center text-slate-400">
          <Icons.Loader className="w-6 h-6 mx-auto" />
        </div>
      </Modal>
    );
  }

  const remaining = Number(data.totalAmount) - Number(data.paidAmount);
  const totalProfit =
    data.mode === 'SELF_MANAGED'
      ? Number(data.totalAmount) - Number(data.cost)
      : Number(data.commission);
  const recognizedProfit = (data.payments ?? []).reduce(
    (s, p) => s + Number(p.profitRecognized),
    0
  );

  const canPay =
    (data.mode === 'CONSIGNMENT' && data.status === 'PENDING_COMMISSION') ||
    (data.mode === 'SELF_MANAGED' && data.status === 'ACTIVE');

  return (
    <Modal
      title={`บิล${data.mode === 'CONSIGNMENT' ? 'ฝากผ่อน' : 'ผ่อนเอง'}: ${data.customerName}`}
      onClose={onClose}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Customer */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-slate-500">ลูกค้า</div>
            <div className="font-medium text-slate-800 dark:text-white">
              {data.customerName}
            </div>
            {data.customerPhone && (
              <div className="text-xs text-slate-400">{data.customerPhone}</div>
            )}
          </div>
          <div>
            <div className="text-xs text-slate-500">เครื่อง</div>
            <div className="font-medium text-slate-800 dark:text-white">
              {data.productSnapshot?.name ?? '-'}
            </div>
            {data.productSnapshot?.productCode && (
              <div className="text-xs text-slate-400 font-mono">
                {data.productSnapshot.productCode}
              </div>
            )}
          </div>
        </div>

        {data.customerNote && (
          <div className="text-sm text-slate-500">
            <span className="text-xs">หมายเหตุลูกค้า:</span> {data.customerNote}
          </div>
        )}

        {/* Numbers */}
        <div className="rounded-lg border dark:border-slate-700 divide-y dark:divide-slate-700 text-sm">
          {data.mode === 'SELF_MANAGED' ? (
            <>
              <div className="flex justify-between p-3">
                <span className="text-slate-500">ยอดรวมที่ลูกค้าต้องจ่าย</span>
                <span className="font-semibold">
                  {formatBaht(Number(data.totalAmount))}
                </span>
              </div>
              <div className="flex justify-between p-3">
                <span className="text-slate-500">จ่ายมาแล้ว</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatBaht(Number(data.paidAmount))}
                </span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-850">
                <span className="font-medium">ยอดคงเหลือ</span>
                <span
                  className={`font-bold ${
                    remaining > 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-emerald-600'
                  }`}
                >
                  {formatBaht(remaining)}
                </span>
              </div>
              {isAdmin && (
                <>
                  <div className="flex justify-between p-3">
                    <span className="text-slate-500">ทุนเครื่อง</span>
                    <span>{formatBaht(Number(data.cost))}</span>
                  </div>
                  <div className="flex justify-between p-3">
                    <span className="text-slate-500">กำไรเต็มบิล</span>
                    <span>{formatBaht(totalProfit)}</span>
                  </div>
                  <div className="flex justify-between p-3">
                    <span className="text-slate-500">รับรู้แล้ว</span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {formatBaht(recognizedProfit)}
                    </span>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <div className="flex justify-between p-3">
                <span className="text-slate-500">ราคาเครื่อง</span>
                <span>{formatBaht(Number(data.basePrice))}</span>
              </div>
              {isAdmin && (
                <div className="flex justify-between p-3">
                  <span className="text-slate-500">ทุนเครื่อง</span>
                  <span>{formatBaht(Number(data.cost))}</span>
                </div>
              )}
              <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-850">
                <span className="font-medium">คอมมิชชันที่รับ</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {data.status === 'COMPLETED'
                    ? formatBaht(Number(data.commission))
                    : '— รอรับ'}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Pay button */}
        {canPay && (
          <Button fullWidth onClick={() => setShowPayment(true)}>
            <Icons.CreditCard className="w-4 h-4" />
            <span>
              {data.mode === 'CONSIGNMENT' ? 'รับคอมมิชชัน' : 'รับชำระเงิน'}
            </span>
          </Button>
        )}

        {/* Payment history */}
        <div>
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            ประวัติการรับเงิน ({data.payments?.length ?? 0})
          </div>
          {(!data.payments || data.payments.length === 0) ? (
            <div className="p-4 text-center text-sm text-slate-400 border dark:border-slate-700 rounded-lg">
              ยังไม่มีการรับเงิน
            </div>
          ) : (
            <div className="border dark:border-slate-700 rounded-lg divide-y dark:divide-slate-700">
              {data.payments.map((p) => (
                <div key={p.id} className="p-3 text-sm flex justify-between items-start">
                  <div>
                    <div className="text-slate-800 dark:text-white font-medium">
                      {formatBaht(Number(p.amount))}
                      <span className="ml-2 text-xs text-slate-400">
                        {p.paymentMethod === 'CASH' ? 'เงินสด' : 'โอน'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      {formatThaiDateTime(p.date)}
                      {p.user?.name && ` · ${p.user.name}`}
                    </div>
                    {p.notes && (
                      <div className="text-xs text-slate-500 mt-1">{p.notes}</div>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="text-xs text-emerald-600 dark:text-emerald-400">
                      +{formatBaht(Number(p.profitRecognized))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showPayment && (
        <PaymentModal
          installmentId={data.id}
          isCommission={data.mode === 'CONSIGNMENT'}
          remaining={data.mode === 'SELF_MANAGED' ? remaining : undefined}
          onClose={() => setShowPayment(false)}
          onSaved={handlePaid}
        />
      )}
    </Modal>
  );
}
