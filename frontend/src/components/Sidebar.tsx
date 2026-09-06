import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  BarChart3,
  CalendarDays,
  Check,
  CheckCircle,
  ChevronRight,
  Clock,
  Folder,
  ListChecks,
  LogOut,
  Monitor,
  Moon,
  Plus,
  Sun,
  Tag,
  Trash2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Categoria, Etiqueta, Usuario, VistaRapida } from '../types';
import { ApiError } from '../api/client';
import { colorCategoria, PUNTO_COLOR_CATEGORIA } from '../utils/colorCategoria';
import { useTheme } from '../context/ThemeContext';
import type { PreferenciaTema } from '../context/ThemeContext';
import { LogoMark } from './ui/LogoMark';
import { IconButton } from './ui/IconButton';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { SegmentedControl } from './ui/SegmentedControl';
import { useToast } from './ui/Toast';

const OPCIONES_TEMA: { valor: PreferenciaTema; etiqueta: string; icono: LucideIcon }[] = [
  { valor: 'claro', etiqueta: 'Tema claro', icono: Sun },
  { valor: 'oscuro', etiqueta: 'Tema oscuro', icono: Moon },
  { valor: 'sistema', etiqueta: 'Seguir al sistema', icono: Monitor },
];

interface Props {
  categorias: Categoria[];
  etiquetas: Etiqueta[];
  onCrearCategoria: (nombre: string) => Promise<unknown>;
  onEliminarCategoria: (id: string) => Promise<void>;
  onCrearEtiqueta: (nombre: string) => Promise<unknown>;
  onFiltrarCategoria: (id: string) => void;
  onFiltrarEtiqueta: (id: string) => void;
  categoriaActiva?: string;
  etiquetasActivas: string[];
  usuario: Usuario | null;
  onLogout: () => void;
  abiertoMovil: boolean;
  onCerrarMovil: () => void;
  /** `undefined` fuera de `/`, donde ninguna vista rápida aplica (p. ej. en /estadisticas). */
  vistaActiva?: VistaRapida;
  onSeleccionarVista: (vista: VistaRapida) => void;
}

function obtenerIniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).slice(0, 2);
  const iniciales = partes.map((p) => p[0]?.toUpperCase() ?? '').join('');
  return iniciales || '?';
}

const VISTAS: { valor: VistaRapida; etiqueta: string; icono: LucideIcon }[] = [
  { valor: 'todas', etiqueta: 'Tareas', icono: ListChecks },
  { valor: 'hoy', etiqueta: 'Hoy', icono: CalendarDays },
  { valor: 'proximas', etiqueta: 'Próximas', icono: Clock },
  { valor: 'completadas', etiqueta: 'Completadas', icono: CheckCircle },
];

interface ContenidoProps {
  categorias: Categoria[];
  etiquetas: Etiqueta[];
  onCrearCategoria: (nombre: string) => Promise<unknown>;
  onEliminarCategoria: (id: string) => Promise<void>;
  onCrearEtiqueta: (nombre: string) => Promise<unknown>;
  onFiltrarCategoria: (id: string) => void;
  onFiltrarEtiqueta: (id: string) => void;
  categoriaActiva?: string;
  etiquetasActivas: string[];
  usuario: Usuario | null;
  onLogout: () => void;
  onAccionCompletada: () => void;
  /** `undefined` fuera de `/`, donde ninguna vista rápida aplica (p. ej. en /estadisticas). */
  vistaActiva?: VistaRapida;
  onSeleccionarVista: (vista: VistaRapida) => void;
}

function ItemVista({
  icon: Icon,
  etiqueta,
  activo,
  onClick,
  reducedMotion,
}: {
  icon: LucideIcon;
  etiqueta: string;
  activo: boolean;
  onClick: () => void;
  reducedMotion: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={activo ? 'page' : undefined}
      className={`relative flex h-9 w-full items-center gap-2 rounded-field px-2.5 text-[13.5px] font-medium transition-colors duration-120 ${
        activo ? 'bg-brand-soft text-brand' : 'text-ink-2 hover:bg-surface-2/70'
      }`}
    >
      {activo && (
        <motion.span
          layoutId="vista-activa-barra"
          className="absolute bottom-1.5 left-0 top-1.5 w-[3px] rounded-full bg-brand"
          transition={{ duration: reducedMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
        />
      )}
      <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
      {etiqueta}
    </button>
  );
}

/** Igual que `ItemVista`, pero navega a una ruta real en vez de fijar un filtro local. */
function ItemVistaEnlace({
  icon: Icon,
  etiqueta,
  to,
  onNavegar,
  reducedMotion,
}: {
  icon: LucideIcon;
  etiqueta: string;
  to: string;
  onNavegar: () => void;
  reducedMotion: boolean;
}) {
  const location = useLocation();
  const activo = location.pathname === to;

  return (
    <Link
      to={to}
      onClick={onNavegar}
      aria-current={activo ? 'page' : undefined}
      className={`relative flex h-9 w-full items-center gap-2 rounded-field px-2.5 text-[13.5px] font-medium transition-colors duration-120 ${
        activo ? 'bg-brand-soft text-brand' : 'text-ink-2 hover:bg-surface-2/70'
      }`}
    >
      {activo && (
        <motion.span
          layoutId="vista-activa-barra"
          className="absolute bottom-1.5 left-0 top-1.5 w-[3px] rounded-full bg-brand"
          transition={{ duration: reducedMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
        />
      )}
      <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
      {etiqueta}
    </Link>
  );
}

function SeccionColapsable({
  icon: Icon,
  titulo,
  abierta,
  onToggle,
  reducedMotion,
  children,
}: {
  icon: LucideIcon;
  titulo: string;
  abierta: boolean;
  onToggle: () => void;
  reducedMotion: boolean;
  children: ReactNode;
}) {
  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={abierta}
        className="flex h-8 w-full items-center gap-2 rounded-field px-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 hover:bg-surface-2/70"
      >
        <Icon size={14} strokeWidth={1.75} aria-hidden="true" />
        <span className="flex-1 text-left">{titulo}</span>
        <ChevronRight
          size={14}
          strokeWidth={1.75}
          aria-hidden="true"
          className={`transition-transform duration-180 ${abierta ? 'rotate-90' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {abierta && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.18 }}
          >
            <div className="pb-1 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarContenido({
  categorias,
  etiquetas,
  onCrearCategoria,
  onEliminarCategoria,
  onCrearEtiqueta,
  onFiltrarCategoria,
  onFiltrarEtiqueta,
  categoriaActiva,
  etiquetasActivas,
  usuario,
  onLogout,
  onAccionCompletada,
  vistaActiva,
  onSeleccionarVista,
}: ContenidoProps) {
  const { mostrarToast } = useToast();
  const { preferencia, setPreferencia } = useTheme();
  const reducedMotion = Boolean(useReducedMotion());
  const [categoriasAbiertas, setCategoriasAbiertas] = useState(false);
  const [etiquetasAbiertas, setEtiquetasAbiertas] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [nuevaEtiqueta, setNuevaEtiqueta] = useState('');
  const [categoriaConfirmando, setCategoriaConfirmando] = useState<Categoria | null>(null);
  const [eliminandoCategoria, setEliminandoCategoria] = useState(false);

  async function crearCategoria(e: FormEvent) {
    e.preventDefault();
    if (!nuevaCategoria.trim()) return;
    try {
      await onCrearCategoria(nuevaCategoria.trim());
      setNuevaCategoria('');
    } catch (err) {
      mostrarToast({
        tono: 'danger',
        mensaje: err instanceof ApiError ? err.message : 'No se pudo crear la categoría.',
      });
    }
  }

  async function crearEtiqueta(e: FormEvent) {
    e.preventDefault();
    if (!nuevaEtiqueta.trim()) return;
    try {
      await onCrearEtiqueta(nuevaEtiqueta.trim());
      setNuevaEtiqueta('');
    } catch (err) {
      mostrarToast({
        tono: 'danger',
        mensaje: err instanceof ApiError ? err.message : 'No se pudo crear la etiqueta.',
      });
    }
  }

  async function confirmarEliminarCategoria() {
    if (!categoriaConfirmando) return;
    setEliminandoCategoria(true);
    try {
      await onEliminarCategoria(categoriaConfirmando.id);
      setCategoriaConfirmando(null);
    } catch (err) {
      mostrarToast({
        tono: 'danger',
        mensaje: err instanceof ApiError ? err.message : 'No se pudo eliminar la categoría.',
      });
    } finally {
      setEliminandoCategoria(false);
    }
  }

  return (
    <>
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-line/70 px-4">
        <LogoMark size={28} />
        <span className="text-[15px] font-semibold text-ink">Tarelli</span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <nav className="mb-3 flex flex-col gap-0.5">
          {VISTAS.map((vista) => (
            <ItemVista
              key={vista.valor}
              icon={vista.icono}
              etiqueta={vista.etiqueta}
              activo={vistaActiva === vista.valor}
              onClick={() => {
                onSeleccionarVista(vista.valor);
                onAccionCompletada();
              }}
              reducedMotion={reducedMotion}
            />
          ))}
          <ItemVistaEnlace
            icon={BarChart3}
            etiqueta="Estadísticas"
            to="/estadisticas"
            onNavegar={onAccionCompletada}
            reducedMotion={reducedMotion}
          />
        </nav>

        <hr className="mx-1 mb-3 border-line/70" />

        <SeccionColapsable
          icon={Folder}
          titulo="Categorías"
          abierta={categoriasAbiertas}
          onToggle={() => setCategoriasAbiertas((v) => !v)}
          reducedMotion={reducedMotion}
        >
          <ul className="flex flex-col gap-0.5">
            {categorias.map((c) => (
              <li
                key={c.id}
                className={`group flex h-8 items-center gap-1 rounded-field px-2 ${
                  categoriaActiva === c.id ? 'bg-brand-soft' : 'hover:bg-surface-2/70'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    onFiltrarCategoria(c.id);
                    onAccionCompletada();
                  }}
                  aria-pressed={categoriaActiva === c.id}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${PUNTO_COLOR_CATEGORIA[colorCategoria(c.id)]}`}
                    aria-hidden="true"
                  />
                  <span className={`truncate text-sm ${categoriaActiva === c.id ? 'font-medium text-brand' : 'text-ink'}`}>
                    {c.nombre}
                  </span>
                </button>
                <IconButton
                  icon={Trash2}
                  size="sm"
                  variant="danger"
                  aria-label={`Eliminar categoría ${c.nombre}`}
                  className="opacity-0 group-hover:opacity-100 focus-within:opacity-100"
                  onClick={() => setCategoriaConfirmando(c)}
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
              className="h-8 min-w-0 flex-1 rounded-field border border-line bg-surface/80 px-2.5 text-[13px] text-ink placeholder:text-ink-3 focus:border-brand"
            />
            <IconButton icon={Plus} size="sm" variant="secondary" aria-label="Crear categoría" type="submit" />
          </form>
        </SeccionColapsable>

        <SeccionColapsable
          icon={Tag}
          titulo="Etiquetas"
          abierta={etiquetasAbiertas}
          onToggle={() => setEtiquetasAbiertas((v) => !v)}
          reducedMotion={reducedMotion}
        >
          <div className="flex flex-wrap gap-1.5 px-1">
            {etiquetas.map((e) => {
              const activa = etiquetasActivas.includes(e.id);
              return (
                <button
                  key={e.id}
                  type="button"
                  aria-pressed={activa}
                  onClick={() => onFiltrarEtiqueta(e.id)}
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[12px] font-medium ${
                    activa
                      ? 'border-brand-line bg-brand-soft text-brand'
                      : 'border-line bg-surface/80 text-ink-2 hover:bg-surface-2/70'
                  }`}
                >
                  {activa && <Check size={11} strokeWidth={2.5} aria-hidden="true" />}#{e.nombre}
                </button>
              );
            })}
            {etiquetas.length === 0 && <p className="text-sm text-ink-3">Sin etiquetas aún.</p>}
          </div>
          <form onSubmit={crearEtiqueta} className="mt-2 flex gap-1.5 px-1">
            <input
              value={nuevaEtiqueta}
              onChange={(e) => setNuevaEtiqueta(e.target.value)}
              placeholder="Nueva etiqueta"
              className="h-8 min-w-0 flex-1 rounded-field border border-line bg-surface/80 px-2.5 text-[13px] text-ink placeholder:text-ink-3 focus:border-brand"
            />
            <IconButton icon={Plus} size="sm" variant="secondary" aria-label="Crear etiqueta" type="submit" />
          </form>
        </SeccionColapsable>
      </div>

      <div className="flex shrink-0 flex-col gap-2.5 border-t border-line/70 px-4 py-3">
        <SegmentedControl
          aria-label="Tema de la aplicación"
          layoutId="tema-segmento"
          opciones={OPCIONES_TEMA}
          valor={preferencia}
          onChange={setPreferencia}
          className="self-start"
        />
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[12px] font-semibold text-brand">
            {usuario ? obtenerIniciales(usuario.nombre) : '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-ink">{usuario?.nombre}</p>
            <p className="truncate text-xs text-ink-3">{usuario?.email}</p>
          </div>
          <IconButton icon={LogOut} size="sm" aria-label="Cerrar sesión" onClick={onLogout} />
        </div>
      </div>

      <ConfirmDialog
        abierto={categoriaConfirmando !== null}
        titulo="Eliminar categoría"
        descripcion={`¿Eliminar la categoría "${categoriaConfirmando?.nombre}"? Las tareas quedarán sin categoría.`}
        textoConfirmar="Eliminar"
        tono="danger"
        cargando={eliminandoCategoria}
        onConfirmar={confirmarEliminarCategoria}
        onCancelar={() => setCategoriaConfirmando(null)}
      />
    </>
  );
}

export function Sidebar({ abiertoMovil, onCerrarMovil, ...contenido }: Props) {
  const reducedMotion = useReducedMotion();

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-line/70 bg-surface/70 backdrop-blur-xl oscuro:bg-surface/80 lg:flex">
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
        className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.16 }}
        onClick={onCerrar}
        aria-hidden="true"
      />
      <motion.aside
        className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-line/70 bg-surface/90 shadow-lg backdrop-blur-xl"
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
