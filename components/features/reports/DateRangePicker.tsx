'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

type Preset = 'today' | 'week' | 'month' | 'custom';

export interface DateRange {
  from: string;
  to: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

function todayRange(): DateRange {
  const today = new Date().toISOString().slice(0, 10);
  return { from: today, to: today };
}

function weekRange(): DateRange {
  const now = new Date();
  const day = now.getDay();
  const mon = new Date(now);
  mon.setDate(now.getDate() - ((day + 6) % 7));
  return {
    from: mon.toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
  };
}

function monthRange(): DateRange {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    from: first.toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
  };
}

const PRESETS: { key: Preset; label: string }[] = [
  { key: 'today', label: 'วันนี้' },
  { key: 'week', label: 'สัปดาห์นี้' },
  { key: 'month', label: 'เดือนนี้' },
  { key: 'custom', label: 'กำหนดเอง' },
];

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [preset, setPreset] = useState<Preset>('today');

  const apply = (p: Preset) => {
    setPreset(p);
    if (p === 'today') onChange(todayRange());
    else if (p === 'week') onChange(weekRange());
    else if (p === 'month') onChange(monthRange());
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((p) => (
        <Button
          key={p.key}
          variant={preset === p.key ? 'primary' : 'outline'}
          className="px-3 py-1.5 text-sm"
          onClick={() => apply(p.key)}
        >
          {p.label}
        </Button>
      ))}
      {preset === 'custom' && (
        <div className="flex items-center gap-2 ml-1">
          <input
            type="date"
            value={value.from}
            onChange={(e) => onChange({ ...value, from: e.target.value })}
            className="px-2 py-1.5 border rounded-lg text-sm dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"
          />
          <span className="text-slate-500 text-sm">ถึง</span>
          <input
            type="date"
            value={value.to}
            onChange={(e) => onChange({ ...value, to: e.target.value })}
            className="px-2 py-1.5 border rounded-lg text-sm dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"
          />
        </div>
      )}
    </div>
  );
}
