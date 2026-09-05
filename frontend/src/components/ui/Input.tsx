import type { InputHTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
  trailing?: ReactNode;
  invalid?: boolean;
}

export function Input({ icon: Icon, trailing, invalid, className = '', ...rest }: InputProps) {
  return (
    <div className="relative flex items-center">
      {Icon && (
        <Icon size={16} strokeWidth={1.75} aria-hidden="true" className="pointer-events-none absolute left-3 text-ink-3" />
      )}
      <input
        className={`h-9 w-full rounded-field border bg-surface px-3 text-sm text-ink placeholder:text-ink-3 transition-colors duration-120 focus:border-brand ${
          invalid ? 'border-danger-line' : 'border-line'
        } ${Icon ? 'pl-9' : ''} ${trailing ? 'pr-9' : ''} ${className}`}
        {...rest}
      />
      {trailing && <div className="absolute right-2 flex items-center">{trailing}</div>}
    </div>
  );
}
