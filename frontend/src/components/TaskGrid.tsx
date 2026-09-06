import { AnimatePresence } from 'motion/react';
import { Plus } from 'lucide-react';
import type { PaginatedMeta, Tarea } from '../types';
import { TaskCard } from './TaskCard';

interface Props {
  tareas: Tarea[];
  meta: PaginatedMeta;
  onCompletar: (id: string, completada: boolean) => Promise<void>;
  onEditar: (tarea: Tarea) => void;
  onEliminar: (id: string) => Promise<void>;
  onNuevaTarea: () => void;
}

export function TaskGrid({ tareas, meta, onCompletar, onEditar, onEliminar, onNuevaTarea }: Props) {
  const esUltimaPagina = meta.page >= meta.totalPages;

  return (
    <div className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <AnimatePresence initial={false}>
        {tareas.map((tarea) => (
          <TaskCard key={tarea.id} tarea={tarea} onCompletar={onCompletar} onEditar={onEditar} onEliminar={onEliminar} />
        ))}
      </AnimatePresence>

      {esUltimaPagina && (
        <button
          type="button"
          onClick={onNuevaTarea}
          className="flex min-h-[168px] flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-line-strong bg-surface/40 text-ink-2 transition-colors duration-120 hover:bg-surface/60 hover:text-ink"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-brand shadow-xs">
            <Plus size={18} strokeWidth={1.75} aria-hidden="true" />
          </span>
          <span className="text-sm font-medium">Nueva tarea</span>
        </button>
      )}
    </div>
  );
}
