'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Icons } from '@/components/ui/Icons';
import { formatBaht, formatThaiDateTime } from '@/lib/utils';
import type { DateRange } from './DateRangePicker';

interface SaleItem {
  id: number;
  productName: string;
  productCode: string | null;
  qty: number;
  price: number;
  itemDiscount: number;
  subtotal: number;
}

interface Sale {
  id: string;
  date: string;
  total: number;
  profit: number;
  paymentMethod: 'CASH' | 'TRANSFER';
  voided: boolean;
  notes: string | null;
  billDiscount: number;
  subtotal: number;
  itemDiscount: number;
  items: SaleItem[];
  user?: { name: string; username: string };
}

const PAGE_SIZE = 20;

interface TransactionListProps {
  dateRange: DateRange;
  isAdmin: boolean;
}

export function TransactionList({ dateRange, isAdmin }: TransactionListProps) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Sale | null>(null);

  useEffect(() => {
    setPage(1);
  }, [dateRange]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params = new URLSearchParams();
    if (dateRange.from) params.set('from', dateRange.from);
    if (dateRange.to) {
      // Fetch end-of-day for the to date
      params.set('to', `${dateRange.to}T23:59:59`);
    }
    params.set('limit', '500');

    fetch(`/api/sales?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setSales(data.sales ?? []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [dateRange]);

  const paginated = sales.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(sales.length / PAGE_SIZE);

  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 border-b dark:border-slate-700 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          รายการขาย
        </h3>
        <span className="text-xs text-slate-400">{sales.length} รายการ</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-850">
            <tr className="text-left text-slate-600 dark:text-slate-300">
              <th className="px-4 py-3 font-semibold">วัน-เวลา</th>
              <th className="px-4 py-3 font-semibold">พนักงาน</th>
              <th className="px-4 py-3 font-semibold text-center">ชำระ</th>
              <th className="px-4 py-3 font-semibold text-right">ยอดรวม</th>
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
            {!loading && sales.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} className="px-4 py-8 text-center text-slate-400">
                  ไม่มีรายการขายในช่วงเวลานี้
                </td>
              </tr>
            )}
            {paginated.map((sale) => (
              <tr
                key={sale.id}
                className={`hover:bg-slate-50 dark:hover:bg-slate-750 cursor-pointer ${
                  sale.voided ? 'opacity-50' : ''
                }`}
                onClick={() => setSelected(sale)}
              >
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  {formatThaiDateTime(sale.date)}
                </td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                  {sale.user?.name ?? '-'}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      sale.paymentMethod === 'CASH'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}
                  >
                    {sale.paymentMethod === 'CASH' ? 'เงินสด' : 'โอน'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-slate-800 dark:text-white">
                  {formatBaht(Number(sale.total))}
                </td>
                {isAdmin && (
                  <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">
                    {formatBaht(Number(sale.profit))}
                  </td>
                )}
                <td className="px-4 py-3 text-center">
                  {sale.voided ? (
                    <span className="text-xs text-red-500 font-medium">ยกเลิก</span>
                  ) : (
                    <span className="text-xs text-emerald-500 font-medium">สำเร็จ</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Icons.ChevronRight className="w-4 h-4 text-slate-400 inline" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-4 py-3 border-t dark:border-slate-700 flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm rounded-lg bg-slate-100 dark:bg-slate-700 disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            ก่อนหน้า
          </button>
          <span className="text-xs text-slate-500">
            หน้า {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm rounded-lg bg-slate-100 dark:bg-slate-700 disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            ถัดไป
          </button>
        </div>
      )}

      {selected && (
        <SaleDetailModal sale={selected} onClose={() => setSelected(null)} isAdmin={isAdmin} />
      )}
    </Card>
  );
}

function SaleDetailModal({ sale, onClose, isAdmin }: { sale: Sale; onClose: () => void; isAdmin: boolean }) {
  return (
    <Modal
      title={`บิล #${sale.id.slice(-8).toUpperCase()}`}
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-slate-400">วันเวลา</p>
            <p className="font-medium text-slate-800 dark:text-white">
              {formatThaiDateTime(sale.date)}
            </p>
          </div>
          <div>
            <p className="text-slate-400">พนักงาน</p>
            <p className="font-medium text-slate-800 dark:text-white">
              {sale.user?.name ?? '-'}
            </p>
          </div>
          <div>
            <p className="text-slate-400">ชำระ</p>
            <p className="font-medium text-slate-800 dark:text-white">
              {sale.paymentMethod === 'CASH' ? 'เงินสด' : 'โอนเงิน'}
            </p>
          </div>
          <div>
            <p className="text-slate-400">สถานะ</p>
            <p
              className={`font-medium ${
                sale.voided ? 'text-red-500' : 'text-emerald-500'
              }`}
            >
              {sale.voided ? 'ยกเลิกแล้ว' : 'สำเร็จ'}
            </p>
          </div>
        </div>

        {sale.notes && (
          <p className="text-sm text-slate-500 italic border-t dark:border-slate-700 pt-3">
            หมายเหตุ: {sale.notes}
          </p>
        )}

        <table className="w-full text-sm border-t dark:border-slate-700 pt-3">
          <thead>
            <tr className="text-left text-slate-500 text-xs uppercase">
              <th className="pb-2">สินค้า</th>
              <th className="pb-2 text-right">จำนวน</th>
              <th className="pb-2 text-right">ราคา</th>
              <th className="pb-2 text-right">ยอด</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {sale.items.map((item) => (
              <tr key={item.id}>
                <td className="py-2 text-slate-800 dark:text-white">{item.productName}</td>
                <td className="py-2 text-right text-slate-500">{item.qty}</td>
                <td className="py-2 text-right text-slate-500">
                  {formatBaht(Number(item.price))}
                  {Number(item.itemDiscount) > 0 && (
                    <span className="text-red-400 ml-1">
                      (-{formatBaht(Number(item.itemDiscount))})
                    </span>
                  )}
                </td>
                <td className="py-2 text-right font-medium text-slate-800 dark:text-white">
                  {formatBaht(Number(item.subtotal))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t dark:border-slate-700 pt-3 space-y-1 text-sm">
          <div className="flex justify-between text-slate-500">
            <span>ยอดรวมก่อนลด</span>
            <span>{formatBaht(Number(sale.subtotal))}</span>
          </div>
          {Number(sale.itemDiscount) > 0 && (
            <div className="flex justify-between text-red-500">
              <span>ส่วนลดรายการ</span>
              <span>-{formatBaht(Number(sale.itemDiscount))}</span>
            </div>
          )}
          {Number(sale.billDiscount) > 0 && (
            <div className="flex justify-between text-red-500">
              <span>ส่วนลดบิล</span>
              <span>-{formatBaht(Number(sale.billDiscount))}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-slate-800 dark:text-white text-base border-t dark:border-slate-700 pt-2 mt-1">
            <span>ยอดสุทธิ</span>
            <span>{formatBaht(Number(sale.total))}</span>
          </div>
          {isAdmin && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 text-xs">
              <span>กำไร</span>
              <span>{formatBaht(Number(sale.profit))}</span>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
