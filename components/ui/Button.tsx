'use client';

import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import type { ButtonVariant } from '@/types/ui';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-md',
  secondary:
    'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600',
  danger:
    'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50',
  warning: 'bg-orange-500 text-white hover:bg-orange-600',
  success: 'bg-green-600 text-white hover:bg-green-700',
  outline:
    'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700',
  ghost:
    'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'primary', fullWidth, className, disabled, type = 'button', children, ...props },
    ref
  ) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={cn(
        'px-4 py-2 rounded-lg font-medium transition-all active:scale-95 flex items-center justify-center gap-2',
        variants[variant],
        fullWidth && 'w-full',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
);

Button.displayName = 'Button';
