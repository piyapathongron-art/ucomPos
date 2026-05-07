'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { parseNum } from '@/lib/utils';
import type { ServiceType, ServiceStatus } from '@/types/domain';

type ServiceDetails = Record<string, string | number>;

interface ServiceFormData {
  name: string;
  cost: string;
  price: string;
  status: ServiceStatus;
  details: ServiceDetails;
}

interface ServiceFormProps {
  type: ServiceType;
  service?: {
    id: string;
    name: string;
    cost: number;
    price: number;
    status: ServiceStatus;
    details: Record<string, unknown> | null;
  } | null;
  onClose: () => void;
  onSaved: () => void;
}

const TYPE_LABELS: Record<ServiceType, string> = {
  REPAIR: 'ซ่อม',
  TOPUP: 'เติมเงิน',
  EXTENSION: 'ต่ออายุ',
};

const STATUS_OPTIONS: { value: ServiceStatus; label: string }[] = [
  { value: 'PENDING', label: 'รอดำเนินการ' },
  { value: 'COMPLETED', label: 'เสร็จแล้ว' },
  { value: 'CANCELLED', label: 'ยกเลิก' },
];

const CARRIERS = ['AIS', 'DTAC', 'TRUE', 'NT', 'MVNO', 'อื่นๆ'];

export function ServiceForm({ type, service, onClose, onSaved }: ServiceFormProps) {
  const isEdit = !!service;
  const isAdmin = useAuthStore((s) => s.user?.role === 'ADMIN');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<ServiceFormData>({
    name: service?.name ?? '',
    cost: service ? String(Number(service.cost)) : '0',
    price: service ? String(Number(service.price)) : '0',
    status: service?.status ?? 'PENDING',
    details: (service?.details as ServiceDetails) ?? {},
  });

  const setDetail = (key: string, val: string | number) =>
    setForm((f) => ({ ...f, details: { ...f.details, [key]: val } }));

  const profit = parseNum(form.price) - parseNum(form.cost);

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('กรุณากรอกชื่องาน');
      return;
    }
    setSaving(true);
    setError('');

    const body = {
      type,
      name: form.name.trim(),
      cost: parseNum(form.cost),
      price: parseNum(form.price),
      status: form.status,
      details: form.details,
    };

    const url = isEdit ? `/api/services/${service.id}` : '/api/services';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
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
    <Modal
      title={`${isEdit ? 'แก้ไข' : 'เพิ่ม'}รายการ${TYPE_LABELS[type]}`}
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        <Input
          label="ชื่องาน *"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder={
            type === 'REPAIR'
              ? 'เช่น iPhone 15 - แบต'
              : type === 'TOPUP'
              ? 'เช่น เติม AIS 100'
              : 'เช่น ต่ออายุ Samsung S25'
          }
        />

        {type === 'REPAIR' && (
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="รุ่นอุปกรณ์"
              value={String(form.details.device ?? '')}
              onChange={(e) => setDetail('device', e.target.value)}
              placeholder="iPhone 15 Pro"
            />
            <Input
              label="ชื่อลูกค้า"
              value={String(form.details.customer ?? '')}
              onChange={(e) => setDetail('customer', e.target.value)}
              placeholder="คุณสมชาย"
            />
            <Input
              label="เบอร์ติดต่อ"
              value={String(form.details.phone ?? '')}
              onChange={(e) => setDetail('phone', e.target.value)}
              placeholder="08x-xxx-xxxx"
            />
            <Input
              label="อาการ"
              value={String(form.details.issue ?? '')}
              onChange={(e) => setDetail('issue', e.target.value)}
              placeholder="แบตหมดเร็ว"
            />
          </div>
        )}

        {type === 'TOPUP' && (
          <div className="grid grid-cols-2 gap-3">
            <div className="w-full">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                ค่ายมือถือ
              </label>
              <select
                value={String(form.details.carrier ?? '')}
                onChange={(e) => setDetail('carrier', e.target.value)}
                className="w-full p-3 border rounded-lg dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"
              >
                <option value="">เลือกค่าย</option>
                {CARRIERS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="เบอร์ที่เติม"
              value={String(form.details.customerPhone ?? '')}
              onChange={(e) => setDetail('customerPhone', e.target.value)}
              placeholder="08x-xxx-xxxx"
            />
          </div>
        )}

        {type === 'EXTENSION' && (
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="รุ่นอุปกรณ์"
              value={String(form.details.device ?? '')}
              onChange={(e) => setDetail('device', e.target.value)}
              placeholder="Samsung Galaxy S25"
            />
            <Input
              label="ระยะเวลา"
              value={String(form.details.period ?? '')}
              onChange={(e) => setDetail('period', e.target.value)}
              placeholder="12 เดือน"
            />
            <Input
              label="ค่าคอมมิชชั่น"
              type="number"
              value={String(form.details.commission ?? '0')}
              onChange={(e) => setDetail('commission', parseNum(e.target.value))}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="ทุน (฿)"
            type="number"
            value={form.cost}
            onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
            min={0}
          />
          <Input
            label="ราคาขาย (฿)"
            type="number"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            min={0}
          />
        </div>

        {isAdmin && (
          <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 px-1">
            <span>กำไร</span>
            <span className={profit >= 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-red-500'}>
              ฿{profit.toLocaleString()}
            </span>
          </div>
        )}

        {isEdit && (
          <div className="w-full">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              สถานะ
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ServiceStatus }))}
              className="w-full p-3 border rounded-lg dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

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
