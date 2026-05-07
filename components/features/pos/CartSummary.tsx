'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { formatBaht } from '@/lib/utils';

interface Props {
  onCheckout: () => void;
}

export function CartSummary({ onCheckout }: Props) {
  const items = useCartStore((s) => s.items);
  const billDiscount = useCartStore((s) => s.billDiscount);
  const setBillDiscount = useCartStore((s) => s.setBillDiscount);
  const updateItem = useCartStore((s) => s.updateItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const clear = useCartStore((s) => s.clear);
  const subtotal = useCartStore((s) => s.subtotal);
  const total = useCartStore((s) => s.total);
  const profit = useCartStore((s) => s.profit);
  const totalItemDiscount = useCartStore((s) => s.totalItemDiscount);
  const isAdmin = useAuthStore((s) => s.user?.role === 'ADMIN');

  return (
    <Card className="flex flex-col h-full max-h-full">
      <div className="p-4 border-b dark:border-slate-700 flex items-center justify-between">
        <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Icons.ShoppingCart className="w-5 h-5" />
          ตะกร้า ({items.length})
        </h2>
        {items.length > 0 && (
          <button
            onClick={clear}
            className="text-xs text-red-600 dark:text-red-400 hover:underline"
          >
            ล้าง
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[200px]">
        {items.length === 0 && (
          <div className="text-center text-slate-400 py-8 text-sm">
            ยังไม่มีสินค้า
          </div>
        )}

        {items.map((item) => (
          <div
            key={item.id}
            className="p-3 rounded-lg bg-slate-50 dark:bg-slate-750 border border-slate-100 dark:border-slate-700"
          >
            <div className="flex justify-between gap-2 mb-2">
              <div className="min-w-0">
                <div className="font-medium text-sm text-slate-800 dark:text-white truncate">
                  {item.productName}
                </div>
                {item.productCode && (
                  <div className="text-xs text-slate-400 font-mono">
                    {item.productCode}
                  </div>
                )}
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="text-red-500 hover:text-red-700 shrink-0"
                aria-label="ลบ"
              >
                <Icons.X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    updateItem(item.id, { qty: Math.max(1, item.qty - 1) })
                  }
                  className="w-7 h-7 rounded bg-white dark:bg-slate-700 border dark:border-slate-600"
                >
                  −
                </button>
                <input
                  type="number"
                  value={item.qty}
                  onChange={(e) =>
                    updateItem(item.id, {
                      qty: Math.max(1, parseInt(e.target.value || '1', 10)),
                    })
                  }
                  className="w-14 text-center p-1 border rounded dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"
                />
                <button
                  onClick={() => updateItem(item.id, { qty: item.qty + 1 })}
                  className="w-7 h-7 rounded bg-white dark:bg-slate-700 border dark:border-slate-600"
                >
                  +
                </button>
              </div>
              <div className="ml-auto font-semibold">
                {formatBaht(item.price * item.qty - item.itemDiscount)}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
              <span>ส่วนลดรายการ:</span>
              <input
                type="number"
                value={item.itemDiscount}
                onChange={(e) =>
                  updateItem(item.id, {
                    itemDiscount: parseFloat(e.target.value || '0'),
                  })
                }
                className="flex-1 p-1 border rounded dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white text-right"
                min="0"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="border-t dark:border-slate-700 p-4 space-y-2">
        <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
          <span>ยอดรวมก่อนส่วนลด</span>
          <span>{formatBaht(subtotal())}</span>
        </div>
        {totalItemDiscount() > 0 && (
          <div className="flex justify-between text-sm text-orange-600 dark:text-orange-400">
            <span>ส่วนลดรายการ</span>
            <span>-{formatBaht(totalItemDiscount())}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">ส่วนลดท้ายบิล</span>
          <input
            type="number"
            value={billDiscount}
            onChange={(e) => setBillDiscount(parseFloat(e.target.value || '0'))}
            className="w-24 p-1 border rounded dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white text-right"
            min="0"
          />
        </div>
        <div className="flex justify-between text-lg font-bold pt-2 border-t dark:border-slate-700">
          <span className="text-slate-800 dark:text-white">รวมสุทธิ</span>
          <span className="text-blue-600 dark:text-blue-400">
            {formatBaht(total())}
          </span>
        </div>
        {isAdmin && (
          <div className="flex justify-between text-xs text-green-600 dark:text-green-400">
            <span>กำไรประมาณ</span>
            <span>{formatBaht(profit())}</span>
          </div>
        )}

        <Button
          onClick={onCheckout}
          disabled={items.length === 0}
          fullWidth
          className="mt-2 py-3"
        >
          ชำระเงิน
        </Button>
      </div>
    </Card>
  );
}
