import type { ReactNode } from 'react';

interface DashboardCardProps {
  className?: string;
  children: ReactNode;
}

/** Tarjeta de vidrio compartida por los bloques del dashboard (§5.2 de frontend-features.md). */
export function DashboardCard({ className = '', children }: DashboardCardProps) {
  return (
    <div
      className={`rounded-card border border-line bg-surface/72 p-5 shadow-card backdrop-blur-sm oscuro:bg-surface/85 ${className}`}
    >
      {children}
    </div>
  );
}
