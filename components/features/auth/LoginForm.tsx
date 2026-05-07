'use client';

import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Icons } from '@/components/ui/Icons';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import type { LoginResponse } from '@/types/api';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);
  const isDarkMode = useUIStore((s) => s.isDarkMode);
  const toggleDarkMode = useUIStore((s) => s.toggleDarkMode);
  const showNotification = useUIStore((s) => s.showNotification);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'เข้าสู่ระบบไม่สำเร็จ');
        return;
      }

      const result = data as LoginResponse;
      setUser(result.user);
      showNotification(`ยินดีต้อนรับ ${result.user.name}`, 'success');

      const from = searchParams.get('from') || '/pos';
      router.push(from);
      router.refresh();
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-sm p-8 shadow-xl relative z-10 dark:shadow-slate-950/50 animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-400">
          <Icons.Smartphone className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
          เข้าสู่ระบบ
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">UcomPos System</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="ชื่อผู้ใช้"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoFocus
          required
          disabled={submitting}
        />

        <Input
          label="รหัสผ่าน"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          disabled={submitting}
        />

        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
            <Icons.AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button type="submit" disabled={submitting} fullWidth className="py-3 text-lg">
          {submitting ? (
            <>
              <Icons.Loader className="w-5 h-5" />
              <span>กำลังเข้าสู่ระบบ...</span>
            </>
          ) : (
            'เข้าสู่ระบบ'
          )}
        </Button>
      </form>

      <button
        type="button"
        onClick={toggleDarkMode}
        className="absolute top-4 right-4 p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        aria-label="Toggle dark mode"
      >
        {isDarkMode ? <Icons.Sun className="w-4 h-4" /> : <Icons.Moon className="w-4 h-4" />}
      </button>
    </Card>
  );
}
