import { useState } from 'react';
import { Menu, Plus, Search, X } from 'lucide-react';
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
import { Button } from '../components/ui/Button';
import { IconButton } from '../components/ui/IconButton';
import { Input } from '../components/ui/Input';
import type { Tarea, TareasFiltro } from '../types';
import { ApiError } from '../api/client';

export default function TasksPage() {
  const { usuario, logout } = useAuth();
  const categoriasState = useCategorias();
  const etiquetasState = useEtiquetas();

  const [filtro, setFiltro] = useState<TareasFiltro>({ ordenar: 'creado_en', direccion: 'desc', page: 1, limit: 20 });
  const [busquedaInput, setBusquedaInput] = useState('');
  const busquedaDebounced = useDebouncedValue(busquedaInput, 350);
  const [sidebarAbierta, setSidebarAbierta] = useState(false);

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
    <div className="flex min-h-screen bg-canvas">
      <Sidebar
        categorias={categoriasState.categorias}
        etiquetas={etiquetasState.etiquetas}
        onCrearCategoria={categoriasState.crear}
        onEliminarCategoria={async (id) => {
          await categoriasState.eliminar(id);
          await recargar();
        }}
        onCrearEtiqueta={etiquetasState.crear}
        usuario={usuario}
        onLogout={() => logout()}
        abiertoMovil={sidebarAbierta}
        onCerrarMovil={() => setSidebarAbierta(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-line bg-canvas/80 px-4 backdrop-blur md:px-6">
          <IconButton icon={Menu} aria-label="Abrir menú" className="lg:hidden" onClick={() => setSidebarAbierta(true)} />

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-semibold tracking-[-0.01em] text-ink">Mis tareas</h1>
            <p className="tabular text-xs text-ink-3">{meta.total} tareas</p>
          </div>

          <div className="hidden w-72 shrink-0 md:block">
            <Input
              icon={Search}
              placeholder="Buscar tareas…"
              value={busquedaInput}
              onChange={(e) => setBusquedaInput(e.target.value)}
              aria-label="Buscar tareas"
              trailing={
                busquedaInput ? (
                  <IconButton icon={X} size="sm" aria-label="Limpiar búsqueda" onClick={() => setBusquedaInput('')} />
                ) : undefined
              }
            />
          </div>

          <span className="hidden sm:inline-flex">
            <Button icon={Plus} onClick={abrirNuevaTarea}>
              Nueva tarea
            </Button>
          </span>
          <span className="sm:hidden">
            <IconButton icon={Plus} aria-label="Nueva tarea" onClick={abrirNuevaTarea} variant="secondary" />
          </span>
        </header>

        <main className="mx-auto w-full max-w-[1120px] flex-1 px-4 py-6 md:px-6">
          {errorAccion && (
            <div className="mb-4 rounded-field border border-danger-line bg-danger-soft px-3 py-2 text-sm text-danger">
              {errorAccion}
            </div>
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
      </div>

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
