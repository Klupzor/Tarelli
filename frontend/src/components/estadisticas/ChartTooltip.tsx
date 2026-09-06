import type { ReactNode } from 'react';
import { useReducedMotion } from 'motion/react';

interface ChartTooltipProps {
  /** Posición horizontal como porcentaje (0-100) del contenedor relativo. */
  xPct: number;
  children: ReactNode;
}

/** Div posicionado, no `title` nativo: tarda y no se puede estilar (§5.6 de frontend-features.md). */
export function ChartTooltip({ xPct, children }: ChartTooltipProps) {
  const reducedMotion = useReducedMotion();

  return (
    <div
      className="pointer-events-none absolute bottom-full z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-field border border-line bg-surface/95 px-2.5 py-1.5 text-xs text-ink shadow-md backdrop-blur"
      style={{ left: `${xPct}%`, transition: reducedMotion ? 'none' : 'left 100ms ease-out' }}
    >
      {children}
    </div>
  );
}
