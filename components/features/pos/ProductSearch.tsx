'use client';

import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

interface Category {
  id: string;
  name: string;
}

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  categoryId: string;
  onCategoryChange: (v: string) => void;
  categories: Category[];
  favoritesOnly: boolean;
  onFavoritesChange: (v: boolean) => void;
}

export function ProductSearch({
  search,
  onSearchChange,
  categoryId,
  onCategoryChange,
  categories,
  favoritesOnly,
  onFavoritesChange,
}: Props) {
  return (
    <Card className="p-3 flex flex-wrap items-center gap-2">
      <div className="flex-1 min-w-[200px]">
        <Input
          placeholder="ค้นหาสินค้า..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <select
        value={categoryId}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="px-3 py-3 border rounded-lg dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white text-sm"
      >
        <option value="">ทุกหมวดหมู่</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => onFavoritesChange(!favoritesOnly)}
        className={`px-3 py-3 rounded-lg text-sm font-medium border transition-colors ${
          favoritesOnly
            ? 'bg-yellow-50 border-yellow-300 text-yellow-700 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-300'
            : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300'
        }`}
      >
        ★ รายการโปรด
      </button>
    </Card>
  );
}
