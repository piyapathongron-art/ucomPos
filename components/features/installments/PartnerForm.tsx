'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface PartnerFormProps {
  partner?: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    notes: string | null;
  } | null;
  onClose: () => void;
  onSaved: () => void;
}

export function PartnerForm({ partner, onClose, onSaved }: PartnerFormProps) {
  const isEdit = !!partner;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: partner?.name ?? '',
    phone: partner?.phone ?? '',
    email: partner?.email ?? '',
    notes: partner?.notes ?? '',
  });

  const set = (key: keyof typeof form, val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('กรุณากรอกชื่อลูกค้า');
      return;
    }
    setSaving(true);
    setError('');

    const url = isEdit ? `/api/partners/${partner.id}` : '/api/partners';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim() || undefined,
          email: form.email.trim() || undefined,
          notes: form.notes.trim() || undefined,
        }),
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
    <Modal
      title={isEdit ? 'แก้ไขข้อมูลลูกค้า' : 'เพิ่มลูกค้าใหม่'}
      onClose={onClose}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <Input
          label="ชื่อลูกค้า *"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="ชื่อ-นามสกุล"
        />
        <Input
          label="เบอร์โทรศัพท์"
          value={form.phone}
          onChange={(e) => set('phone', e.target.value)}
          placeholder="08x-xxx-xxxx"
        />
        <Input
          label="อีเมล"
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
          placeholder="example@email.com"
        />
        <div className="w-full">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            หมายเหตุ
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            rows={3}
            placeholder="ข้อมูลเพิ่มเติม…"
            className="w-full p-3 border rounded-lg outline-none transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 dark:text-white border-slate-300 dark:border-slate-600 resize-none"
          />
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex gap-2 pt-2">
          <Button variant="outline" fullWidth onClick={onClose} disabled={saving}>
            ยกเลิก
          </Button>
          <Button fullWidth onClick={handleSubmit} disabled={saving}>
            {saving ? 'กำลังบันทึก…' : 'บันทึก'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
