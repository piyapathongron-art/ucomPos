'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { formatBaht, formatThaiDate } from '@/lib/utils';
import { APP_NAME } from '@/lib/constants';

function DailyClosePrintLayout({
  date,
  summary,
  existing,
  expenses,
  notes,
}: {
  date: string;
  summary: SalesSummary;
  existing: DailyCloseRecord;
  expenses: Expense[];
  notes: string;
}) {
  const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
  return (
    <div style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: '12px', padding: '8px' }}>
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <strong>{APP_NAME}</strong>
        <br />
        สรุปยอดปิดร้านประจำวัน
        <br />
        {formatThaiDate(date)}
      </div>
      <hr />
      <div>ยอดเงินสด: {formatBaht(summary.cashSales)}</div>
      <div>ยอดโอน: {formatBaht(summary.transferSales)}</div>
      <div>รวมยอดขาย: {formatBaht(summary.cashSales + summary.transferSales)}</div>
      <div>จำนวนบิล: {summary.saleCount} บิล</div>
      <div>กำไรขั้นต้น: {formatBaht(summary.grossProfit)}</div>
      <hr />
      {expenses.length > 0 && (
        <>
          <strong>รายจ่าย</strong>
          {expenses.map((e, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{e.name}{e.category ? ` (${e.category})` : ''}</span>
              <span>{formatBaht(e.amount)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>รวมรายจ่าย</span>
            <span>{formatBaht(totalExp)}</span>
          </div>
          <hr />
        </>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
        <span>กำไรสุทธิ</span>
        <span>{formatBaht(existing.profit)}</span>
      </div>
      {notes && (
        <>
          <hr />
          <div>หมายเหตุ: {notes}</div>
        </>
      )}
      <hr />
      <div style={{ textAlign: 'center', marginTop: '8px' }}>พิมพ์จาก {APP_NAME}</div>
    </div>
  );
}

interface Expense {
  name: string;
  amount: number;
  category: string;
}

interface SalesSummary {
  cashSales: number;
  transferSales: number;
  grossProfit: number;
  saleCount: number;
}

interface DailyCloseRecord {
  id: string;
  cashSales: number;
  transferSales: number;
  totalExpenses: number;
  profit: number;
  notes: string | null;
  expenses: { id: string; name: string; amount: number; category: string | null }[];
}

export function DailyClose() {
  const showNotification = useUIStore((s) => s.showNotification);
  const isAdmin = useAuthStore((s) => s.user?.role === 'ADMIN');
  const todayStr = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(todayStr);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [existing, setExisting] = useState<DailyCloseRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [notes, setNotes] = useState('');
  const [expName, setExpName] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState('');

  const load = async (d: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/daily-close?date=${d}`);
      const data = await res.json();
      if (res.ok) {
        setSummary(data.summary);
        setExisting(data.dailyClose);
        if (data.dailyClose) {
          setExpenses(
            data.dailyClose.expenses.map((e: { name: string; amount: number; category: string | null }) => ({
              name: e.name,
              amount: e.amount,
              category: e.category ?? '',
            }))
          );
          setNotes(data.dailyClose.notes ?? '');
        } else {
          setExpenses([]);
          setNotes('');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(date); }, [date]);

  const addExpense = () => {
    const amount = parseFloat(expAmount);
    if (!expName.trim() || isNaN(amount) || amount <= 0) return;
    setExpenses((prev) => [...prev, { name: expName.trim(), amount, category: expCategory.trim() }]);
    setExpName('');
    setExpAmount('');
    setExpCategory('');
  };

  const removeExpense = (idx: number) => {
    setExpenses((prev) => prev.filter((_, i) => i !== idx));
  };

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = (summary?.grossProfit ?? 0) - totalExpenses;

  const handleClose = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/reports/daily-close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, expenses, notes: notes || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setExisting(data.dailyClose);
        showNotification('ปิดยอดวันเรียบร้อย', 'success');
      } else {
        showNotification(data.error || 'เกิดข้อผิดพลาด', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="font-semibold text-slate-800 dark:text-white">ปิดยอดประจำวัน</h3>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-2 py-1 border rounded-lg text-sm dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="text-center py-6">
          <Icons.Loader className="w-5 h-5 mx-auto text-slate-400" />
        </div>
      ) : (
        <>
          {existing && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-3 py-2">
              <Icons.Check className="w-4 h-4 shrink-0" />
              <span>ปิดยอดแล้ว — สามารถแก้ไขและบันทึกซ้ำได้</span>
            </div>
          )}

          {/* Sales summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'ยอดเงินสด', value: summary?.cashSales ?? 0, color: 'text-emerald-600 dark:text-emerald-400', adminOnly: false },
              { label: 'ยอดโอน', value: summary?.transferSales ?? 0, color: 'text-blue-600 dark:text-blue-400', adminOnly: false },
              { label: 'กำไรขั้นต้น', value: summary?.grossProfit ?? 0, color: 'text-purple-600 dark:text-purple-400', adminOnly: true },
              { label: 'จำนวนบิล', value: summary?.saleCount ?? 0, color: 'text-slate-700 dark:text-slate-200', isBill: true, adminOnly: false },
            ].filter((item) => !item.adminOnly || isAdmin).map((item) => (
              <div key={item.label} className="rounded-lg border dark:border-slate-700 p-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
                <p className={`text-lg font-bold mt-0.5 ${item.color}`}>
                  {item.isBill ? `${item.value} บิล` : formatBaht(item.value)}
                </p>
              </div>
            ))}
          </div>

          {/* Expenses */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">รายจ่ายประจำวัน</p>
            <div className="flex flex-wrap gap-2">
              <input
                value={expName}
                onChange={(e) => setExpName(e.target.value)}
                placeholder="รายการ เช่น ค่าน้ำ ค่าไฟ"
                className="flex-1 min-w-40 px-2.5 py-2 border rounded-lg text-sm dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                value={expAmount}
                onChange={(e) => setExpAmount(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addExpense()}
                placeholder="จำนวน (฿)"
                type="number"
                min={0}
                className="w-32 px-2.5 py-2 border rounded-lg text-sm dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                value={expCategory}
                onChange={(e) => setExpCategory(e.target.value)}
                placeholder="หมวด (ไม่บังคับ)"
                className="w-36 px-2.5 py-2 border rounded-lg text-sm dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button variant="outline" onClick={addExpense}>
                <Icons.Plus className="w-4 h-4" />
              </Button>
            </div>

            {expenses.length > 0 && (
              <ul className="rounded-lg border dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
                {expenses.map((e, idx) => (
                  <li key={idx} className="flex items-center gap-2 px-3 py-2 text-sm">
                    <span className="flex-1 text-slate-800 dark:text-white">{e.name}</span>
                    {e.category && (
                      <span className="text-xs text-slate-400">{e.category}</span>
                    )}
                    <span className="font-medium text-red-600 dark:text-red-400">
                      {formatBaht(e.amount)}
                    </span>
                    <button
                      onClick={() => removeExpense(idx)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded"
                    >
                      <Icons.X className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
                <li className="flex items-center gap-2 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 font-medium">
                  <span className="flex-1 text-slate-700 dark:text-slate-300">รวมรายจ่าย</span>
                  <span className="text-red-600 dark:text-red-400">{formatBaht(totalExpenses)}</span>
                </li>
              </ul>
            )}
          </div>

          {/* Net profit — admin only */}
          {isAdmin && (
            <div className="rounded-lg border-2 border-blue-200 dark:border-blue-800 p-4 bg-blue-50 dark:bg-blue-900/20">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-700 dark:text-slate-200">กำไรสุทธิ</span>
                <span
                  className={`text-2xl font-bold ${
                    netProfit >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {formatBaht(netProfit)}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                กำไรขั้นต้น {formatBaht(summary?.grossProfit ?? 0)} − รายจ่าย {formatBaht(totalExpenses)}
              </p>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              หมายเหตุ
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="หมายเหตุประจำวัน…"
              className="w-full p-2.5 border rounded-lg text-sm dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex gap-2">
            <Button fullWidth onClick={handleClose} disabled={saving}>
              {saving ? (
                <>
                  <Icons.Loader className="w-4 h-4" />
                  <span>กำลังบันทึก…</span>
                </>
              ) : (
                <>
                  <Icons.Calendar className="w-4 h-4" />
                  <span>{existing ? 'อัปเดตยอดปิดวัน' : 'ปิดยอดวันนี้'}</span>
                </>
              )}
            </Button>
            {existing && (
              <Button variant="outline" onClick={() => window.print()} className="shrink-0">
                <Icons.Download className="w-4 h-4" />
                <span>พิมพ์</span>
              </Button>
            )}
          </div>

          {/* Printable daily close summary */}
          {existing && summary && (
            <div
              id="printable-area"
              aria-hidden="true"
              style={{ position: 'fixed', left: '-9999px', top: 0, width: '300px' }}
            >
              <DailyClosePrintLayout
                date={date}
                summary={summary}
                existing={existing}
                expenses={expenses}
                notes={notes}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
