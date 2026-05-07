'use client';

import { useEffect, useState } from 'react';
import { ProductSearch } from './ProductSearch';
import { ProductGrid } from './ProductGrid';
import { CartSummary } from './CartSummary';
import { CheckoutForm } from './CheckoutForm';
import { useCartStore } from '@/store/cartStore';
import { useUIStore } from '@/store/uiStore';
import type { Product } from '@/types/domain';

interface Category {
  id: string;
  name: string;
}

export function POSView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);

  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const showNotification = useUIStore((s) => s.showNotification);

  const loadProducts = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (categoryId) params.set('categoryId', categoryId);
    if (favoritesOnly) params.set('favorites', '1');
    try {
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
    const t = setTimeout(loadProducts, 200);
    return () => clearTimeout(t);
  }, [search, categoryId, favoritesOnly]);

  const handleAddToCart = (p: Product) => {
    if (p.qty <= 0) {
      showNotification(`${p.name} หมดสต็อก`, 'warning');
      return;
    }
    addItem({
      productId: p.id,
      productName: p.name,
      productCode: p.productId,
      qty: 1,
      cost: Number(p.cost),
      price: Number(p.price),
      itemDiscount: 0,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4 h-full">
      <div className="space-y-3 min-h-0 flex flex-col">
        <ProductSearch
          search={search}
          onSearchChange={setSearch}
          categoryId={categoryId}
          onCategoryChange={setCategoryId}
          categories={categories}
          favoritesOnly={favoritesOnly}
          onFavoritesChange={setFavoritesOnly}
        />
        <div className="flex-1 overflow-y-auto">
          <ProductGrid
            products={products}
            loading={loading}
            onAdd={handleAddToCart}
          />
        </div>
      </div>

      <div className="lg:sticky lg:top-0 lg:self-start lg:max-h-[calc(100vh-8rem)] flex flex-col">
        <CartSummary onCheckout={() => setShowCheckout(true)} />
      </div>

      {showCheckout && (
        <CheckoutForm
          onClose={() => setShowCheckout(false)}
          onCompleted={async () => {
            // Don't close — CheckoutForm transitions to receipt stage internally.
            // Just refresh stock counts and notify.
            await loadProducts();
            showNotification('บันทึกการขายเรียบร้อย', 'success');
          }}
        />
      )}
    </div>
  );
}
