'use client';

import { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import { useAuthStore } from '@/store/authStore';
import { parseNum, formatBaht } from '@/lib/utils';
import type { InstallmentMode } from '@/types/domain';

interface ProductLite {
  id: number;
  productId: string;
  name: string;
  qty: number;
  cost: number | string;
  price: number | string;
  category?: { name: string } | null;
}

interface CategoryLite {
  id: string;
  name: string;
}

interface InstallmentFormProps {
  onClose: () => void;
  onSaved: () => void;
}

type SourceMode = 'EXISTING' | 'MANUAL';

export function InstallmentForm({ onClose, onSaved }: InstallmentFormProps) {
  const isAdmin = useAuthStore((s) => s.user?.role === 'ADMIN');

  const [mode, setMode] = useState<InstallmentMode>('CONSIGNMENT');
  const [sourceMode, setSourceMode] = useState<SourceMode>('EXISTING');

  const [products, setProducts] = useState<ProductLite[]>([]);
  const [categories, setCategories] = useState<CategoryLite[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  const [manual, setManual] = useState({
    productId: '',
    name: '',
    categoryId: '',
    cost: '0',
    price: '0',
  });

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [totalAmount, setTotalAmount] = useState('0');
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/inventory')
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []));
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []));
  }, []);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId) ?? null,
    [products, selectedProductId]
  );

  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase();
    return products
      .filter((p) => p.qty > 0)
      .filter(
        (p) =>
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.productId.toLowerCase().includes(q)
      )
      .slice(0, 30);
  }, [products, productSearch]);

  const basePrice = selectedProduct
    ? Number(selectedProduct.price)
    : sourceMode === 'MANUAL'
    ? parseNum(manual.price)
    : 0;
  const cost = selectedProduct
    ? Number(selectedProduct.cost)
    : sourceMode === 'MANUAL'
    ? parseNum(manual.cost)
    : 0;

  // Sync editable totalAmount with basePrice when SELF_MANAGED selected
  useEffect(() => {
    if (mode === 'SELF_MANAGED') {
      setTotalAmount(String(basePrice));
    }
  }, [mode, basePrice]);

  const totalNum = parseNum(totalAmount);
  const profitPreview =
    mode === 'SELF_MANAGED' ? totalNum - cost : 0;

  const handleSubmit = async () => {
    setError('');
    if (sourceMode === 'EXISTING' && !selectedProduct) {
      setError('กรุณาเลือกเครื่องจากสต็อก');
      return;
    }
    if (sourceMode === 'MANUAL') {
      if (!manual.productId.trim() || !manual.name.trim()) {
        setError('กรุณากรอกรหัสและชื่อเครื่อง');
        return;
      }
    }
    if (!customerName.trim()) {
      setError('กรุณากรอกชื่อลูกค้า');
      return;
    }
    if (mode === 'SELF_MANAGED' && totalNum <= 0) {
      setError('กรุณาระบุยอดรวมที่ลูกค้าต้องจ่าย');
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        mode,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || null,
        customerNote: customerNote.trim() || null,
        notes: notes.trim() || null,
      };
      if (sourceMode === 'EXISTING') {
        body.productId = selectedProduct!.id;
      } else {
        body.manualProduct = {
          productId: manual.productId.trim(),
          name: manual.name.trim(),
          categoryId: manual.categoryId || null,
          cost: parseNum(manual.cost),
          price: parseNum(manual.price),
        };
      }
      if (mode === 'SELF_MANAGED') {
        body.totalAmount = totalNum;
      }

      const res = await fetch('/api/installments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'บันทึกไม่สำเร็จ');
        return;
      }
      onSaved();
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="สร้างบิลผ่อน" onClose={onClose} maxWidth="max-w-2xl">
      <div className="space-y-4">
        {/* Mode picker */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            รูปแบบการผ่อน
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode('CONSIGNMENT')}
              className={`p-3 border rounded-lg text-left transition-colors ${
                mode === 'CONSIGNMENT'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <div className="font-semibold text-slate-800 dark:text-white">
                ฝากผ่อน
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                รอรับคอมมิชชันจากร้านส่ง
              </div>
            </button>
            <button
              type="button"
              onClick={() => setMode('SELF_MANAGED')}
              className={`p-3 border rounded-lg text-left transition-colors ${
                mode === 'SELF_MANAGED'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <div className="font-semibold text-slate-800 dark:text-white">
                ผ่อนเอง
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                ร้านรับชำระค่างวดเอง
              </div>
            </button>
          </div>
        </div>

        {/* Source picker */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            เครื่อง
          </label>
          <div className="flex gap-2 mb-2">
            <button
              type="button"
              onClick={() => setSourceMode('EXISTING')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm border transition-colors ${
                sourceMode === 'EXISTING'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'border-slate-200 dark:border-slate-600'
              }`}
            >
              เลือกจากสต็อก
            </button>
            <button
              type="button"
              onClick={() => setSourceMode('MANUAL')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm border transition-colors ${
                sourceMode === 'MANUAL'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'border-slate-200 dark:border-slate-600'
              }`}
            >
              + เพิ่มเครื่องใหม่
            </button>
          </div>

          {sourceMode === 'EXISTING' ? (
            <div className="space-y-2">
              <Input
                placeholder="ค้นหาชื่อหรือรหัส"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
              <div className="max-h-48 overflow-y-auto border rounded-lg dark:border-slate-600">
                {filteredProducts.length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-400">
                    ไม่พบสินค้าที่มีในสต็อก
                  </div>
                ) : (
                  filteredProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedProductId(p.id)}
                      className={`w-full px-3 py-2 text-left border-b last:border-b-0 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 ${
                        selectedProductId === p.id
                          ? 'bg-blue-50 dark:bg-blue-900/20'
                          : ''
                      }`}
                    >
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-slate-800 dark:text-white">
                          {p.name}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">
                          {formatBaht(Number(p.price))}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        {p.productId} · คงเหลือ {p.qty}
                      </div>
                    </button>
                  ))
                )}
              </div>
              {selectedProduct && (
                <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-900/20 text-xs text-emerald-700 dark:text-emerald-400">
                  เลือก: {selectedProduct.name} (ราคา{' '}
                  {formatBaht(Number(selectedProduct.price))})
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="รหัสเครื่อง *"
                value={manual.productId}
                onChange={(e) =>
                  setManual((m) => ({ ...m, productId: e.target.value }))
                }
                placeholder="P-XXXX หรือ IMEI"
              />
              <Input
                label="ชื่อเครื่อง *"
                value={manual.name}
                onChange={(e) =>
                  setManual((m) => ({ ...m, name: e.target.value }))
                }
                placeholder="iPhone 15 Pro 256GB"
              />
              <div className="w-full">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  หมวดหมู่
                </label>
                <select
                  value={manual.categoryId}
                  onChange={(e) =>
                    setManual((m) => ({ ...m, categoryId: e.target.value }))
                  }
                  className="w-full p-3 border rounded-lg dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"
                >
                  <option value="">- เลือก -</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="ทุน (฿)"
                type="number"
                value={manual.cost}
                onChange={(e) =>
                  setManual((m) => ({ ...m, cost: e.target.value }))
                }
                min={0}
              />
              <Input
                label="ราคาขาย (฿)"
                type="number"
                value={manual.price}
                onChange={(e) =>
                  setManual((m) => ({ ...m, price: e.target.value }))
                }
                min={0}
              />
            </div>
          )}
        </div>

        {/* Customer */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="ชื่อลูกค้า *"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
          <Input
            label="เบอร์ติดต่อ"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="08x-xxx-xxxx"
          />
        </div>
        <Input
          label="หมายเหตุลูกค้า"
          value={customerNote}
          onChange={(e) => setCustomerNote(e.target.value)}
          placeholder="ที่อยู่/เลขบัตร/เงื่อนไข"
        />

        {/* SELF_MANAGED total amount */}
        {mode === 'SELF_MANAGED' && (
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-850 border dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>ราคาขายปัจจุบัน</span>
              <span className="font-mono">{formatBaht(basePrice)}</span>
            </div>
            <Input
              label="ยอดรวมที่ลูกค้าต้องจ่าย (รวมดอก) *"
              type="number"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              min={0}
            />
            {isAdmin && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">กำไรเต็มบิล (ถ้าจ่ายครบ)</span>
                <span
                  className={
                    profitPreview >= 0
                      ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                      : 'text-red-500'
                  }
                >
                  {formatBaht(profitPreview)}
                </span>
              </div>
            )}
          </div>
        )}

        <Input
          label="หมายเหตุบิล"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex gap-2 pt-2">
          <Button variant="outline" fullWidth onClick={onClose} disabled={saving}>
            ยกเลิก
          </Button>
          <Button fullWidth onClick={handleSubmit} disabled={saving}>
            {saving ? 'กำลังบันทึก…' : 'ยืนยัน (ตัดสต็อก)'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
