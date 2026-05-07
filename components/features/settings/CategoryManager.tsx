'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import { ConfirmModal } from '@/components/ui/Modal';
import { useUIStore } from '@/store/uiStore';

interface Category {
  id: string;
  name: string;
  description: string | null;
  order: number;
}

export function CategoryManager() {
  const showNotification = useUIStore((s) => s.showNotification);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (res.ok) setCategories(data.categories ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewName('');
        await load();
        showNotification('เพิ่มหมวดหมู่เรียบร้อย', 'success');
      } else {
        showNotification(data.error || 'เกิดข้อผิดพลาด', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (id: string) => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setEditingId(null);
        await load();
        showNotification('แก้ไขเรียบร้อย', 'success');
      } else {
        showNotification(data.error || 'เกิดข้อผิดพลาด', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      const res = await fetch(`/api/categories/${deletingId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        await load();
        showNotification('ลบเรียบร้อย', 'success');
      } else {
        showNotification(data.error || 'เกิดข้อผิดพลาด', 'error');
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-slate-800 dark:text-white">จัดการหมวดหมู่สินค้า</h3>

      {/* Add form */}
      <div className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="ชื่อหมวดหมู่ใหม่"
          className="flex-1 px-3 py-2 border rounded-lg text-sm dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Button onClick={handleAdd} disabled={saving || !newName.trim()}>
          <Icons.Plus className="w-4 h-4" />
          <span>เพิ่ม</span>
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-4">
          <Icons.Loader className="w-5 h-5 mx-auto text-slate-400" />
        </div>
      ) : categories.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-4">ยังไม่มีหมวดหมู่</p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-700 rounded-lg border dark:border-slate-700">
          {categories.map((cat) => (
            <li key={cat.id} className="flex items-center gap-2 px-3 py-2">
              <Icons.Tag className="w-4 h-4 text-slate-400 shrink-0" />
              {editingId === cat.id ? (
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleEdit(cat.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  className="flex-1 px-2 py-1 border rounded text-sm dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <span className="flex-1 text-sm text-slate-800 dark:text-white">{cat.name}</span>
              )}
              {editingId === cat.id ? (
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(cat.id)}
                    className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded"
                  >
                    <Icons.Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                  >
                    <Icons.X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-1">
                  <button
                    onClick={() => { setEditingId(cat.id); setEditName(cat.name); }}
                    className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                  >
                    <Icons.Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingId(cat.id)}
                    className="p-1 text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 rounded"
                  >
                    <Icons.Trash className="w-4 h-4" />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {deletingId && (
        <ConfirmModal
          title="ลบหมวดหมู่"
          message={`ต้องการลบหมวดหมู่ "${categories.find((c) => c.id === deletingId)?.name}" ใช่หรือไม่? สินค้าที่ใช้หมวดหมู่นี้จะถูกถอดออก`}
          confirmLabel="ลบ"
          onConfirm={handleDelete}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </div>
  );
}
