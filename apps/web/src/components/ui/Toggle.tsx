// ZapTI Web — Toggle Component
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface ToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  ({ checked, onCheckedChange, label, disabled, ...props }, ref) => {
    return (
      <div className="flex items-center gap-3">
        <button
          ref={ref}
          role="switch"
          aria-checked={checked}
          aria-label={label}
          onClick={() => !disabled && onCheckedChange(!checked)}
          disabled={disabled}
          className={cn(
            'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            checked ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          {...props}
        >
          <span
            className={cn(
              'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out',
              checked ? 'translate-x-5' : 'translate-x-0'
            )}
          />
        </button>
        {label && (
          <label className="text-sm font-medium text-slate-900 dark:text-white cursor-pointer select-none">
            {label}
          </label>
        )}
      </div>
    );
  }
);

Toggle.displayName = 'Toggle';