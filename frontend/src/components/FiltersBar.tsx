import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Search, SlidersHorizontal, X } from 'lucide-react';
import type { Categoria, Etiqueta, Prioridad, TareasFiltro } from '../types';
import { Input } from './ui/Input';
import { IconButton } from './ui/IconButton';
import { Select } from './ui/Select';
import { Button } from './ui/Button';

interface Props {
  filtro: TareasFiltro;
  categorias: Categoria[];
  etiquetas: Etiqueta[];
  busquedaInput: string;
  onBusquedaChange: (valor: string) => void;
  onChange: (filtro: TareasFiltro) => void;
}

const ESTADOS = [
  { valor: '', etiqueta: 'Todas' },
  { valor: 'false', etiqueta: 'Pendientes' },
  { valor: 'true', etiqueta: 'Completadas' },
];

const OPCIONES_ORDEN = [
  { valor: 'creado_en:desc', etiqueta: 'Más recientes' },
  { valor: 'creado_en:asc', etiqueta: 'Más antiguas' },
  { valor: 'fecha_vencimiento:asc', etiqueta: 'Vencimiento próximo' },
  { valor: 'prioridad:desc', etiqueta: 'Prioridad (Z-A)' },
  { valor: 'titulo:asc', etiqueta: 'Título (A-Z)' },
];

const FILTRO_INICIAL: TareasFiltro = { ordenar: 'creado_en', direccion: 'desc', page: 1, limit: 20 };

export function FiltersBar({ filtro, categorias, etiquetas, busquedaInput, onBusquedaChange, onChange }: Props) {
  const [panelAbierto, setPanelAbierto] = useState(false);

  const estadoActual = filtro.completada === undefined ? '' : String(filtro.completada);
  const etiquetasActivas = filtro.etiquetas ?? [];

  const hayFiltrosActivos = Boolean(
    filtro.completada !== undefined ||
      filtro.prioridad ||
      filtro.categoria ||
      etiquetasActivas.length > 0 ||
      busquedaInput.trim() ||
      (filtro.ordenar && filtro.ordenar !== 'creado_en') ||
      (filtro.direccion && filtro.direccion !== 'desc'),
  );

  function limpiarFiltros() {
    onBusquedaChange('');
    onChange({ ...FILTRO_INICIAL });
  }

  function cambiarEstado(valor: string) {
    onChange({ ...filtro, completada: valor === '' ? undefined : valor === 'true', page: 1 });
  }

  function cambiarPrioridad(valor: string) {
    onChange({ ...filtro, prioridad: (valor || undefined) as Prioridad | undefined, page: 1 });
  }

  function cambiarCategoria(valor: string) {
    onChange({ ...filtro, categoria: valor || undefined, page: 1 });
  }

  function cambiarOrden(valor: string) {
    const [ordenar, direccion] = valor.split(':') as [TareasFiltro['ordenar'], 'asc' | 'desc'];
    onChange({ ...filtro, ordenar, direccion, page: 1 });
  }

  function toggleEtiqueta(id: string) {
    const nuevas = etiquetasActivas.includes(id) ? etiquetasActivas.filter((e) => e !== id) : [...etiquetasActivas, id];
    onChange({ ...filtro, etiquetas: nuevas.length ? nuevas : undefined, page: 1 });
  }

  const chipsEtiquetas = (
    <>
      <div className="flex flex-wrap gap-1.5">
        {etiquetas.map((etq) => {
          const activa = etiquetasActivas.includes(etq.id);
          return (
            <button
              key={etq.id}
              type="button"
              aria-pressed={activa}
              onClick={() => toggleEtiqueta(etq.id)}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12.5px] font-medium transition-colors duration-120 ${
                activa
                  ? 'border-brand-line bg-brand-soft text-brand'
                  : 'border-line bg-surface text-ink-2 hover:bg-surface-2'
              }`}
            >
              {activa && <Check size={12} strokeWidth={2.5} aria-hidden="true" />}#{etq.nombre}
            </button>
          );
        })}
      </div>
      {etiquetasActivas.length >= 2 && (
        <p className="mt-1.5 text-xs text-ink-3">Se muestran las tareas que tienen todas las etiquetas seleccionadas.</p>
      )}
    </>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-[160px] flex-1 md:hidden">
          <Input
            icon={Search}
            placeholder="Buscar tareas…"
            value={busquedaInput}
            onChange={(e) => onBusquedaChange(e.target.value)}
            aria-label="Buscar tareas"
            trailing={
              busquedaInput ? (
                <IconButton icon={X} size="sm" aria-label="Limpiar búsqueda" onClick={() => onBusquedaChange('')} />
              ) : undefined
            }
          />
        </div>

        <div className="inline-flex h-8 shrink-0 items-center rounded-field bg-surface-2 p-0.5">
          {ESTADOS.map((estado) => (
            <button
              key={estado.valor}
              type="button"
              aria-pressed={estadoActual === estado.valor}
              onClick={() => cambiarEstado(estado.valor)}
              className={`relative h-7 rounded-[6px] px-3 text-[13px] font-medium transition-colors duration-120 ${
                estadoActual === estado.valor ? 'text-ink' : 'text-ink-2 hover:text-ink'
              }`}
            >
              {estadoActual === estado.valor && (
                <motion.span
                  layoutId="filtro-segmento-activo"
                  className="absolute inset-0 rounded-[6px] bg-surface shadow-xs"
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                />
              )}
              <span className="relative">{estado.etiqueta}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setPanelAbierto((v) => !v)}
          aria-expanded={panelAbierto}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-field border border-line bg-surface px-3 text-[13px] font-medium text-ink-2 hover:bg-surface-2 md:hidden"
        >
          <SlidersHorizontal size={16} strokeWidth={1.75} aria-hidden="true" />
          Filtros
        </button>

        <div className="hidden items-center gap-2 md:flex">
          <Select compact value={filtro.prioridad ?? ''} onChange={(e) => cambiarPrioridad(e.target.value)}>
            <option value="">Cualquier prioridad</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </Select>

          <Select compact value={filtro.categoria ?? ''} onChange={(e) => cambiarCategoria(e.target.value)}>
            <option value="">Cualquier categoría</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Select>

          <Select
            compact
            value={`${filtro.ordenar ?? 'creado_en'}:${filtro.direccion ?? 'desc'}`}
            onChange={(e) => cambiarOrden(e.target.value)}
          >
            {OPCIONES_ORDEN.map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.etiqueta}
              </option>
            ))}
          </Select>

          {hayFiltrosActivos && (
            <Button variant="ghost" size="sm" icon={X} onClick={limpiarFiltros}>
              Limpiar
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {panelAbierto && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden md:hidden"
          >
            <div className="flex flex-col gap-2 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <Select compact value={filtro.prioridad ?? ''} onChange={(e) => cambiarPrioridad(e.target.value)}>
                  <option value="">Cualquier prioridad</option>
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </Select>

                <Select compact value={filtro.categoria ?? ''} onChange={(e) => cambiarCategoria(e.target.value)}>
                  <option value="">Cualquier categoría</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </Select>
              </div>

              <Select
                compact
                value={`${filtro.ordenar ?? 'creado_en'}:${filtro.direccion ?? 'desc'}`}
                onChange={(e) => cambiarOrden(e.target.value)}
              >
                {OPCIONES_ORDEN.map((o) => (
                  <option key={o.valor} value={o.valor}>
                    {o.etiqueta}
                  </option>
                ))}
              </Select>

              {etiquetas.length > 0 && chipsEtiquetas}

              {hayFiltrosActivos && (
                <Button variant="ghost" size="sm" icon={X} onClick={limpiarFiltros} className="w-full">
                  Limpiar filtros
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {etiquetas.length > 0 && <div className="hidden md:block">{chipsEtiquetas}</div>}
    </div>
  );
}
