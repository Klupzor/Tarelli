import type { HTMLAttributes } from 'react';
import type { ColorCategoria } from '../../utils/colorCategoria';

type BadgeTone = 'neutral' | 'brand' | 'danger' | 'warn' | 'ok' | `cat-${ColorCategoria}`;

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
  'cat-violeta': 'border-cat-violeta-ink/15 bg-cat-violeta text-cat-violeta-ink',
  'cat-ambar': 'border-cat-ambar-ink/15 bg-cat-ambar text-cat-ambar-ink',
  'cat-verde': 'border-cat-verde-ink/15 bg-cat-verde text-cat-verde-ink',
  'cat-rosa': 'border-cat-rosa-ink/15 bg-cat-rosa text-cat-rosa-ink',
  'cat-cian': 'border-cat-cian-ink/15 bg-cat-cian text-cat-cian-ink',
  'cat-indigo': 'border-cat-indigo-ink/15 bg-cat-indigo text-cat-indigo-ink',
};

const DOT_STYLES: Record<BadgeTone, string> = {
  neutral: 'bg-ink-3',
  brand: 'bg-brand',
  danger: 'bg-danger',
  warn: 'bg-warn',
  ok: 'bg-ok',
  'cat-violeta': 'bg-cat-violeta-ink',
  'cat-ambar': 'bg-cat-ambar-ink',
  'cat-verde': 'bg-cat-verde-ink',
  'cat-rosa': 'bg-cat-rosa-ink',
  'cat-cian': 'bg-cat-cian-ink',
  'cat-indigo': 'bg-cat-indigo-ink',
};

export function Badge({ tone = 'neutral', dot = false, className = '', children, ...rest }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[12px] font-medium ${TONE_STYLES[tone]} ${className}`}
      {...rest}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${DOT_STYLES[tone]}`} aria-hidden="true" />}
      {children}
    </span>
  );
}
