import type { HTMLAttributes } from 'react';

type BadgeTone = 'neutral' | 'brand' | 'danger' | 'warn' | 'ok';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  dot?: boolean;
}

const TONE_STYLES: Record<BadgeTone, string> = {
  neutral: 'border-line bg-surface-2 text-ink-2',
  brand: 'border-brand-line bg-brand-soft text-brand',
  danger: 'border-danger-line bg-danger-soft text-danger',
  warn: 'border-warn-line bg-warn-soft text-warn',
  ok: 'border-ok-line bg-ok-soft text-ok',
};

const DOT_STYLES: Record<BadgeTone, string> = {
  neutral: 'bg-ink-3',
  brand: 'bg-brand',
  danger: 'bg-danger',
  warn: 'bg-warn',
  ok: 'bg-ok',
};

export function Badge({ tone = 'neutral', dot = false, className = '', children, ...rest }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[12.5px] font-medium ${TONE_STYLES[tone]} ${className}`}
      {...rest}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${DOT_STYLES[tone]}`} aria-hidden="true" />}
      {children}
    </span>
  );
}
