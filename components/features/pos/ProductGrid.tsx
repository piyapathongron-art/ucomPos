'use client';

import { Card } from '@/components/ui/Card';
import { Icons } from '@/components/ui/Icons';
import { formatBaht } from '@/lib/utils';
import type { Product } from '@/types/domain';

interface Props {
  products: Product[];
  loading: boolean;
  onAdd: (p: Product) => void;
}

export function ProductGrid({ products, loading, onAdd }: Props) {
  if (loading) {
    return (
      <Card className="p-8 text-center text-slate-400">
        <Icons.Loader className="w-6 h-6 mx-auto" />
      </Card>
    );
  }

  if (products.length === 0) {
    return (
      <Card className="p-8 text-center text-slate-400">ไม่พบสินค้า</Card>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {products.map((p) => {
        const outOfStock = p.qty <= 0;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onAdd(p)}
            disabled={outOfStock}
            className={`relative p-3 rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700 text-left transition-all active:scale-95 ${
              outOfStock
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700'
            }`}
          >
            {p.isFavorite && (
              <span className="absolute top-2 right-2 text-yellow-500">★</span>
            )}
            <div className="text-xs text-slate-400 font-mono mb-1">
              {p.productId}
            </div>
            <div className="font-medium text-slate-800 dark:text-white text-sm line-clamp-2 min-h-[2.5rem]">
              {p.name}
            </div>
            {p.category?.name && (
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {p.category.name}
              </div>
            )}
            <div className="flex justify-between items-end mt-2">
              <span
                className={`text-xs ${
                  p.qty < 5
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-slate-500'
                }`}
              >
                คงเหลือ {p.qty}
              </span>
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {formatBaht(Number(p.price))}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
