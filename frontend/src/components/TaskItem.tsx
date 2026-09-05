import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { CalendarDays, Pencil, Trash2 } from 'lucide-react';
import type { Prioridad, Tarea } from '../types';
import { Badge } from './ui/Badge';
import { Checkbox } from './ui/Checkbox';
import { IconButton } from './ui/IconButton';
import { ConfirmDialog } from './ui/ConfirmDialog';

interface Props {
  tarea: Tarea;
  onCompletar: (id: string, completada: boolean) => Promise<void>;
  onEditar: (tarea: Tarea) => void;
  onEliminar: (id: string) => Promise<void>;
}

const PRIORIDAD_TONO: Record<Prioridad, 'danger' | 'warn' | 'neutral'> = {
  alta: 'danger',
  media: 'warn',
  baja: 'neutral',
};

const PRIORIDAD_ETIQUETA: Record<Prioridad, string> = {
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
};

const MAX_ETIQUETAS_VISIBLES = 3;

function formatearFecha(fecha: string | null): string | null {
  if (!fecha) return null;
  const [anio, mes, dia] = fecha.split('T')[0].split('-');
  return `${dia}/${mes}/${anio}`;
}

function estaVencida(tarea: Tarea): boolean {
  if (!tarea.fecha_vencimiento || tarea.completada) return false;
  const hoy = new Date().toISOString().slice(0, 10);
  return tarea.fecha_vencimiento.slice(0, 10) < hoy;
}

export function TaskItem({ tarea, onCompletar, onEditar, onEliminar }: Props) {
  const [confirmando, setConfirmando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const reducedMotion = useReducedMotion();
  const vencida = estaVencida(tarea);

  const etiquetasVisibles = tarea.etiquetas.slice(0, MAX_ETIQUETAS_VISIBLES);
  const etiquetasOcultas = tarea.etiquetas.slice(MAX_ETIQUETAS_VISIBLES);

  async function confirmarEliminar() {
    setEliminando(true);
    try {
      await onEliminar(tarea.id);
      setConfirmando(false);
    } finally {
      setEliminando(false);
    }
  }

  return (
    <motion.li
      layout={!reducedMotion}
      initial={{ opacity: 0, y: reducedMotion ? 0 : 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: reducedMotion ? 1 : 0.98 }}
      transition={{ duration: reducedMotion ? 0 : 0.18 }}
      className="group flex items-start gap-3 rounded-card border border-line bg-surface px-4 py-3 transition-colors duration-120 hover:border-line-strong hover:shadow-xs"
    >
      <div className="mt-0.5 shrink-0">
        <Checkbox
          checked={tarea.completada}
          onChange={(e) => onCompletar(tarea.id, e.target.checked)}
          aria-label={`Marcar "${tarea.titulo}" como ${tarea.completada ? 'pendiente' : 'completada'}`}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`truncate text-sm font-medium transition-colors duration-[140ms] ${
              tarea.completada ? 'text-ink-3 line-through' : 'text-ink'
            }`}
          >
            {tarea.titulo}
          </p>
          <Badge tone={PRIORIDAD_TONO[tarea.prioridad]} dot className="shrink-0">
            {PRIORIDAD_ETIQUETA[tarea.prioridad]}
          </Badge>
        </div>

        {tarea.descripcion && <p className="mt-0.5 line-clamp-1 text-[13px] text-ink-2">{tarea.descripcion}</p>}

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-ink-2">
          {tarea.categoria_nombre && (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ink-3" aria-hidden="true" />
              {tarea.categoria_nombre}
            </span>
          )}
          {tarea.fecha_vencimiento && (
            <span className={`inline-flex items-center gap-1 ${vencida ? 'text-danger' : ''}`}>
              <CalendarDays size={13} strokeWidth={1.75} aria-hidden="true" />
              <span className="tabular">{formatearFecha(tarea.fecha_vencimiento)}</span>
            </span>
          )}
          {vencida && <Badge tone="danger">Vencida</Badge>}
          {etiquetasVisibles.map((etq) => (
            <span key={etq.id} className="rounded-full border border-line bg-surface-2 px-2 py-0.5">
              #{etq.nombre}
            </span>
          ))}
          {etiquetasOcultas.length > 0 && (
            <span
              className="rounded-full border border-line bg-surface-2 px-2 py-0.5"
              title={etiquetasOcultas.map((e) => `#${e.nombre}`).join(', ')}
            >
              +{etiquetasOcultas.length}
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 opacity-100 transition-opacity duration-120 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
        <IconButton icon={Pencil} size="sm" aria-label={`Editar "${tarea.titulo}"`} onClick={() => onEditar(tarea)} />
        <IconButton
          icon={Trash2}
          size="sm"
          variant="danger"
          aria-label={`Eliminar "${tarea.titulo}"`}
          onClick={() => setConfirmando(true)}
        />
      </div>

      <ConfirmDialog
        abierto={confirmando}
        titulo="Eliminar tarea"
        descripcion={`¿Eliminar la tarea "${tarea.titulo}"? Esta acción no se puede deshacer.`}
        textoConfirmar="Eliminar"
        tono="danger"
        cargando={eliminando}
        onConfirmar={confirmarEliminar}
        onCancelar={() => setConfirmando(false)}
      />
    </motion.li>
  );
}
