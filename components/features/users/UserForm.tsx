'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PermissionSelector } from './PermissionSelector';

interface UserRecord {
  id: string;
  username: string;
  name: string;
  email: string | null;
  role: 'ADMIN' | 'STAFF';
  permissions: string[];
  isActive: boolean;
}

interface UserFormProps {
  user?: UserRecord | null;
  onClose: () => void;
  onSaved: () => void;
}

export function UserForm({ user, onClose, onSaved }: UserFormProps) {
  const isEdit = !!user;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    username: user?.username ?? '',
    name: user?.name ?? '',
    email: user?.email ?? '',
    password: '',
    role: (user?.role ?? 'STAFF') as 'ADMIN' | 'STAFF',
    permissions: user?.permissions ?? [],
  });

  const set = <K extends keyof typeof form>(key: K, val: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('กรุณากรอกชื่อ'); return; }
    if (!isEdit && !form.username.trim()) { setError('กรุณากรอกชื่อผู้ใช้'); return; }
    if (!isEdit && !form.password) { setError('กรุณากรอกรหัสผ่าน'); return; }

    setSaving(true);
    setError('');

    const url = isEdit ? `/api/users/${user.id}` : '/api/users';
    const method = isEdit ? 'PUT' : 'POST';
    const body: Record<string, unknown> = {
      name: form.name.trim(),
      role: form.role,
      permissions: form.permissions,
      email: form.email.trim() || undefined,
    };
    if (!isEdit) {
      body.username = form.username.trim();
      body.password = form.password;
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'บันทึกไม่สำเร็จ'); return; }
      onSaved();
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={isEdit ? `แก้ไขผู้ใช้ — ${user.username}` : 'เพิ่มผู้ใช้ใหม่'}
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        {!isEdit && (
          <Input
            label="ชื่อผู้ใช้ *"
            value={form.username}
            onChange={(e) => set('username', e.target.value)}
            placeholder="username (ใช้ login)"
          />
        )}
        <Input
          label="ชื่อ-นามสกุล *"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="ชื่อที่แสดงในระบบ"
        />
        <Input
          label="อีเมล"
          type="email"
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
          placeholder="example@email.com"
        />
        {!isEdit && (
          <Input
            label="รหัสผ่าน *"
            type="password"
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            placeholder="อย่างน้อย 4 ตัวอักษร"
          />
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            บทบาท
          </label>
          <div className="flex gap-3">
            {(['ADMIN', 'STAFF'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => set('role', r)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  form.role === r
                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {r === 'ADMIN' ? 'ผู้ดูแลระบบ' : 'พนักงาน'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            สิทธิ์การใช้งาน
          </label>
          <PermissionSelector
            value={form.permissions}
            onChange={(perms) => set('permissions', perms)}
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
