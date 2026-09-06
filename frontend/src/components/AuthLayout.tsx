import type { ReactNode } from 'react';
import { LogoMark } from './ui/LogoMark';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-12">
      <div className="flex items-center gap-2">
        <LogoMark size={32} />
        <span className="text-[15px] font-semibold text-ink">Tarelli</span>
      </div>

      <div className="w-full max-w-[400px] rounded-modal border border-white/60 bg-surface/80 p-8 shadow-modal backdrop-blur-xl">
        {children}
      </div>
    </div>
  );
}
