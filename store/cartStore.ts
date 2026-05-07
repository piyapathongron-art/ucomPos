import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, PaymentMethod } from '@/types/domain';

interface CartState {
  items: CartItem[];
  billDiscount: number;
  paymentMethod: PaymentMethod;
  notes: string;

  addItem: (item: Omit<CartItem, 'id'>) => void;
  updateItem: (id: string, patch: Partial<CartItem>) => void;
  removeItem: (id: string) => void;
  setBillDiscount: (amount: number) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setNotes: (notes: string) => void;
  clear: () => void;

  subtotal: () => number;
  totalItemDiscount: () => number;
  total: () => number;
  totalCost: () => number;
  profit: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      billDiscount: 0,
      paymentMethod: 'CASH',
      notes: '',

      addItem: (item) =>
        set((s) => ({
          items: [...s.items, { ...item, id: Math.random().toString(36).slice(2) }],
        })),

      updateItem: (id, patch) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
        })),

      removeItem: (id) =>
        set((s) => ({
          items: s.items.filter((i) => i.id !== id),
        })),

      setBillDiscount: (amount) => set({ billDiscount: amount }),
      setPaymentMethod: (method) => set({ paymentMethod: method }),
      setNotes: (notes) => set({ notes }),

      clear: () =>
        set({
          items: [],
          billDiscount: 0,
          paymentMethod: 'CASH',
          notes: '',
        }),

      subtotal: () => {
        const { items } = get();
        return items.reduce((sum, i) => sum + i.price * i.qty, 0);
      },

      totalItemDiscount: () => {
        const { items } = get();
        return items.reduce((sum, i) => sum + i.itemDiscount, 0);
      },

      total: () => {
        const { items, billDiscount } = get();
        const sub = items.reduce(
          (sum, i) => sum + i.price * i.qty - i.itemDiscount,
          0
        );
        return Math.max(0, sub - billDiscount);
      },

      totalCost: () => {
        const { items } = get();
        return items.reduce((sum, i) => sum + i.cost * i.qty, 0);
      },

      profit: () => {
        const { total, totalCost } = get();
        return total() - totalCost();
      },
    }),
    {
      name: 'ucompos-cart',
    }
  )
);
