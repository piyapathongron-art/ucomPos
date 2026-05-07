'use client';

import { ALL_PERMISSIONS, PERMISSION_LABELS } from '@/lib/constants';

interface PermissionSelectorProps {
  value: string[];
  onChange: (v: string[]) => void;
  disabled?: boolean;
}

export function PermissionSelector({ value, onChange, disabled }: PermissionSelectorProps) {
  const toggle = (perm: string) => {
    if (value.includes(perm)) {
      onChange(value.filter((p) => p !== perm));
    } else {
      onChange([...value, perm]);
    }
  };

  const all = ALL_PERMISSIONS.every((p) => value.includes(p));
  const toggleAll = () => {
    onChange(all ? [] : [...ALL_PERMISSIONS]);
  };

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 cursor-pointer pb-1 border-b dark:border-slate-600">
        <input
          type="checkbox"
          checked={all}
          onChange={toggleAll}
          disabled={disabled}
          className="w-4 h-4 rounded border-slate-300 text-blue-600 accent-blue-600"
        />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">เลือกทั้งหมด</span>
      </label>
      <div className="grid grid-cols-2 gap-y-2 gap-x-4">
        {ALL_PERMISSIONS.map((perm) => (
          <label key={perm} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.includes(perm)}
              onChange={() => toggle(perm)}
              disabled={disabled}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 accent-blue-600"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">
              {PERMISSION_LABELS[perm]}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
