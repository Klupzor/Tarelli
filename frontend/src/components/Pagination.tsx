import type { PaginatedMeta } from '../types';

interface Props {
  meta: PaginatedMeta;
  onCambiarPagina: (page: number) => void;
}

export function Pagination({ meta, onCambiarPagina }: Props) {
  if (meta.totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-sm text-slate-600">
      <span>
        Página {meta.page} de {meta.totalPages} · {meta.total} tareas
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={meta.page <= 1}
          onClick={() => onCambiarPagina(meta.page - 1)}
          className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-40"
        >
          Anterior
        </button>
        <button
          type="button"
          disabled={meta.page >= meta.totalPages}
          onClick={() => onCambiarPagina(meta.page + 1)}
          className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-40"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
