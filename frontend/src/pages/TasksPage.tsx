import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCategorias } from '../hooks/useCategorias';
import { useEtiquetas } from '../hooks/useEtiquetas';
import { useTareas } from '../hooks/useTareas';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { Sidebar } from '../components/Sidebar';
import { FiltersBar } from '../components/FiltersBar';
import { TaskItem } from '../components/TaskItem';
import { TaskFormModal } from '../components/TaskFormModal';
import { Pagination } from '../components/Pagination';
import { EstadoCargando, EstadoError, EstadoVacio } from '../components/EstadoCarga';
import type { Tarea, TareasFiltro } from '../types';
import { ApiError } from '../api/client';

export default function TasksPage() {
  const { usuario, logout } = useAuth();
  const categoriasState = useCategorias();
  const etiquetasState = useEtiquetas();

  const [filtro, setFiltro] = useState<TareasFiltro>({ ordenar: 'creado_en', direccion: 'desc', page: 1, limit: 20 });
  const [busquedaInput, setBusquedaInput] = useState('');
  const busquedaDebounced = useDebouncedValue(busquedaInput, 350);

  const filtroConBusqueda: TareasFiltro = {
    ...filtro,
    busqueda: busquedaDebounced.trim() || undefined,
  };

  const { tareas, meta, cargando, error, crear, actualizar, eliminar, completar, recargar } =
    useTareas(filtroConBusqueda);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [tareaEditando, setTareaEditando] = useState<Tarea | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  function abrirNuevaTarea() {
    setTareaEditando(null);
    setModalAbierto(true);
  }

  function abrirEdicion(tarea: Tarea) {
    setTareaEditando(tarea);
    setModalAbierto(true);
  }

  async function handleGuardar(input: Parameters<typeof crear>[0]) {
    if (tareaEditando) {
      await actualizar(tareaEditando.id, input);
    } else {
      await crear(input);
    }
  }

  async function handleEliminar(id: string) {
    try {
      await eliminar(id);
    } catch (err) {
      setErrorAccion(err instanceof ApiError ? err.message : 'No se pudo eliminar la tarea.');
    }
  }

  async function handleCompletar(id: string, completada: boolean) {
    try {
      await completar(id, completada);
    } catch (err) {
      setErrorAccion(err instanceof ApiError ? err.message : 'No se pudo actualizar la tarea.');
    }
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar
        categorias={categoriasState.categorias}
        etiquetas={etiquetasState.etiquetas}
        onCrearCategoria={categoriasState.crear}
        onEliminarCategoria={async (id) => {
          await categoriasState.eliminar(id);
          await recargar();
        }}
        onCrearEtiqueta={etiquetasState.crear}
      />

      <main className="flex-1 p-4 lg:p-6">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Mis tareas</h1>
            <p className="text-sm text-slate-500">Hola, {usuario?.nombre}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={abrirNuevaTarea}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              + Nueva tarea
            </button>
            <button
              type="button"
              onClick={() => logout()}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        {errorAccion && (
          <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorAccion}</div>
        )}

        <div className="mb-4">
          <FiltersBar
            filtro={filtro}
            categorias={categoriasState.categorias}
            etiquetas={etiquetasState.etiquetas}
            busquedaInput={busquedaInput}
            onBusquedaChange={setBusquedaInput}
            onChange={setFiltro}
          />
        </div>

        {cargando && <EstadoCargando mensaje="Cargando tareas..." />}
        {!cargando && error && <EstadoError mensaje={error} onReintentar={recargar} />}
        {!cargando && !error && tareas.length === 0 && (
          <EstadoVacio
            titulo="No hay tareas que coincidan"
            descripcion="Ajusta los filtros o crea una nueva tarea para empezar."
          />
        )}

        {!cargando && !error && tareas.length > 0 && (
          <>
            <ul className="flex flex-col gap-2">
              {tareas.map((tarea) => (
                <TaskItem
                  key={tarea.id}
                  tarea={tarea}
                  onCompletar={handleCompletar}
                  onEditar={abrirEdicion}
                  onEliminar={handleEliminar}
                />
              ))}
            </ul>
            <div className="mt-4">
              <Pagination meta={meta} onCambiarPagina={(page) => setFiltro((f) => ({ ...f, page }))} />
            </div>
          </>
        )}
      </main>

      <TaskFormModal
        abierto={modalAbierto}
        tareaInicial={tareaEditando}
        categorias={categoriasState.categorias}
        etiquetas={etiquetasState.etiquetas}
        onCerrar={() => setModalAbierto(false)}
        onGuardar={handleGuardar}
      />
    </div>
  );
}
