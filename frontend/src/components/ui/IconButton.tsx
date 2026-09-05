import type { ButtonHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';

type IconButtonVariant = 'secondary' | 'ghost' | 'danger';
type IconButtonSize = 'sm' | 'md';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  'aria-label': string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
}

const SIZE_STYLES: Record<IconButtonSize, string> = {
  sm: 'h-7 w-7',
  md: 'h-8 w-8',
};

const VARIANT_STYLES: Record<IconButtonVariant, string> = {
  secondary: 'border border-line bg-surface text-ink-2 hover:bg-surface-2 hover:text-ink',
  ghost: 'text-ink-2 hover:bg-surface-2 hover:text-ink',
  danger: 'text-ink-2 hover:bg-danger-soft hover:text-danger',
};

export function IconButton({
  icon: Icon,
  variant = 'ghost',
  size = 'md',
  disabled,
  type = 'button',
  className = '',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex shrink-0 items-center justify-center rounded-field transition-colors duration-120 disabled:cursor-not-allowed disabled:opacity-50 ${SIZE_STYLES[size]} ${VARIANT_STYLES[variant]} ${className}`}
      {...rest}
    >
      <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
    </button>
  );
}
