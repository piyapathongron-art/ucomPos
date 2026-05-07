'use client';

import { useState, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/store/uiStore';
import type { Product } from '@/types/domain';

interface Category {
  id: string;
  name: string;
}

interface Props {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}

export function ProductForm({ product, categories, onClose, onSaved }: Props) {
  const isEdit = !!product;
  const showNotification = useUIStore((s) => s.showNotification);

  const [form, setForm] = useState({
    productId: product?.productId || '',
    name: product?.name || '',
    categoryId: product?.categoryId || '',
    qty: product ? String(product.qty) : '0',
    cost: product ? String(product.cost) : '0',
    price: product ? String(product.price) : '0',
    isFavorite: product?.isFavorite ?? false,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      productId: form.productId,
      name: form.name,
      categoryId: form.categoryId || null,
      qty: parseInt(form.qty || '0', 10),
      cost: parseFloat(form.cost || '0'),
      price: parseFloat(form.price || '0'),
      isFavorite: form.isFavorite,
    };

    const url = isEdit ? `/api/inventory/${product!.id}` : '/api/inventory';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setSubmitting(false);

    if (res.ok) {
      onSaved();
    } else {
      const data = await res.json();
      showNotification(data.error || 'บันทึกไม่สำเร็จ', 'error');
    }
  };

  return (
    <Modal title={isEdit ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          label="รหัสสินค้า"
          value={form.productId}
          onChange={(e) => setForm({ ...form, productId: e.target.value })}
          required
          disabled={submitting || isEdit}
          placeholder="P-0001"
        />
        <Input
          label="ชื่อสินค้า"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          disabled={submitting}
        />
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            หมวดหมู่
          </label>
          <select
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            className="w-full p-3 border rounded-lg dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"
            disabled={submitting}
          >
            <option value="">ไม่ระบุหมวดหมู่</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Input
            label="จำนวน"
            type="number"
            value={form.qty}
            onChange={(e) => setForm({ ...form, qty: e.target.value })}
            disabled={submitting}
          />
          <Input
            label="ทุน (บาท)"
            type="number"
            step="0.01"
            value={form.cost}
            onChange={(e) => setForm({ ...form, cost: e.target.value })}
            disabled={submitting}
          />
          <Input
            label="ราคาขาย (บาท)"
            type="number"
            step="0.01"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            disabled={submitting}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
          <input
            type="checkbox"
            checked={form.isFavorite}
            onChange={(e) => setForm({ ...form, isFavorite: e.target.checked })}
            disabled={submitting}
            className="w-4 h-4"
          />
          เพิ่มเป็นรายการโปรด
        </label>

        <div className="flex gap-2 pt-2">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
            className="flex-1"
          >
            ยกเลิก
          </Button>
          <Button type="submit" disabled={submitting} className="flex-1">
            {submitting ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
