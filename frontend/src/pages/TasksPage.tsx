import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Menu, Plus, Search, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCategorias } from '../hooks/useCategorias';
import { useEtiquetas } from '../hooks/useEtiquetas';
import { useTareas } from '../hooks/useTareas';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { rangoHoy, rangoProximas, useConteosTareas } from '../hooks/useConteosTareas';
import { Sidebar } from '../components/Sidebar';
import { FiltersBar } from '../components/FiltersBar';
import { TaskItem } from '../components/TaskItem';
import { TaskFormModal } from '../components/TaskFormModal';
import { Pagination } from '../components/Pagination';
import { EstadoCargando, EstadoError, EstadoVacio } from '../components/EstadoCarga';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { IconButton } from '../components/ui/IconButton';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import type { Tarea, TareasFiltro, VistaRapida } from '../types';
import { ApiError } from '../api/client';

const FILTRO_INICIAL: TareasFiltro = { ordenar: 'creado_en', direccion: 'desc', page: 1, limit: 20 };

function filtroDeVista(vista: VistaRapida): TareasFiltro {
  if (vista === 'hoy') {
    const { desde, hasta } = rangoHoy();
    return { ...FILTRO_INICIAL, completada: false, fecha_vencimiento_desde: desde, fecha_vencimiento_hasta: hasta };
  }
  if (vista === 'proximas') {
    const { desde, hasta } = rangoProximas();
    return { ...FILTRO_INICIAL, completada: false, fecha_vencimiento_desde: desde, fecha_vencimiento_hasta: hasta };
  }
  if (vista === 'completadas') {
    return { ...FILTRO_INICIAL, completada: true };
  }
  return FILTRO_INICIAL;
}

function detectarVista(filtro: TareasFiltro): VistaRapida {
  if (filtro.categoria || filtro.prioridad || filtro.etiquetas?.length) return 'todas';
  if (filtro.completada === true && !filtro.fecha_vencimiento_desde) return 'completadas';

  const hoy = rangoHoy();
  const proximas = rangoProximas();
  if (
    filtro.completada === false &&
    filtro.fecha_vencimiento_desde === hoy.desde &&
    filtro.fecha_vencimiento_hasta === hoy.hasta
  ) {
    return 'hoy';
  }
  if (
    filtro.completada === false &&
    filtro.fecha_vencimiento_desde === proximas.desde &&
    filtro.fecha_vencimiento_hasta === proximas.hasta
  ) {
    return 'proximas';
  }
  return 'todas';
}

export default function TasksPage() {
  const { usuario, logout } = useAuth();
  const { mostrarToast } = useToast();
  const categoriasState = useCategorias();
  const etiquetasState = useEtiquetas();
  const { conteos, recargarConteos } = useConteosTareas();

  const [filtro, setFiltro] = useState<TareasFiltro>(FILTRO_INICIAL);
  const [busquedaInput, setBusquedaInput] = useState('');
  const busquedaDebounced = useDebouncedValue(busquedaInput, 350);
  const [sidebarAbierta, setSidebarAbierta] = useState(false);

  const vistaActiva = detectarVista(filtro);

  const hayFiltrosActivos = Boolean(
    filtro.completada !== undefined ||
      filtro.prioridad ||
      filtro.categoria ||
      filtro.etiquetas?.length ||
      busquedaInput.trim() ||
      filtro.fecha_vencimiento_desde ||
      (filtro.ordenar && filtro.ordenar !== FILTRO_INICIAL.ordenar) ||
      (filtro.direccion && filtro.direccion !== FILTRO_INICIAL.direccion),
  );

  function limpiarFiltros() {
    setBusquedaInput('');
    setFiltro(FILTRO_INICIAL);
  }

  function seleccionarVista(vista: VistaRapida) {
    setBusquedaInput('');
    setFiltro(filtroDeVista(vista));
  }

  const filtroConBusqueda: TareasFiltro = {
    ...filtro,
    busqueda: busquedaDebounced.trim() || undefined,
  };

  const { tareas, meta, cargando, error, crear, actualizar, eliminar, completar, recargar } =
    useTareas(filtroConBusqueda);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [tareaEditando, setTareaEditando] = useState<Tarea | null>(null);

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
    recargarConteos();
  }

  async function handleEliminar(id: string) {
    try {
      await eliminar(id);
      recargarConteos();
    } catch (err) {
      mostrarToast({
        tono: 'danger',
        mensaje: err instanceof ApiError ? err.message : 'No se pudo eliminar la tarea.',
      });
    }
  }

  async function handleCompletar(id: string, completada: boolean) {
    try {
      await completar(id, completada);
      recargarConteos();
    } catch (err) {
      mostrarToast({
        tono: 'danger',
        mensaje: err instanceof ApiError ? err.message : 'No se pudo actualizar la tarea.',
      });
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
        vistaActiva={vistaActiva}
        conteos={conteos}
        onSeleccionarVista={seleccionarVista}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-line bg-canvas/80 px-4 backdrop-blur md:px-6">
          <IconButton icon={Menu} aria-label="Abrir menú" className="lg:hidden" onClick={() => setSidebarAbierta(true)} />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-xl font-semibold tracking-[-0.01em] text-ink">Mis tareas</h1>
              <Badge tone="brand" className="tabular">
                {meta.total}
              </Badge>
            </div>
            <p className="text-xs text-ink-3">Organiza tu día, tarea a tarea.</p>
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

          {cargando && <EstadoCargando />}
          {!cargando && error && <EstadoError mensaje={error} onReintentar={recargar} />}
          {!cargando && !error && tareas.length === 0 && (
            <EstadoVacio
              variante={hayFiltrosActivos ? 'con-filtros' : 'sin-filtros'}
              onCrearTarea={abrirNuevaTarea}
              onLimpiarFiltros={limpiarFiltros}
            />
          )}

          {!cargando && !error && tareas.length > 0 && (
            <>
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <AnimatePresence initial={false}>
                  {tareas.map((tarea) => (
                    <TaskItem
                      key={tarea.id}
                      tarea={tarea}
                      onCompletar={handleCompletar}
                      onEditar={abrirEdicion}
                      onEliminar={handleEliminar}
                    />
                  ))}
                </AnimatePresence>
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
