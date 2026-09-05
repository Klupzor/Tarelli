import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginatedMeta } from '../types';
import { IconButton } from './ui/IconButton';

interface Props {
  meta: PaginatedMeta;
  onCambiarPagina: (page: number) => void;
}

export function Pagination({ meta, onCambiarPagina }: Props) {
  if (meta.totalPages <= 1) return null;

  const desde = (meta.page - 1) * meta.limit + 1;
  const hasta = Math.min(meta.page * meta.limit, meta.total);
  const esPrimera = meta.page <= 1;
  const esUltima = meta.page >= meta.totalPages;

  return (
    <div className="flex items-center justify-between border-t border-line pt-3">
      <p className="tabular text-[12.5px] text-ink-2">
        Mostrando {desde}–{hasta} de {meta.total}
      </p>
      <div className="flex items-center gap-2">
        <IconButton
          icon={ChevronLeft}
          size="sm"
          variant="secondary"
          aria-label="Página anterior"
          disabled={esPrimera}
          onClick={() => onCambiarPagina(meta.page - 1)}
          className={esPrimera ? 'opacity-40!' : ''}
        />
        <span className="tabular text-[12.5px] text-ink-2">
          Página {meta.page} de {meta.totalPages}
        </span>
        <IconButton
          icon={ChevronRight}
          size="sm"
          variant="secondary"
          aria-label="Página siguiente"
          disabled={esUltima}
          onClick={() => onCambiarPagina(meta.page + 1)}
          className={esUltima ? 'opacity-40!' : ''}
        />
      </div>
    </div>
  );
}
