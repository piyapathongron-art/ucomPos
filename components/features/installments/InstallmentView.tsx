'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import { PartnerForm } from './PartnerForm';
import { PartnerDetail } from './PartnerDetail';
import { useUIStore } from '@/store/uiStore';
import { formatBaht } from '@/lib/utils';
import type { PartnerTransaction } from '@/types/domain';

interface Partner {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  totalDebt: number;
  totalCommission: number;
  isActive: boolean;
  transactions: PartnerTransaction[];
}

type DetailPartner = Omit<Partner, 'transactions'> & { transactions: PartnerTransaction[] };

export function InstallmentView() {
  const showNotification = useUIStore((s) => s.showNotification);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [detail, setDetail] = useState<DetailPartner | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/partners');
      const data = await res.json();
      if (res.ok) setPartners(data.partners ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = async (partner: Partner) => {
    const res = await fetch(`/api/partners/${partner.id}`);
    const data = await res.json();
    if (res.ok) setDetail(data.partner);
  };

  const refreshDetail = async () => {
    if (!detail) return;
    const res = await fetch(`/api/partners/${detail.id}`);
    const data = await res.json();
    if (res.ok) {
      setDetail(data.partner);
      await load();
    }
  };

  const handleSaved = async () => {
    setShowForm(false);
    setEditing(null);
    await load();
    showNotification('บันทึกเรียบร้อย', 'success');
  };

  const handleDeactivated = async () => {
    setDetail(null);
    await load();
    showNotification('ปิดบัญชีเรียบร้อย', 'success');
  };

  const filtered = partners.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.phone ?? '').includes(search)
  );

  const totalDebt = partners.reduce((s, p) => s + Number(p.totalDebt), 0);
  const totalCommission = partners.reduce((s, p) => s + Number(p.totalCommission), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">ฝากผ่อน</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            หนี้รวม {formatBaht(totalDebt)} · ค่าคอมฯ สะสม {formatBaht(totalCommission)}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Icons.Users className="w-4 h-4" />
          <span>เพิ่มลูกค้า</span>
        </Button>
      </div>

      <Card className="p-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อหรือเบอร์โทร"
          className="w-full px-3 py-2.5 border rounded-lg text-sm dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
        />
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-850">
              <tr className="text-left text-slate-600 dark:text-slate-300">
                <th className="px-4 py-3 font-semibold">ชื่อลูกค้า</th>
                <th className="px-4 py-3 font-semibold">เบอร์โทร</th>
                <th className="px-4 py-3 font-semibold text-right">หนี้คงเหลือ</th>
                <th className="px-4 py-3 font-semibold text-right">ค่าคอมฯ สะสม</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    <Icons.Loader className="w-5 h-5 mx-auto" />
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    {search ? 'ไม่พบลูกค้าที่ค้นหา' : 'ยังไม่มีข้อมูลลูกค้า'}
                  </td>
                </tr>
              )}
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-750 cursor-pointer"
                  onClick={() => openDetail(p)}
                >
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">
                    {p.name}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {p.phone || '-'}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-semibold ${
                      Number(p.totalDebt) > 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {formatBaht(Number(p.totalDebt))}
                  </td>
                  <td className="px-4 py-3 text-right text-blue-600 dark:text-blue-400 font-medium">
                    {formatBaht(Number(p.totalCommission))}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Icons.ChevronRight className="w-4 h-4 text-slate-400 inline" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {(showForm || editing) && (
        <PartnerForm
          partner={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={handleSaved}
        />
      )}

      {detail && (
        <PartnerDetail
          partner={detail}
          onClose={() => setDetail(null)}
          onEdit={() => {
            setEditing(detail as unknown as Partner);
            setDetail(null);
          }}
          onDeactivated={handleDeactivated}
          onTransactionRecorded={async () => {
            showNotification('บันทึกรายการเรียบร้อย', 'success');
            await refreshDetail();
          }}
        />
      )}
    </div>
  );
}
