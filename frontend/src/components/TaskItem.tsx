import { useState } from 'react';
import type { Tarea } from '../types';
import { PrioridadBadge } from './PrioridadBadge';

interface Props {
  tarea: Tarea;
  onCompletar: (id: string, completada: boolean) => Promise<void>;
  onEditar: (tarea: Tarea) => void;
  onEliminar: (id: string) => Promise<void>;
}

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
  const [eliminando, setEliminando] = useState(false);
  const vencida = estaVencida(tarea);

  async function handleEliminar() {
    if (!window.confirm(`¿Eliminar la tarea "${tarea.titulo}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    setEliminando(true);
    try {
      await onEliminar(tarea.id);
    } finally {
      setEliminando(false);
    }
  }

  return (
    <li className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow">
      <input
        type="checkbox"
        checked={tarea.completada}
        onChange={(e) => onCompletar(tarea.id, e.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-indigo-600"
        aria-label={`Marcar "${tarea.titulo}" como ${tarea.completada ? 'pendiente' : 'completada'}`}
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className={`truncate text-sm font-medium ${tarea.completada ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
            {tarea.titulo}
          </p>
          <PrioridadBadge prioridad={tarea.prioridad} />
          {vencida && (
            <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-medium text-white">Vencida</span>
          )}
        </div>

        {tarea.descripcion && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{tarea.descripcion}</p>}

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          {tarea.categoria_nombre && (
            <span className="rounded bg-slate-100 px-2 py-0.5">{tarea.categoria_nombre}</span>
          )}
          {tarea.fecha_vencimiento && <span>Vence: {formatearFecha(tarea.fecha_vencimiento)}</span>}
          {tarea.etiquetas.map((etq) => (
            <span key={etq.id} className="rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-700">
              #{etq.nombre}
            </span>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={() => onEditar(tarea)}
          className="rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={handleEliminar}
          disabled={eliminando}
          className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
        >
          Eliminar
        </button>
      </div>
    </li>
  );
}
