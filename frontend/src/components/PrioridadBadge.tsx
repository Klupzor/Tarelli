import type { Prioridad } from '../types';

const ESTILOS: Record<Prioridad, string> = {
  alta: 'bg-red-100 text-red-700',
  media: 'bg-amber-100 text-amber-700',
  baja: 'bg-emerald-100 text-emerald-700',
};

const ETIQUETAS: Record<Prioridad, string> = {
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
};

export function PrioridadBadge({ prioridad }: { prioridad: Prioridad }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTILOS[prioridad]}`}>
      {ETIQUETAS[prioridad]}
    </span>
  );
}
