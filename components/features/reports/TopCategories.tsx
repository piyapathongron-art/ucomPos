import { Card } from '@/components/ui/Card';
import { formatBaht } from '@/lib/utils';

export interface TopCategory {
  categoryId: string | null;
  categoryName: string;
  totalRevenue: number;
  totalQty: number;
}

interface TopCategoriesProps {
  items: TopCategory[];
}

export function TopCategories({ items }: TopCategoriesProps) {
  const max = Math.max(...items.map((i) => i.totalRevenue), 1);

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
        หมวดหมู่ยอดนิยม
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400 py-6 text-center">ไม่มีข้อมูล</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.categoryId ?? '__none__'}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium text-slate-800 dark:text-white">
                  {item.categoryName}
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-xs ml-2 shrink-0">
                  {item.totalQty} ชิ้น · {formatBaht(item.totalRevenue)}
                </span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
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
