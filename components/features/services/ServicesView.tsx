'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import { ConfirmModal } from '@/components/ui/Modal';
import { ServiceForm } from './ServiceForm';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { formatBaht, formatThaiDate } from '@/lib/utils';
import type { ServiceType, ServiceStatus } from '@/types/domain';

interface ServiceRecord {
  id: string;
  type: ServiceType;
  name: string;
  cost: number;
  price: number;
  date: string;
  status: ServiceStatus;
  details: Record<string, unknown> | null;
  user?: { name: string; username: string };
}

type Tab = ServiceType;

const TABS: { key: Tab; label: string }[] = [
  { key: 'REPAIR', label: 'ซ่อม' },
  { key: 'TOPUP', label: 'เติมเงิน' },
  { key: 'EXTENSION', label: 'ต่ออายุ' },
];

const STATUS_STYLES: Record<ServiceStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};
const STATUS_LABELS: Record<ServiceStatus, string> = {
  PENDING: 'รอดำเนินการ',
  COMPLETED: 'เสร็จแล้ว',
  CANCELLED: 'ยกเลิก',
};

function detailsSummary(type: ServiceType, details: Record<string, unknown> | null): string {
  if (!details) return '-';
  if (type === 'REPAIR') {
    const parts = [details.device, details.customer].filter(Boolean);
    return parts.join(' · ') || '-';
  }
  if (type === 'TOPUP') {
    return [details.carrier, details.customerPhone].filter(Boolean).join(' ') || '-';
  }
  if (type === 'EXTENSION') {
    return [details.device, details.period].filter(Boolean).join(' ') || '-';
  }
  return '-';
}

export function ServicesView() {
  const showNotification = useUIStore((s) => s.showNotification);
  const isAdmin = useAuthStore((s) => s.user?.role === 'ADMIN');
  const [activeTab, setActiveTab] = useState<Tab>('REPAIR');
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ServiceRecord | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ServiceRecord | null>(null);

  const load = useCallback(async (type: Tab) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/services?type=${type}`);
      const data = await res.json();
      if (res.ok) setServices(data.services ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(activeTab);
  }, [activeTab, load]);

  const handleSaved = async () => {
    setShowForm(false);
    setEditing(null);
    await load(activeTab);
    showNotification('บันทึกเรียบร้อย', 'success');
  };

  const markCompleted = async (s: ServiceRecord) => {
    const res = await fetch(`/api/services/${s.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'COMPLETED' }),
    });
    if (res.ok) {
      showNotification('อัปเดตสถานะเรียบร้อย', 'success');
      await load(activeTab);
    } else {
      showNotification('อัปเดตไม่สำเร็จ', 'error');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const res = await fetch(`/api/services/${confirmDelete.id}`, { method: 'DELETE' });
    if (res.ok) {
      showNotification('ลบรายการเรียบร้อย', 'success');
      setConfirmDelete(null);
      await load(activeTab);
    } else {
      const data = await res.json();
      showNotification(data.error || 'ลบไม่สำเร็จ', 'error');
    }
  };

  const pending = services.filter((s) => s.status === 'PENDING').length;
  const revenue = services
    .filter((s) => s.status === 'COMPLETED')
    .reduce((sum, s) => sum + Number(s.price), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">บริการ</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            รอดำเนินการ {pending} · รายได้ {formatBaht(revenue)}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Icons.Wrench className="w-4 h-4" />
          <span>เพิ่มรายการ</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b dark:border-slate-700">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === t.key
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-850">
              <tr className="text-left text-slate-600 dark:text-slate-300">
                <th className="px-4 py-3 font-semibold">วันที่</th>
                <th className="px-4 py-3 font-semibold">ชื่องาน</th>
                <th className="px-4 py-3 font-semibold">รายละเอียด</th>
                <th className="px-4 py-3 font-semibold text-right">ราคา</th>
                {isAdmin && <th className="px-4 py-3 font-semibold text-right">กำไร</th>}
                <th className="px-4 py-3 font-semibold text-center">สถานะ</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading && (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-4 py-8 text-center text-slate-400">
                    <Icons.Loader className="w-5 h-5 mx-auto" />
                  </td>
                </tr>
              )}
              {!loading && services.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-4 py-8 text-center text-slate-400">
                    ไม่มีรายการ
                  </td>
                </tr>
              )}
              {services.map((s) => {
                const profit = Number(s.price) - Number(s.cost);
                return (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-750">
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatThaiDate(s.date)}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">
                      {s.name}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">
                      {detailsSummary(s.type, s.details)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {formatBaht(Number(s.price))}
                    </td>
                    {isAdmin && (
                      <td className={`px-4 py-3 text-right ${profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                        {formatBaht(profit)}
                      </td>
                    )}
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[s.status]}`}>
                        {STATUS_LABELS[s.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                      {s.status === 'PENDING' && (
                        <button
                          onClick={() => markCompleted(s)}
                          className="px-2 py-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded text-xs"
                        >
                          เสร็จ
                        </button>
                      )}
                      <button
                        onClick={() => setEditing(s)}
                        className="px-2 py-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => setConfirmDelete(s)}
                        className="px-2 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                      >
                        ลบ
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {(showForm || editing) && (
        <ServiceForm
          type={editing?.type ?? activeTab}
          service={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={handleSaved}
        />
      )}

      {confirmDelete && (
        <ConfirmModal
          title="ลบรายการ"
          message={`ต้องการลบ "${confirmDelete.name}" ใช่หรือไม่?`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
