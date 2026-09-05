import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { AlertTriangle, CalendarDays, CheckCircle2, Flag, Pencil, Trash2 } from 'lucide-react';
import type { Tarea } from '../types';
import { Checkbox } from './ui/Checkbox';
import { IconButton } from './ui/IconButton';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { obtenerColorCategoria } from '../utils/categoriaColor';

interface Props {
  tarea: Tarea;
  onCompletar: (id: string, completada: boolean) => Promise<void>;
  onEditar: (tarea: Tarea) => void;
  onEliminar: (id: string) => Promise<void>;
}

const MAX_ETIQUETAS_VISIBLES = 2;

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
  const color = obtenerColorCategoria(tarea.categoria_id);

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

  let InsigniaIcono = CheckCircle2;
  let insigniaClase = 'bg-surface text-ink-3';
  let insigniaTexto = 'Prioridad baja';
  if (vencida) {
    InsigniaIcono = AlertTriangle;
    insigniaClase = 'bg-danger text-white';
    insigniaTexto = 'Vencida';
  } else if (tarea.prioridad === 'alta') {
    InsigniaIcono = Flag;
    insigniaClase = 'bg-surface text-danger';
    insigniaTexto = 'Prioridad alta';
  } else if (tarea.prioridad === 'media') {
    InsigniaIcono = Flag;
    insigniaClase = 'bg-surface text-warn';
    insigniaTexto = 'Prioridad media';
  }

  return (
    <motion.li
      layout={!reducedMotion}
      initial={{ opacity: 0, y: reducedMotion ? 0 : 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: reducedMotion ? 1 : 0.98 }}
      transition={{ duration: reducedMotion ? 0 : 0.18 }}
      className={`group flex h-full flex-col gap-3 rounded-[20px] border p-4 transition-shadow duration-120 hover:shadow-md ${color.borde} ${color.fondo}`}
    >
      <div className="flex items-start justify-between">
        <Checkbox
          checked={tarea.completada}
          onChange={(e) => onCompletar(tarea.id, e.target.checked)}
          aria-label={`Marcar "${tarea.titulo}" como ${tarea.completada ? 'pendiente' : 'completada'}`}
        />

        <div className="flex items-center gap-1">
          <div className="flex items-center gap-0.5 opacity-100 transition-opacity duration-120 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
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
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full shadow-xs ${insigniaClase}`}
            title={insigniaTexto}
          >
            <InsigniaIcono size={14} strokeWidth={1.75} aria-hidden="true" />
            <span className="sr-only">{insigniaTexto}</span>
          </div>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-medium transition-colors duration-[140ms] ${
            tarea.completada ? 'text-ink-3 line-through' : 'text-ink'
          }`}
        >
          {tarea.titulo}
        </p>
        {tarea.descripcion && <p className="mt-1 line-clamp-2 text-[13px] text-ink-2">{tarea.descripcion}</p>}

        {tarea.etiquetas.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {etiquetasVisibles.map((etq) => (
              <span key={etq.id} className="rounded-full bg-surface px-2 py-0.5 text-[11px] text-ink-2">
                #{etq.nombre}
              </span>
            ))}
            {etiquetasOcultas.length > 0 && (
              <span
                className="rounded-full bg-surface px-2 py-0.5 text-[11px] text-ink-2"
                title={etiquetasOcultas.map((e) => `#${e.nombre}`).join(', ')}
              >
                +{etiquetasOcultas.length}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <span
          className={`inline-flex min-w-0 items-center gap-1 truncate rounded-full border bg-surface px-2 py-0.5 text-[11px] font-medium ${color.borde} ${color.texto}`}
        >
          <color.icono size={11} strokeWidth={2} className="shrink-0" aria-hidden="true" />
          <span className="truncate">{tarea.categoria_nombre ?? 'Sin categoría'}</span>
        </span>

        {tarea.fecha_vencimiento && (
          <span
            className={`inline-flex shrink-0 items-center gap-1 text-[12px] ${vencida ? 'text-danger' : 'text-ink-2'}`}
          >
            <CalendarDays size={13} strokeWidth={1.75} aria-hidden="true" />
            <span className="tabular">{formatearFecha(tarea.fecha_vencimiento)}</span>
          </span>
        )}
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
