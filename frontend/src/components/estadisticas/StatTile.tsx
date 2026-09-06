import { DashboardCard } from './DashboardCard';

interface StatTileProps {
  etiqueta: string;
  valor: string | number;
  /** "Vencidas" se resalta en rojo cuando es > 0 (§5.3 de frontend-features.md). */
  destacarPeligro?: boolean;
}

export function StatTile({ etiqueta, valor, destacarPeligro = false }: StatTileProps) {
  return (
    <DashboardCard>
      <p className={`tabular text-[28px] font-semibold leading-tight ${destacarPeligro ? 'text-danger' : 'text-ink'}`}>
        {valor}
      </p>
      <p className="mt-1 text-xs text-ink-2">{etiqueta}</p>
    </DashboardCard>
  );
}
