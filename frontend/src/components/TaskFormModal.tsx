import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { Categoria, Etiqueta, Prioridad, Tarea, TareaInput } from '../types';
import { validarTitulo } from '../utils/validation';
import { ApiError } from '../api/client';

interface Props {
  abierto: boolean;
  tareaInicial: Tarea | null;
  categorias: Categoria[];
  etiquetas: Etiqueta[];
  onCerrar: () => void;
  onGuardar: (input: TareaInput) => Promise<void>;
}

const PRIORIDADES: Prioridad[] = ['baja', 'media', 'alta'];

function inputVacio(): TareaInput {
  return {
    titulo: '',
    descripcion: '',
    prioridad: 'media',
    categoria_id: null,
    fecha_vencimiento: null,
    etiquetas: [],
  };
}

export function TaskFormModal({ abierto, tareaInicial, categorias, etiquetas, onCerrar, onGuardar }: Props) {
  const [form, setForm] = useState<TareaInput>(inputVacio());
  const [errorTitulo, setErrorTitulo] = useState<string | null>(null);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setErrorTitulo(null);
    setErrorServidor(null);
    if (tareaInicial) {
      setForm({
        titulo: tareaInicial.titulo,
        descripcion: tareaInicial.descripcion,
        prioridad: tareaInicial.prioridad,
        categoria_id: tareaInicial.categoria_id,
        fecha_vencimiento: tareaInicial.fecha_vencimiento?.slice(0, 10) ?? null,
        etiquetas: tareaInicial.etiquetas.map((e) => e.id),
      });
    } else {
      setForm(inputVacio());
    }
  }, [abierto, tareaInicial]);

  if (!abierto) return null;

  function toggleEtiqueta(id: string) {
    setForm((prev) => ({
      ...prev,
      etiquetas: prev.etiquetas.includes(id)
        ? prev.etiquetas.filter((e) => e !== id)
        : [...prev.etiquetas, id],
    }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const error = validarTitulo(form.titulo);
    setErrorTitulo(error);
    if (error) return;

    setGuardando(true);
    setErrorServidor(null);
    try {
      await onGuardar(form);
      onCerrar();
    } catch (err) {
      setErrorServidor(err instanceof ApiError ? err.message : 'No se pudo guardar la tarea.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-form-title"
    >
      <div
        id="task-form-modal"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
      >
        <h2 id="task-form-title" className="mb-4 text-lg font-semibold text-slate-900">
          {tareaInicial ? 'Editar tarea' : 'Nueva tarea'}
        </h2>

        {errorServidor && (
          <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorServidor}</div>
        )}

        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <div>
            <label htmlFor="tarea-titulo" className="mb-1 block text-sm font-medium text-slate-700">
              Título
            </label>
            <input
              id="tarea-titulo"
              value={form.titulo}
              onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              autoFocus
            />
            {errorTitulo && <p className="mt-1 text-xs text-red-600">{errorTitulo}</p>}
          </div>

          <div>
            <label htmlFor="tarea-descripcion" className="mb-1 block text-sm font-medium text-slate-700">
              Descripción
            </label>
            <textarea
              id="tarea-descripcion"
              value={form.descripcion}
              onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
              rows={3}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Prioridad</label>
              <select
                value={form.prioridad}
                onChange={(e) => setForm((p) => ({ ...p, prioridad: e.target.value as Prioridad }))}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {PRIORIDADES.map((p) => (
                  <option key={p} value={p}>
                    {p[0].toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Vence</label>
              <input
                type="date"
                value={form.fecha_vencimiento ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, fecha_vencimiento: e.target.value || null }))}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Categoría</label>
            <select
              value={form.categoria_id ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, categoria_id: e.target.value || null }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Sin categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          {etiquetas.length > 0 && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Etiquetas</label>
              <div className="flex flex-wrap gap-2">
                {etiquetas.map((etq) => {
                  const activa = form.etiquetas.includes(etq.id);
                  return (
                    <button
                      type="button"
                      key={etq.id}
                      onClick={() => toggleEtiqueta(etq.id)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                        activa ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      #{etq.nombre}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onCerrar}
              className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
