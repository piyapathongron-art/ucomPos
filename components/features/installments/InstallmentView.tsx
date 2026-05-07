'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Icons } from '@/components/ui/Icons';
import { ConfirmModal } from '@/components/ui/Modal';
import { InstallmentForm } from './InstallmentForm';
import { InstallmentDetail } from './InstallmentDetail';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { formatBaht, formatThaiDate } from '@/lib/utils';
import type {
  Installment,
  InstallmentMode,
  InstallmentStatus,
} from '@/types/domain';

const MODE_LABELS: Record<InstallmentMode, string> = {
  CONSIGNMENT: 'ฝากผ่อน',
  SELF_MANAGED: 'ผ่อนเอง',
};

const STATUS_LABELS: Record<InstallmentStatus, string> = {
  PENDING_COMMISSION: 'รอรับคอมมิชชัน',
  ACTIVE: 'กำลังผ่อน',
  COMPLETED: 'จบดิล',
  CANCELLED: 'ยกเลิก',
};

const STATUS_STYLES: Record<InstallmentStatus, string> = {
  PENDING_COMMISSION:
    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  ACTIVE:
    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  COMPLETED:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

type ListItem = Installment & { _count?: { payments: number } };

export function InstallmentView() {
  const showNotification = useUIStore((s) => s.showNotification);
  const isAdmin = useAuthStore((s) => s.user?.role === 'ADMIN');

  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<InstallmentStatus | ''>('');
  const [modeFilter, setModeFilter] = useState<InstallmentMode | ''>('');

  const [showForm, setShowForm] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<ListItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (statusFilter) params.set('status', statusFilter);
      if (modeFilter) params.set('mode', modeFilter);
      const res = await fetch(`/api/installments?${params.toString()}`);
      const data = await res.json();
      if (res.ok) setItems(data.installments ?? []);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, modeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaved = async () => {
    setShowForm(false);
    await load();
    showNotification('สร้างบิลผ่อนเรียบร้อย', 'success');
  };

  const handleCancel = async () => {
    if (!confirmCancel) return;
    const res = await fetch(`/api/installments/${confirmCancel.id}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (res.ok) {
      showNotification('ยกเลิกบิลเรียบร้อย', 'success');
      setConfirmCancel(null);
      await load();
    } else {
      showNotification(data.error || 'ยกเลิกไม่สำเร็จ', 'error');
    }
  };

  const stats = {
    pendingCommission: items.filter((i) => i.status === 'PENDING_COMMISSION')
      .length,
    active: items.filter((i) => i.status === 'ACTIVE').length,
    activeRemaining: items
      .filter((i) => i.status === 'ACTIVE')
      .reduce((s, i) => s + (Number(i.totalAmount) - Number(i.paidAmount)), 0),
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            ผ่อนชำระ
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            รอคอมมิชชัน {stats.pendingCommission} · กำลังผ่อน {stats.active}
            {stats.active > 0 && ` · ค้างชำระ ${formatBaht(stats.activeRemaining)}`}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Icons.CreditCard className="w-4 h-4" />
          <span>สร้างบิลผ่อน</span>
        </Button>
      </div>

      <Card className="p-4 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="ค้นหาชื่อหรือเบอร์ลูกค้า"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={modeFilter}
          onChange={(e) => setModeFilter(e.target.value as InstallmentMode | '')}
          className="px-3 py-3 border rounded-lg dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"
        >
          <option value="">ทุกรูปแบบ</option>
          <option value="CONSIGNMENT">ฝากผ่อน</option>
          <option value="SELF_MANAGED">ผ่อนเอง</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as InstallmentStatus | '')
          }
          className="px-3 py-3 border rounded-lg dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"
        >
          <option value="">ทุกสถานะ</option>
          <option value="PENDING_COMMISSION">รอคอมมิชชัน</option>
          <option value="ACTIVE">กำลังผ่อน</option>
          <option value="COMPLETED">จบดิล</option>
          <option value="CANCELLED">ยกเลิก</option>
        </select>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-850">
              <tr className="text-left text-slate-600 dark:text-slate-300">
                <th className="px-4 py-3 font-semibold">วันที่</th>
                <th className="px-4 py-3 font-semibold">ลูกค้า</th>
                <th className="px-4 py-3 font-semibold">เครื่อง</th>
                <th className="px-4 py-3 font-semibold">รูปแบบ</th>
                <th className="px-4 py-3 font-semibold text-right">ยอด/คงเหลือ</th>
                <th className="px-4 py-3 font-semibold text-center">สถานะ</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    <Icons.Loader className="w-5 h-5 mx-auto" />
                  </td>
                </tr>
              )}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    ยังไม่มีบิลผ่อน
                  </td>
                </tr>
              )}
              {items.map((it) => {
                const remaining =
                  Number(it.totalAmount) - Number(it.paidAmount);
                return (
                  <tr
                    key={it.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-750 cursor-pointer"
                    onClick={() => setDetailId(it.id)}
                  >
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatThaiDate(it.date)}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">
                      {it.customerName}
                      {it.customerPhone && (
                        <div className="text-xs text-slate-400">
                          {it.customerPhone}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">
                      {it.productSnapshot?.name ?? '-'}
                      {it.productSnapshot?.productCode && (
                        <div className="font-mono">
                          {it.productSnapshot.productCode}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {MODE_LABELS[it.mode]}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {it.mode === 'SELF_MANAGED' ? (
                        <>
                          <div className="font-semibold">
                            {formatBaht(Number(it.totalAmount))}
                          </div>
                          {it.status === 'ACTIVE' && (
                            <div className="text-xs text-red-500">
                              เหลือ {formatBaht(remaining)}
                            </div>
                          )}
                        </>
                      ) : it.status === 'COMPLETED' ? (
                        <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                          คอม {formatBaht(Number(it.commission))}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          STATUS_STYLES[it.status]
                        }`}
                      >
                        {STATUS_LABELS[it.status]}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {(it.status === 'PENDING_COMMISSION' ||
                        it.status === 'ACTIVE') &&
                        isAdmin && (
                          <button
                            onClick={() => setConfirmCancel(it)}
                            className="px-2 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded text-xs"
                          >
                            ยกเลิก
                          </button>
                        )}
                      <Icons.ChevronRight className="w-4 h-4 text-slate-400 inline" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {showForm && (
        <InstallmentForm onClose={() => setShowForm(false)} onSaved={handleSaved} />
      )}

      {detailId && (
        <InstallmentDetail
          installmentId={detailId}
          onClose={() => setDetailId(null)}
          onChanged={async () => {
            await load();
          }}
        />
      )}

      {confirmCancel && (
        <ConfirmModal
          title="ยกเลิกบิลผ่อน"
          message={`ต้องการยกเลิกบิลของ "${confirmCancel.customerName}"? เครื่องจะถูกคืนเข้าสต็อก`}
          confirmLabel="ยกเลิกบิล"
          onConfirm={handleCancel}
          onCancel={() => setConfirmCancel(null)}
        />
      )}
    </div>
  );
}
