'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { UserForm } from './UserForm';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { PERMISSION_LABELS } from '@/lib/constants';
import { formatThaiDate } from '@/lib/utils';

interface UserRecord {
  id: string;
  username: string;
  name: string;
  email: string | null;
  role: 'ADMIN' | 'STAFF';
  permissions: string[];
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

function ChangePasswordModal({
  user,
  onClose,
  onSaved,
}: {
  user: UserRecord;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (newPassword.length < 4) { setError('รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/users/${user.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
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
    <Modal title={`เปลี่ยนรหัสผ่าน — ${user.username}`} onClose={onClose} maxWidth="max-w-sm">
      <div className="space-y-4">
        <Input
          label="รหัสผ่านใหม่ *"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="อย่างน้อย 4 ตัวอักษร"
        />
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" fullWidth onClick={onClose} disabled={saving}>ยกเลิก</Button>
          <Button fullWidth onClick={handleSubmit} disabled={saving}>
            {saving ? 'กำลังบันทึก…' : 'เปลี่ยนรหัสผ่าน'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function UsersView() {
  const showNotification = useUIStore((s) => s.showNotification);
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<UserRecord | null>(null);
  const [changingPassword, setChangingPassword] = useState<UserRecord | null>(null);
  const [deactivating, setDeactivating] = useState<UserRecord | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (res.ok) setUsers(data.users ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDeactivate = async () => {
    if (!deactivating) return;
    try {
      const res = await fetch(`/api/users/${deactivating.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        showNotification('ปิดบัญชีเรียบร้อย', 'success');
        await load();
      } else {
        showNotification(data.error || 'เกิดข้อผิดพลาด', 'error');
      }
    } catch {
      showNotification('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
    } finally {
      setDeactivating(null);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">จัดการผู้ใช้</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            ทั้งหมด {users.length} บัญชี
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Icons.UserPlus className="w-4 h-4" />
          <span>เพิ่มผู้ใช้</span>
        </Button>
      </div>

      <Card className="p-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อหรือ username"
          className="w-full px-3 py-2.5 border rounded-lg text-sm dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
        />
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-850">
              <tr className="text-left text-slate-600 dark:text-slate-300">
                <th className="px-4 py-3 font-semibold">ชื่อ</th>
                <th className="px-4 py-3 font-semibold">Username</th>
                <th className="px-4 py-3 font-semibold">บทบาท</th>
                <th className="px-4 py-3 font-semibold">สิทธิ์</th>
                <th className="px-4 py-3 font-semibold">Login ล่าสุด</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    <Icons.Loader className="w-5 h-5 mx-auto" />
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    {search ? 'ไม่พบผู้ใช้ที่ค้นหา' : 'ยังไม่มีข้อมูลผู้ใช้'}
                  </td>
                </tr>
              )}
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-750">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800 dark:text-white">{u.name}</p>
                    {u.email && (
                      <p className="text-xs text-slate-400">{u.email}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                    {u.username}
                    {u.id === currentUserId && (
                      <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">คุณ</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        u.role === 'ADMIN'
                          ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {u.role === 'ADMIN' ? 'ผู้ดูแล' : 'พนักงาน'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.permissions.slice(0, 3).map((p) => (
                        <span
                          key={p}
                          className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded"
                        >
                          {PERMISSION_LABELS[p as keyof typeof PERMISSION_LABELS] ?? p}
                        </span>
                      ))}
                      {u.permissions.length > 3 && (
                        <span className="text-xs text-slate-400">+{u.permissions.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">
                    {u.lastLoginAt ? formatThaiDate(u.lastLoginAt) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => setEditing(u)}
                        className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
                        title="แก้ไข"
                      >
                        <Icons.Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setChangingPassword(u)}
                        className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
                        title="เปลี่ยนรหัสผ่าน"
                      >
                        <Icons.Lock className="w-4 h-4" />
                      </button>
                      {u.id !== currentUserId && (
                        <button
                          onClick={() => setDeactivating(u)}
                          className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600"
                          title="ปิดบัญชี"
                        >
                          <Icons.Trash className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {(showForm || editing) && (
        <UserForm
          user={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={async () => {
            setShowForm(false);
            setEditing(null);
            await load();
            showNotification('บันทึกเรียบร้อย', 'success');
          }}
        />
      )}

      {changingPassword && (
        <ChangePasswordModal
          user={changingPassword}
          onClose={() => setChangingPassword(null)}
          onSaved={async () => {
            setChangingPassword(null);
            showNotification('เปลี่ยนรหัสผ่านเรียบร้อย', 'success');
          }}
        />
      )}

      {deactivating && (
        <ConfirmModal
          title="ปิดบัญชีผู้ใช้"
          message={`ต้องการปิดบัญชี "${deactivating.name}" (${deactivating.username}) ใช่หรือไม่?`}
          confirmLabel="ปิดบัญชี"
          onConfirm={handleDeactivate}
          onCancel={() => setDeactivating(null)}
        />
      )}
    </div>
  );
}
