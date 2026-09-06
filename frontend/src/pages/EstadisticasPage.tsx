import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, BarChart3, Info, Menu, Plus, RotateCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCategorias } from '../hooks/useCategorias';
import { useEtiquetas } from '../hooks/useEtiquetas';
import { useTodasLasTareas } from '../hooks/useTodasLasTareas';
import { hoyEnZona } from '../utils/fechas';
import { calcularResumen } from '../utils/estadisticas';
import { Sidebar } from '../components/Sidebar';
import { DashboardCard } from '../components/estadisticas/DashboardCard';
import { StatTile } from '../components/estadisticas/StatTile';
import { Meter } from '../components/estadisticas/Meter';
import { Button } from '../components/ui/Button';
import { IconButton } from '../components/ui/IconButton';
import { Skeleton } from '../components/ui/Skeleton';

function EstadisticasCargando() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-card border border-line bg-surface/72 p-5 oscuro:bg-surface/85">
            <Skeleton className="h-7 w-16 rounded-full" />
            <Skeleton className="mt-2 h-3 w-20 rounded-full" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-card border border-line bg-surface/72 p-5 oscuro:bg-surface/85">
            <Skeleton className="mb-3 h-4 w-32 rounded-full" />
            <Skeleton className="h-16 w-full rounded-field" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EstadisticasPage() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const categoriasState = useCategorias();
  const etiquetasState = useEtiquetas();
  const [sidebarAbierta, setSidebarAbierta] = useState(false);
  const timezone = usuario?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

  const { tareas, cargando, error, truncado, recargar } = useTodasLasTareas();
  const resumen = calcularResumen(tareas, hoyEnZona(timezone));

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
        onFiltrarCategoria={() => navigate('/')}
        onFiltrarEtiqueta={() => navigate('/')}
        etiquetasActivas={[]}
        usuario={usuario}
        onLogout={() => logout()}
        abiertoMovil={sidebarAbierta}
        onCerrarMovil={() => setSidebarAbierta(false)}
        onSeleccionarVista={() => navigate('/')}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-[68px] shrink-0 items-center gap-3 border-b border-line/60 bg-surface/60 px-4 backdrop-blur-xl oscuro:bg-surface/80 md:px-6">
          <IconButton
            icon={Menu}
            aria-label="Abrir menú"
            className="lg:hidden"
            onClick={() => setSidebarAbierta(true)}
          />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-semibold tracking-[-0.02em] text-ink">Estadísticas</h1>
            <p className="text-[13.5px] text-ink-2">Tu actividad de un vistazo</p>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-6">
          {truncado && (
            <div className="mb-4 flex items-center gap-2 rounded-field border border-warn-line bg-warn-soft px-3 py-2 text-[13px] text-warn">
              <Info size={16} strokeWidth={1.75} aria-hidden="true" />
              Mostrando estadísticas sobre las primeras 1000 tareas.
            </div>
          )}

          {cargando && <EstadisticasCargando />}

          {!cargando && error && (
            <div className="flex flex-col items-center gap-3 rounded-card border border-danger-line bg-danger-soft px-6 py-10 text-center">
              <AlertTriangle size={20} strokeWidth={1.75} className="text-danger" aria-hidden="true" />
              <p className="text-sm text-danger">{error}</p>
              <Button variant="secondary" size="sm" icon={RotateCw} onClick={recargar}>
                Reintentar
              </Button>
            </div>
          )}

          {!cargando && !error && tareas.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-card border border-line/70 bg-surface/70 px-6 py-14 text-center backdrop-blur-sm oscuro:bg-surface/85">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand">
                <BarChart3 size={20} strokeWidth={1.75} aria-hidden="true" />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-ink">Todavía no tienes nada que medir</p>
                <p className="mt-1 text-sm text-ink-2">Crea tu primera tarea para empezar a ver estadísticas.</p>
              </div>
              <Button icon={Plus} onClick={() => navigate('/')}>
                Crear tarea
              </Button>
            </div>
          )}

          {!cargando && !error && tareas.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <StatTile etiqueta="Total" valor={resumen.total} />
                <StatTile etiqueta="Pendientes" valor={resumen.pendientes} />
                <StatTile etiqueta="Vencidas" valor={resumen.vencidas} destacarPeligro={resumen.vencidas > 0} />
                <StatTile etiqueta="Completadas esta semana" valor={resumen.completadasEstaSemana} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <DashboardCard>
                  <Meter valor={resumen.tasaFinalizacion} />
                </DashboardCard>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
