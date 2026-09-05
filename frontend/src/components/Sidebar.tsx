import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Categoria, Etiqueta } from '../types';
import { ApiError } from '../api/client';

interface Props {
  categorias: Categoria[];
  etiquetas: Etiqueta[];
  onCrearCategoria: (nombre: string) => Promise<unknown>;
  onEliminarCategoria: (id: string) => Promise<void>;
  onCrearEtiqueta: (nombre: string) => Promise<unknown>;
}

export function Sidebar({ categorias, etiquetas, onCrearCategoria, onEliminarCategoria, onCrearEtiqueta }: Props) {
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [nuevaEtiqueta, setNuevaEtiqueta] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function crearCategoria(e: FormEvent) {
    e.preventDefault();
    if (!nuevaCategoria.trim()) return;
    setError(null);
    try {
      await onCrearCategoria(nuevaCategoria.trim());
      setNuevaCategoria('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear la categoría.');
    }
  }

  async function crearEtiqueta(e: FormEvent) {
    e.preventDefault();
    if (!nuevaEtiqueta.trim()) return;
    setError(null);
    try {
      await onCrearEtiqueta(nuevaEtiqueta.trim());
      setNuevaEtiqueta('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear la etiqueta.');
    }
  }

  async function eliminarCategoria(id: string, nombre: string) {
    if (!window.confirm(`¿Eliminar la categoría "${nombre}"? Las tareas quedarán sin categoría.`)) return;
    setError(null);
    try {
      await onEliminarCategoria(id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo eliminar la categoría.');
    }
  }

  return (
    <aside className="flex w-full shrink-0 flex-col gap-6 border-slate-200 bg-white p-4 lg:w-64 lg:border-r">
      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Categorías</h2>
        <ul className="flex flex-col gap-1">
          {categorias.map((c) => (
            <li key={c.id} className="group flex items-center justify-between rounded-md px-2 py-1 hover:bg-slate-50">
              <span className="truncate text-sm text-slate-700">{c.nombre}</span>
              <button
                type="button"
                onClick={() => eliminarCategoria(c.id, c.nombre)}
                className="hidden text-xs text-slate-400 hover:text-red-600 group-hover:block"
                aria-label={`Eliminar categoría ${c.nombre}`}
              >
                ✕
              </button>
            </li>
          ))}
          {categorias.length === 0 && <li className="text-sm text-slate-400">Sin categorías aún.</li>}
        </ul>
        <form onSubmit={crearCategoria} className="mt-2 flex gap-1">
          <input
            value={nuevaCategoria}
            onChange={(e) => setNuevaCategoria(e.target.value)}
            placeholder="Nueva categoría"
            className="min-w-0 flex-1 rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <button type="submit" className="rounded-md bg-slate-100 px-2 py-1 text-sm text-slate-600 hover:bg-slate-200">
            +
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Etiquetas</h2>
        <div className="flex flex-wrap gap-1">
          {etiquetas.map((e) => (
            <span key={e.id} className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">
              #{e.nombre}
            </span>
          ))}
          {etiquetas.length === 0 && <p className="text-sm text-slate-400">Sin etiquetas aún.</p>}
        </div>
        <form onSubmit={crearEtiqueta} className="mt-2 flex gap-1">
          <input
            value={nuevaEtiqueta}
            onChange={(e) => setNuevaEtiqueta(e.target.value)}
            placeholder="Nueva etiqueta"
            className="min-w-0 flex-1 rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <button type="submit" className="rounded-md bg-slate-100 px-2 py-1 text-sm text-slate-600 hover:bg-slate-200">
            +
          </button>
        </form>
      </section>
    </aside>
  );
}
