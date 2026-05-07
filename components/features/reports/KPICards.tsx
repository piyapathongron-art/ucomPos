import { Card } from '@/components/ui/Card';
import { formatBaht } from '@/lib/utils';

export interface ReportSummary {
  revenue: number;
  profit: number;
  cost: number;
  saleCount: number;
  avgTicket: number;
  cashTotal: number;
  cashCount: number;
  transferTotal: number;
  transferCount: number;
}

interface KPICardsProps {
  summary: ReportSummary;
  isAdmin: boolean;
}

export function KPICards({ summary, isAdmin }: KPICardsProps) {
  const marginPct =
    summary.revenue > 0
      ? ((summary.profit / summary.revenue) * 100).toFixed(1)
      : '0';

  const cards = [
    {
      label: 'ยอดขายรวม',
      value: formatBaht(summary.revenue),
      sub: `${summary.saleCount} บิล`,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      adminOnly: false,
    },
    {
      label: 'กำไรสุทธิ',
      value: formatBaht(summary.profit),
      sub: `margin ${marginPct}%`,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      adminOnly: true,
    },
    {
      label: 'ยอดเฉลี่ย/บิล',
      value: formatBaht(summary.avgTicket),
      sub: 'ต่อรายการ',
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-50 dark:bg-violet-900/20',
      adminOnly: false,
    },
    {
      label: 'เงินสด / โอน',
      value: formatBaht(summary.cashTotal),
      sub: `โอน: ${formatBaht(summary.transferTotal)}`,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      adminOnly: false,
    },
  ].filter((c) => !c.adminOnly || isAdmin);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card key={c.label} className={`p-4 ${c.bg}`}>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            {c.label}
          </p>
          <p className={`text-xl font-bold mt-1 ${c.color}`}>{c.value}</p>
          <p className="text-xs text-slate-400 mt-0.5">{c.sub}</p>
        </Card>
      ))}
    </div>
  );
}
