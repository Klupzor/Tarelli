import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { AlertTriangle, CalendarDays, Pencil, Trash2 } from 'lucide-react';
import type { Tarea } from '../types';
import { useAuth } from '../context/AuthContext';
import { Badge } from './ui/Badge';
import { Checkbox } from './ui/Checkbox';
import { IconButton } from './ui/IconButton';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { colorCategoria } from '../utils/colorCategoria';
import { hoyEnZona } from '../utils/fechas';

interface Props {
  tarea: Tarea;
  onCompletar: (id: string, completada: boolean) => Promise<void>;
  onEditar: (tarea: Tarea) => void;
  onEliminar: (id: string) => Promise<void>;
}

const MAX_ETIQUETAS_VISIBLES = 2;
const MESES_ABREV = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function formatearFecha(fecha: string): string {
  const [, mes, dia] = fecha.split('T')[0].split('-');
  return `${parseInt(dia, 10)} ${MESES_ABREV[parseInt(mes, 10) - 1]}`;
}

function estaVencida(tarea: Tarea, hoy: string): boolean {
  if (!tarea.fecha_vencimiento || tarea.completada) return false;
  return tarea.fecha_vencimiento.slice(0, 10) < hoy;
}

function obtenerTinte(tarea: Tarea): { fondo: string; borde: string } {
  if (tarea.completada) return { fondo: 'bg-tint-hecha/70', borde: 'border-edge-hecha' };
  if (tarea.prioridad === 'alta') return { fondo: 'bg-tint-alta/72', borde: 'border-edge-alta/80' };
  if (tarea.prioridad === 'media') return { fondo: 'bg-tint-media/72', borde: 'border-edge-media/80' };
  return { fondo: 'bg-surface/72', borde: 'border-edge-baja' };
}

export function TaskCard({ tarea, onCompletar, onEditar, onEliminar }: Props) {
  const { usuario } = useAuth();
  const [confirmando, setConfirmando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const reducedMotion = useReducedMotion();

  const timezone = usuario?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const vencida = estaVencida(tarea, hoyEnZona(timezone));
  const tinte = obtenerTinte(tarea);

  const etiquetasVisibles = tarea.etiquetas.slice(0, MAX_ETIQUETAS_VISIBLES);
  const etiquetasOcultas = tarea.etiquetas.slice(MAX_ETIQUETAS_VISIBLES);

  let badgePrioridad: { tono: 'danger' | 'warn' | 'neutral'; texto: string } | null = null;
  if (tarea.prioridad === 'alta') badgePrioridad = { tono: tarea.completada ? 'neutral' : 'danger', texto: 'Alta' };
  else if (tarea.prioridad === 'media') badgePrioridad = { tono: tarea.completada ? 'neutral' : 'warn', texto: 'Media' };

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
    <motion.article
      layout={!reducedMotion}
      initial={{ opacity: 0, y: reducedMotion ? 0 : 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: reducedMotion ? 1 : 0.97 }}
      transition={{ duration: reducedMotion ? 0 : 0.18 }}
      className={`group relative flex min-h-[168px] flex-col gap-3 rounded-card border p-4 shadow-card backdrop-blur-sm transition-[background-color,border-color,box-shadow,transform] duration-180 hover:shadow-card-hover hover:-translate-y-0.5 ${tinte.fondo} ${tinte.borde}`}
    >
      <div className="relative z-10 flex items-start justify-between gap-2">
        <Checkbox
          checked={tarea.completada}
          onChange={(e) => onCompletar(tarea.id, e.target.checked)}
          aria-label={`Marcar "${tarea.titulo}" como ${tarea.completada ? 'pendiente' : 'completada'}`}
        />
        {badgePrioridad && <Badge tone={badgePrioridad.tono}>{badgePrioridad.texto}</Badge>}
      </div>

      <div className="relative z-10 min-w-0 flex-1">
        <p
          className={`line-clamp-2 text-[14.5px] font-semibold transition-colors duration-[140ms] ${
            tarea.completada ? 'text-ink-3 line-through' : 'text-ink'
          }`}
        >
          {tarea.titulo}
        </p>
        {tarea.descripcion && <p className="mt-1 line-clamp-2 text-[13px] text-ink-2">{tarea.descripcion}</p>}

        {tarea.etiquetas.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {etiquetasVisibles.map((etq) => (
              <span key={etq.id} className="rounded-full bg-surface px-2 py-0.5 text-[11.5px] text-ink-2">
                #{etq.nombre}
              </span>
            ))}
            {etiquetasOcultas.length > 0 && (
              <span
                className="rounded-full bg-surface px-2 py-0.5 text-[11.5px] text-ink-2"
                title={etiquetasOcultas.map((e) => `#${e.nombre}`).join(', ')}
              >
                +{etiquetasOcultas.length}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="relative z-10 mt-auto flex items-center justify-between gap-2 pt-3 max-md:pr-16">
        {tarea.categoria_id && tarea.categoria_nombre ? (
          <Badge tone={`cat-${colorCategoria(tarea.categoria_id)}`} dot className="min-w-0">
            <span className="truncate">{tarea.categoria_nombre}</span>
          </Badge>
        ) : (
          <span />
        )}

        {tarea.fecha_vencimiento && (
          <span
            className={`inline-flex shrink-0 items-center gap-1 text-[12px] ${vencida ? 'text-danger' : 'text-ink-2'}`}
          >
            {vencida ? (
              <AlertTriangle size={13} strokeWidth={1.75} aria-hidden="true" />
            ) : (
              <CalendarDays size={13} strokeWidth={1.75} aria-hidden="true" />
            )}
            <span className="tabular">{formatearFecha(tarea.fecha_vencimiento)}</span>
            {vencida && <span className="sr-only">Vencida</span>}
          </span>
        )}
      </div>

      <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1 opacity-100 transition-opacity duration-120 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
        <IconButton
          icon={Pencil}
          size="sm"
          variant="secondary"
          className="bg-surface"
          aria-label={`Editar "${tarea.titulo}"`}
          onClick={() => onEditar(tarea)}
        />
        <IconButton
          icon={Trash2}
          size="sm"
          variant="secondary"
          className="bg-surface text-danger hover:text-danger"
          aria-label={`Eliminar "${tarea.titulo}"`}
          onClick={() => setConfirmando(true)}
        />
      </div>

      <button
        type="button"
        onClick={() => onEditar(tarea)}
        aria-label={`Editar "${tarea.titulo}"`}
        className="absolute inset-0 z-0 rounded-card"
      />

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
    </motion.article>
  );
}
