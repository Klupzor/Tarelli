import type { ReactNode } from 'react';
import { LogoMark } from './ui/LogoMark';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-canvas">
      <div className="flex w-full flex-col items-center justify-center px-4 py-12 lg:w-[480px] lg:shrink-0 lg:px-10">
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <LogoMark size={32} />
          <span className="text-[15px] font-semibold text-ink">Tarelli</span>
        </div>
        <div className="w-full max-w-sm">{children}</div>
      </div>

      <div className="relative hidden flex-1 items-center justify-center overflow-hidden bg-brand-soft lg:flex">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage: 'radial-gradient(var(--color-brand-line) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
          aria-hidden="true"
        />
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-line/40 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col items-center gap-4 px-10 text-center">
          <LogoMark size={48} />
          <h1 className="text-2xl font-semibold tracking-[-0.01em] text-ink">Tarelli</h1>
          <p className="max-w-xs text-sm text-ink-2">Organiza tus tareas, sin ruido.</p>
        </div>
      </div>
    </div>
  );
}
