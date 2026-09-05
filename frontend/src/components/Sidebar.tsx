import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Folder, LogOut, Plus, Trash2 } from 'lucide-react';
import type { Categoria, Etiqueta, Usuario } from '../types';
import { ApiError } from '../api/client';
import { LogoMark } from './ui/LogoMark';
import { IconButton } from './ui/IconButton';

interface Props {
  categorias: Categoria[];
  etiquetas: Etiqueta[];
  onCrearCategoria: (nombre: string) => Promise<unknown>;
  onEliminarCategoria: (id: string) => Promise<void>;
  onCrearEtiqueta: (nombre: string) => Promise<unknown>;
  usuario: Usuario | null;
  onLogout: () => void;
  abiertoMovil: boolean;
  onCerrarMovil: () => void;
}

function obtenerIniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).slice(0, 2);
  const iniciales = partes.map((p) => p[0]?.toUpperCase() ?? '').join('');
  return iniciales || '?';
}

interface ContenidoProps {
  categorias: Categoria[];
  etiquetas: Etiqueta[];
  onCrearCategoria: (nombre: string) => Promise<unknown>;
  onEliminarCategoria: (id: string) => Promise<void>;
  onCrearEtiqueta: (nombre: string) => Promise<unknown>;
  usuario: Usuario | null;
  onLogout: () => void;
  onAccionCompletada: () => void;
}

function SidebarContenido({
  categorias,
  etiquetas,
  onCrearCategoria,
  onEliminarCategoria,
  onCrearEtiqueta,
  usuario,
  onLogout,
  onAccionCompletada,
}: ContenidoProps) {
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
      onAccionCompletada();
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
      onAccionCompletada();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear la etiqueta.');
    }
  }

  async function eliminarCategoria(id: string, nombre: string) {
    if (!window.confirm(`¿Eliminar la categoría "${nombre}"? Las tareas quedarán sin categoría.`)) return;
    setError(null);
    try {
      await onEliminarCategoria(id);
      onAccionCompletada();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo eliminar la categoría.');
    }
  }

  return (
    <>
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-4">
        <LogoMark size={28} />
        <span className="text-[15px] font-semibold text-ink">Tarelli</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {error && (
          <div className="mb-3 rounded-field border border-danger-line bg-danger-soft px-3 py-2 text-[12.5px] text-danger">
            {error}
          </div>
        )}

        <section className="mb-6">
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">Categorías</h2>
          <ul className="flex flex-col gap-0.5">
            {categorias.map((c) => (
              <li
                key={c.id}
                className="group flex h-8 items-center justify-between gap-1 rounded-field px-2 hover:bg-surface-2"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Folder size={14} strokeWidth={1.75} className="shrink-0 text-ink-3" aria-hidden="true" />
                  <span className="truncate text-sm text-ink">{c.nombre}</span>
                </span>
                <IconButton
                  icon={Trash2}
                  size="sm"
                  variant="danger"
                  aria-label={`Eliminar categoría ${c.nombre}`}
                  className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                  onClick={() => eliminarCategoria(c.id, c.nombre)}
                />
              </li>
            ))}
            {categorias.length === 0 && <li className="px-2 text-sm text-ink-3">Sin categorías aún.</li>}
          </ul>
          <form onSubmit={crearCategoria} className="mt-2 flex gap-1.5">
            <input
              value={nuevaCategoria}
              onChange={(e) => setNuevaCategoria(e.target.value)}
              placeholder="Nueva categoría"
              className="h-8 min-w-0 flex-1 rounded-field border border-line bg-surface px-2.5 text-[13px] text-ink placeholder:text-ink-3 focus:border-brand"
            />
            <IconButton icon={Plus} size="sm" variant="secondary" aria-label="Crear categoría" type="submit" />
          </form>
        </section>

        <section>
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">Etiquetas</h2>
          <div className="flex flex-wrap gap-1.5">
            {etiquetas.map((e) => (
              <span
                key={e.id}
                className="rounded-full border border-line bg-surface px-2 py-0.5 text-[12.5px] text-ink-2"
              >
                #{e.nombre}
              </span>
            ))}
            {etiquetas.length === 0 && <p className="text-sm text-ink-3">Sin etiquetas aún.</p>}
          </div>
          <form onSubmit={crearEtiqueta} className="mt-2 flex gap-1.5">
            <input
              value={nuevaEtiqueta}
              onChange={(e) => setNuevaEtiqueta(e.target.value)}
              placeholder="Nueva etiqueta"
              className="h-8 min-w-0 flex-1 rounded-field border border-line bg-surface px-2.5 text-[13px] text-ink placeholder:text-ink-3 focus:border-brand"
            />
            <IconButton icon={Plus} size="sm" variant="secondary" aria-label="Crear etiqueta" type="submit" />
          </form>
        </section>
      </div>

      <div className="flex shrink-0 items-center gap-2.5 border-t border-line px-4 py-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[12px] font-semibold text-brand">
          {usuario ? obtenerIniciales(usuario.nombre) : '?'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-ink">{usuario?.nombre}</p>
          <p className="truncate text-xs text-ink-3">{usuario?.email}</p>
        </div>
        <IconButton icon={LogOut} size="sm" aria-label="Cerrar sesión" onClick={onLogout} />
      </div>
    </>
  );
}

export function Sidebar({ abiertoMovil, onCerrarMovil, ...contenido }: Props) {
  const reducedMotion = useReducedMotion();

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col border-r border-line bg-surface lg:flex">
        <SidebarContenido {...contenido} onAccionCompletada={() => {}} />
      </aside>

      <AnimatePresence>
        {abiertoMovil && (
          <DrawerMovil onCerrar={onCerrarMovil} reducedMotion={Boolean(reducedMotion)}>
            <SidebarContenido {...contenido} onAccionCompletada={onCerrarMovil} />
          </DrawerMovil>
        )}
      </AnimatePresence>
    </>
  );
}

function DrawerMovil({
  children,
  onCerrar,
  reducedMotion,
}: {
  children: ReactNode;
  onCerrar: () => void;
  reducedMotion: boolean;
}) {
  return (
    <div className="lg:hidden" onKeyDown={(e) => e.key === 'Escape' && onCerrar()}>
      <motion.div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.16 }}
        onClick={onCerrar}
        aria-hidden="true"
      />
      <motion.aside
        className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-surface shadow-lg"
        initial={{ x: reducedMotion ? 0 : -280 }}
        animate={{ x: 0 }}
        exit={{ x: reducedMotion ? 0 : -280 }}
        transition={{ duration: reducedMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.aside>
    </div>
  );
}
