import { AlertTriangle, ListChecks, Plus, RotateCw, Search, X } from 'lucide-react';
import { Button } from './ui/Button';
import { Skeleton } from './ui/Skeleton';

export function EstadoCargando() {
  return (
    <ul
      className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      aria-busy="true"
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <li
          key={i}
          className="flex min-h-[168px] flex-col gap-3 rounded-card border border-line bg-surface/72 p-4 backdrop-blur-sm"
        >
          <div className="flex items-start justify-between">
            <Skeleton className="h-5 w-5 shrink-0 rounded-[7px]" aria-hidden="true" />
            <Skeleton className="h-5 w-12 shrink-0 rounded-full" aria-hidden="true" />
          </div>
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-4/5 rounded-full" aria-hidden="true" />
            <Skeleton className="h-3.5 w-3/5 rounded-full" aria-hidden="true" />
            <Skeleton className="h-3 w-full rounded-full" aria-hidden="true" />
            <Skeleton className="h-3 w-2/5 rounded-full" aria-hidden="true" />
          </div>
          <div className="mt-auto flex items-center justify-between gap-2 pt-3">
            <Skeleton className="h-5 w-16 rounded-full" aria-hidden="true" />
            <Skeleton className="h-4 w-12 rounded-full" aria-hidden="true" />
          </div>
        </li>
      ))}
    </ul>
  );
}

interface EstadoVacioProps {
  variante: 'sin-filtros' | 'con-filtros';
  onCrearTarea?: () => void;
  onLimpiarFiltros?: () => void;
}

export function EstadoVacio({ variante, onCrearTarea, onLimpiarFiltros }: EstadoVacioProps) {
  const esSinFiltros = variante === 'sin-filtros';
  const Icono = esSinFiltros ? ListChecks : Search;

  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-line/70 bg-surface/70 px-6 py-14 text-center backdrop-blur-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand">
        <Icono size={20} strokeWidth={1.75} aria-hidden="true" />
      </div>
      <div>
        <p className="text-[15px] font-semibold text-ink">
          {esSinFiltros ? 'Aún no tienes tareas' : 'Ninguna tarea coincide con los filtros'}
        </p>
        <p className="mt-1 text-sm text-ink-2">
          {esSinFiltros
            ? 'Crea tu primera tarea para empezar a organizarte.'
            : 'Ajusta los filtros o límpialos para ver más resultados.'}
        </p>
      </div>
      {esSinFiltros ? (
        <Button icon={Plus} onClick={onCrearTarea}>
          Crear tarea
        </Button>
      ) : (
        <Button variant="secondary" icon={X} onClick={onLimpiarFiltros}>
          Limpiar filtros
        </Button>
      )}
    </div>
  );
}

export function EstadoError({ mensaje, onReintentar }: { mensaje: string; onReintentar?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-danger-line bg-danger-soft px-6 py-10 text-center">
      <AlertTriangle size={20} strokeWidth={1.75} className="text-danger" aria-hidden="true" />
      <p className="text-sm text-danger">{mensaje}</p>
      {onReintentar && (
        <Button variant="secondary" size="sm" icon={RotateCw} onClick={onReintentar}>
          Reintentar
        </Button>
      )}
    </div>
  );
}
