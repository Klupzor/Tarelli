import type { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export function Textarea({ invalid, className = '', ...rest }: TextareaProps) {
  return (
    <textarea
      className={`min-h-[88px] w-full resize-none rounded-field border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-3 transition-colors duration-120 focus:border-brand ${
        invalid ? 'border-danger-line' : 'border-line'
      } ${className}`}
      {...rest}
    />
  );
}
