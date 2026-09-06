import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white shadow-xs hover:bg-brand-hover',
  secondary: 'border border-line bg-surface/70 backdrop-blur text-ink hover:bg-surface-2/80',
  ghost: 'text-ink-2 hover:bg-surface-2',
  danger: 'bg-danger text-white shadow-xs hover:brightness-90',
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 px-3 text-[13px]',
  md: 'h-9 gap-2 px-4 text-sm',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    icon: Icon,
    iconRight: IconRight,
    disabled,
    type = 'button',
    className = '',
    children,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex shrink-0 items-center justify-center rounded-field font-medium transition-colors duration-120 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_STYLES[variant]} ${SIZE_STYLES[size]} ${className}`}
      {...rest}
    >
      {loading ? (
        <span
          className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      ) : (
        Icon && <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
      )}
      {children}
      {!loading && IconRight && <IconRight size={16} strokeWidth={1.75} aria-hidden="true" />}
    </button>
  );
});
