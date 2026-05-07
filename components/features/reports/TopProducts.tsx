import { Card } from '@/components/ui/Card';
import { formatBaht } from '@/lib/utils';

export interface TopProduct {
  productId: number | null;
  productName: string;
  productCode: string | null;
  totalQty: number;
  totalRevenue: number;
}

interface TopProductsProps {
  items: TopProduct[];
}

export function TopProducts({ items }: TopProductsProps) {
  const max = Math.max(...items.map((i) => i.totalRevenue), 1);

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
        สินค้าขายดี Top 10
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400 py-6 text-center">ไม่มีข้อมูล</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item, i) => (
            <li key={item.productId ?? i}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span
                  className="font-medium text-slate-800 dark:text-white truncate max-w-[55%]"
                  title={item.productName}
                >
                  {item.productName}
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-xs ml-2 shrink-0">
                  {item.totalQty} ชิ้น · {formatBaht(item.totalRevenue)}
                </span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${(item.totalRevenue / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
