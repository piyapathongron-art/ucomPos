'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Icons } from '@/components/ui/Icons';
import { ConfirmModal } from '@/components/ui/Modal';
import { ProductForm } from './ProductForm';
import { BulkImport } from './BulkImport';
import { useUIStore } from '@/store/uiStore';
import { useDebounce } from '@/hooks/useDebounce';
import { formatBaht } from '@/lib/utils';
import type { Product } from '@/types/domain';

interface Category {
  id: string;
  name: string;
}

export function StockView() {
  const showNotification = useUIStore((s) => s.showNotification);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('q', debouncedSearch);
      if (categoryFilter) params.set('categoryId', categoryFilter);
      const res = await fetch(`/api/inventory?${params.toString()}`);
      const data = await res.json();
      if (res.ok) setProducts(data.products);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    const res = await fetch('/api/categories');
    const data = await res.json();
    if (res.ok) setCategories(data.categories);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [debouncedSearch, categoryFilter]);

  const handleSave = async () => {
    setEditing(null);
    setShowAddForm(false);
    await loadProducts();
    showNotification('บันทึกสินค้าเรียบร้อย', 'success');
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const res = await fetch(`/api/inventory/${confirmDelete.id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      showNotification('ลบสินค้าเรียบร้อย', 'success');
      setConfirmDelete(null);
      await loadProducts();
    } else {
      const data = await res.json();
      showNotification(data.error || 'ลบไม่สำเร็จ', 'error');
    }
  };

  const toggleFavorite = async (p: Product) => {
    await fetch(`/api/inventory/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isFavorite: !p.isFavorite }),
    });
    await loadProducts();
  };

  const stats = useMemo(() => {
    const total = products.length;
    const lowStock = products.filter((p) => p.qty < 5).length;
    const totalValue = products.reduce(
      (sum, p) => sum + Number(p.cost) * p.qty,
      0
    );
    return { total, lowStock, totalValue };
  }, [products]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            จัดการสต็อก
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            สินค้าทั้งหมด {stats.total} รายการ · สต็อกน้อย {stats.lowStock} ·
            มูลค่ารวม {formatBaht(stats.totalValue)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowBulkImport(true)}>
            <Icons.Package className="w-4 h-4" />
            <span>นำเข้า JSON</span>
          </Button>
          <Button onClick={() => setShowAddForm(true)}>
            <Icons.Package className="w-4 h-4" />
            <span>เพิ่มสินค้า</span>
          </Button>
        </div>
      </div>

      <Card className="p-4 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="ค้นหาชื่อหรือรหัสสินค้า"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-3 border rounded-lg dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"
        >
          <option value="">ทุกหมวดหมู่</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-850">
              <tr className="text-left text-slate-600 dark:text-slate-300">
                <th className="px-4 py-3 font-semibold w-10"></th>
                <th className="px-4 py-3 font-semibold">รหัส</th>
                <th className="px-4 py-3 font-semibold">ชื่อสินค้า</th>
                <th className="px-4 py-3 font-semibold">หมวดหมู่</th>
                <th className="px-4 py-3 font-semibold text-right">จำนวน</th>
                <th className="px-4 py-3 font-semibold text-right">ทุน</th>
                <th className="px-4 py-3 font-semibold text-right">ราคาขาย</th>
                <th className="px-4 py-3 font-semibold text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    <Icons.Loader className="w-5 h-5 mx-auto" />
                  </td>
                </tr>
              )}
              {!loading && products.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    ไม่พบสินค้า
                  </td>
                </tr>
              )}
              {products.map((p) => (
                <tr
                  key={p.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-750"
                >
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleFavorite(p)}
                      className={
                        p.isFavorite
                          ? 'text-yellow-500'
                          : 'text-slate-300 dark:text-slate-600'
                      }
                      title={p.isFavorite ? 'ยกเลิกรายการโปรด' : 'เพิ่มเป็นรายการโปรด'}
                    >
                      ★
                    </button>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{p.productId}</td>
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">
                    {p.name}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {p.category?.name || '-'}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-semibold ${
                      p.qty < 5 ? 'text-red-600 dark:text-red-400' : ''
                    }`}
                  >
                    {p.qty}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500">
                    {formatBaht(Number(p.cost))}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {formatBaht(Number(p.price))}
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <button
                      onClick={() => setEditing(p)}
                      className="px-2 py-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                    >
                      แก้ไข
                    </button>
                    <button
                      onClick={() => setConfirmDelete(p)}
                      className="px-2 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {(editing || showAddForm) && (
        <ProductForm
          product={editing}
          categories={categories}
          onClose={() => {
            setEditing(null);
            setShowAddForm(false);
          }}
          onSaved={handleSave}
        />
      )}

      {showBulkImport && (
        <BulkImport
          categories={categories}
          onClose={() => setShowBulkImport(false)}
          onImported={async (count) => {
            setShowBulkImport(false);
            await loadProducts();
            showNotification(`นำเข้า ${count} รายการสำเร็จ`, 'success');
          }}
        />
      )}

      {confirmDelete && (
        <ConfirmModal
          title="ลบสินค้า"
          message={`ต้องการลบ "${confirmDelete.name}" ใช่หรือไม่?`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
