import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
  compact?: boolean;
}

export function Select({ invalid, compact = false, className = '', children, ...rest }: SelectProps) {
  return (
    <div className="relative">
      <select
        className={`w-full appearance-none rounded-field border bg-surface pl-3 pr-8 text-sm text-ink transition-colors duration-120 focus:border-brand ${
          compact ? 'h-8 text-[13px]' : 'h-9'
        } ${invalid ? 'border-danger-line' : 'border-line'} ${className}`}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown
        size={16}
        strokeWidth={1.75}
        aria-hidden="true"
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-3"
      />
    </div>
  );
}
