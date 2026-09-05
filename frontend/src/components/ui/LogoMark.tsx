import { Check } from 'lucide-react';

interface LogoMarkProps {
  size?: number;
  className?: string;
}

export function LogoMark({ size = 32, className = '' }: LogoMarkProps) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-[10px] bg-brand ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Check size={Math.round(size * 0.55)} strokeWidth={2.5} className="text-white" />
    </div>
  );
}
