import type { InputHTMLAttributes } from 'react';
import { Check } from 'lucide-react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  'aria-label': string;
}

export function Checkbox({ className = '', checked, ...rest }: CheckboxProps) {
  return (
    <label
      className={`relative inline-flex h-[20px] w-[20px] shrink-0 cursor-pointer items-center justify-center ${className}`}
    >
      <input type="checkbox" checked={checked} className="peer sr-only" {...rest} />
      <span
        className="flex h-[20px] w-[20px] items-center justify-center rounded-[7px] border border-line-strong bg-surface transition-colors duration-120 peer-checked:border-brand peer-checked:bg-brand peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand"
        aria-hidden="true"
      >
        <Check
          size={12}
          strokeWidth={3}
          className={`text-white transition-transform duration-[140ms] ${checked ? 'scale-100 opacity-100' : 'scale-[0.6] opacity-0'}`}
        />
      </span>
    </label>
  );
}
