import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useCategorias } from '../hooks/useCategorias';
import { useEtiquetas } from '../hooks/useEtiquetas';
import { useTareas } from '../hooks/useTareas';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { hoyEnZona, sumarDias } from '../utils/fechas';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { FiltersBar } from '../components/FiltersBar';
import { TaskItem } from '../components/TaskItem';
import { TaskFormModal } from '../components/TaskFormModal';
import { Pagination } from '../components/Pagination';
import { EstadoCargando, EstadoError, EstadoVacio } from '../components/EstadoCarga';
import { useToast } from '../components/ui/Toast';
import type { Tarea, TareasFiltro, VistaRapida } from '../types';
import { ApiError } from '../api/client';

const FILTRO_INICIAL: TareasFiltro = { ordenar: 'creado_en', direccion: 'desc', page: 1, limit: 20 };

const TITULOS_VISTA: Record<VistaRapida, string> = {
  todas: 'Mis tareas',
  hoy: 'Hoy',
  proximas: 'Próximas',
  completadas: 'Completadas',
};

function filtroDeVista(vista: VistaRapida, timezone: string): TareasFiltro {
  if (vista === 'hoy') {
    return { ...FILTRO_INICIAL, fecha_vencimiento_hasta: hoyEnZona(timezone) };
  }
  if (vista === 'proximas') {
    return { ...FILTRO_INICIAL, fecha_vencimiento_desde: sumarDias(hoyEnZona(timezone), 1) };
  }
  if (vista === 'completadas') {
    return { ...FILTRO_INICIAL, completada: true };
  }
  return FILTRO_INICIAL;
}

function detectarVista(filtro: TareasFiltro, timezone: string): VistaRapida {
  if (filtro.categoria || filtro.prioridad || filtro.etiquetas?.length) return 'todas';

  const hoy = hoyEnZona(timezone);
  const manana = sumarDias(hoy, 1);

  if (filtro.fecha_vencimiento_hasta === hoy && !filtro.fecha_vencimiento_desde) return 'hoy';
  if (filtro.fecha_vencimiento_desde === manana && !filtro.fecha_vencimiento_hasta) return 'proximas';
  if (filtro.completada === true) return 'completadas';
  return 'todas';
}

export default function TasksPage() {
  const { usuario, logout } = useAuth();
  const { mostrarToast } = useToast();
  const categoriasState = useCategorias();
  const etiquetasState = useEtiquetas();
  const timezone = usuario?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

  const [filtro, setFiltro] = useState<TareasFiltro>(FILTRO_INICIAL);
  const [busquedaInput, setBusquedaInput] = useState('');
  const busquedaDebounced = useDebouncedValue(busquedaInput, 350);
  const [sidebarAbierta, setSidebarAbierta] = useState(false);

  const vistaActiva = detectarVista(filtro, timezone);

  const hayFiltrosActivos = Boolean(
    filtro.completada !== undefined ||
      filtro.prioridad ||
      filtro.categoria ||
      filtro.etiquetas?.length ||
      busquedaInput.trim() ||
      filtro.fecha_vencimiento_desde ||
      filtro.fecha_vencimiento_hasta ||
      (filtro.ordenar && filtro.ordenar !== FILTRO_INICIAL.ordenar) ||
      (filtro.direccion && filtro.direccion !== FILTRO_INICIAL.direccion),
  );

  function limpiarFiltros() {
    setBusquedaInput('');
    setFiltro(FILTRO_INICIAL);
  }

  function seleccionarVista(vista: VistaRapida) {
    setBusquedaInput('');
    setFiltro(filtroDeVista(vista, timezone));
  }

  function filtrarPorCategoria(id: string) {
    setBusquedaInput('');
    setFiltro({ ...FILTRO_INICIAL, categoria: id });
  }

  function alternarEtiquetaFiltro(id: string) {
    setFiltro((f) => {
      const actuales = f.etiquetas ?? [];
      const nuevas = actuales.includes(id) ? actuales.filter((e) => e !== id) : [...actuales, id];
      return { ...f, etiquetas: nuevas.length ? nuevas : undefined, page: 1 };
    });
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
  }

  async function handleEliminar(id: string) {
    try {
      await eliminar(id);
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
    } catch (err) {
      mostrarToast({
        tono: 'danger',
        mensaje: err instanceof ApiError ? err.message : 'No se pudo actualizar la tarea.',
      });
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        categorias={categoriasState.categorias}
        etiquetas={etiquetasState.etiquetas}
        onCrearCategoria={categoriasState.crear}
        onEliminarCategoria={async (id) => {
          await categoriasState.eliminar(id);
          await recargar();
        }}
        onCrearEtiqueta={etiquetasState.crear}
        onFiltrarCategoria={filtrarPorCategoria}
        onFiltrarEtiqueta={alternarEtiquetaFiltro}
        categoriaActiva={filtro.categoria}
        etiquetasActivas={filtro.etiquetas ?? []}
        usuario={usuario}
        onLogout={() => logout()}
        abiertoMovil={sidebarAbierta}
        onCerrarMovil={() => setSidebarAbierta(false)}
        vistaActiva={vistaActiva}
        onSeleccionarVista={seleccionarVista}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          tituloVista={TITULOS_VISTA[vistaActiva]}
          total={meta.total}
          busquedaInput={busquedaInput}
          onBusquedaChange={setBusquedaInput}
          onAbrirMenu={() => setSidebarAbierta(true)}
          onNuevaTarea={abrirNuevaTarea}
        />

        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-6">
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
