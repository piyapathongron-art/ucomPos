'use client';

import { useCallback, useEffect, useState } from 'react';
import { DateRangePicker, type DateRange } from './DateRangePicker';
import { KPICards, type ReportSummary } from './KPICards';
import { TopProducts, type TopProduct } from './TopProducts';
import { TopCategories, type TopCategory } from './TopCategories';
import { TransactionList } from './TransactionList';
import { Icons } from '@/components/ui/Icons';

interface AnalyticsData {
  summary: ReportSummary;
  topProducts: TopProduct[];
  topCategories: TopCategory[];
}

const EMPTY_SUMMARY: ReportSummary = {
  revenue: 0,
  profit: 0,
  cost: 0,
  saleCount: 0,
  avgTicket: 0,
  cashTotal: 0,
  cashCount: 0,
  transferTotal: 0,
  transferCount: 0,
};

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export function ReportView() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: todayString(),
    to: todayString(),
  });
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (range: DateRange) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (range.from) params.set('from', range.from);
      if (range.to) params.set('to', range.to);
      const res = await fetch(`/api/reports/analytics?${params.toString()}`);
      const data = await res.json();
      if (res.ok) setAnalytics(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(dateRange);
  }, [dateRange, load]);

  const handleRangeChange = (range: DateRange) => {
    setDateRange(range);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">รายงาน</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            สรุปยอดขาย กำไร และสินค้าขายดี
          </p>
        </div>
        {loading && <Icons.Loader className="w-5 h-5 text-slate-400" />}
      </div>

      <DateRangePicker value={dateRange} onChange={handleRangeChange} />

      <KPICards summary={analytics?.summary ?? EMPTY_SUMMARY} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TopProducts items={analytics?.topProducts ?? []} />
        <TopCategories items={analytics?.topCategories ?? []} />
      </div>

      <TransactionList dateRange={dateRange} />
    </div>
  );
}
