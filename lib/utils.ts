import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Conditionally combine Tailwind class names with conflict resolution */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Safely parse number strings; returns 0 for invalid input */
export function parseNum(val: unknown): number {
  if (val === null || val === undefined || val === '') return 0;
  const num = typeof val === 'number' ? val : parseFloat(String(val));
  return isNaN(num) ? 0 : num;
}

/** Safely parse a date; returns current date for invalid input */
export function getSafeDate(dateStr: unknown): Date {
  if (!dateStr) return new Date();
  const date = new Date(dateStr as string);
  return isNaN(date.getTime()) ? new Date() : date;
}

/** Format number as Thai Baht currency */
export function formatBaht(amount: number | string): string {
  const num = parseNum(amount);
  return num.toLocaleString('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/** Format date as Thai locale */
export function formatThaiDate(date: Date | string): string {
  const d = getSafeDate(date);
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Format datetime as Thai locale */
export function formatThaiDateTime(date: Date | string): string {
  const d = getSafeDate(date);
  return d.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Generate next sequential product ID (e.g., P-0001) */
export function nextProductId(existing: string[]): string {
  const numbers = existing
    .filter((id) => /^P-\d+$/.test(id))
    .map((id) => parseInt(id.slice(2), 10));
  const max = numbers.length > 0 ? Math.max(...numbers) : 0;
  return `P-${String(max + 1).padStart(4, '0')}`;
}
