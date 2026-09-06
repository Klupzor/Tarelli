import { useRef, useState } from 'react';
import { Check, SlidersHorizontal, X } from 'lucide-react';
import type { Categoria, Etiqueta, Prioridad, TareasFiltro } from '../types';
import { Select } from './ui/Select';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { SegmentedControl } from './ui/SegmentedControl';
import { Popover } from './ui/Popover';

interface Props {
  filtro: TareasFiltro;
  categorias: Categoria[];
  etiquetas: Etiqueta[];
  busquedaInput: string;
  onBusquedaChange: (valor: string) => void;
  onChange: (filtro: TareasFiltro) => void;
}

const ESTADOS: { valor: string; etiqueta: string }[] = [
  { valor: '', etiqueta: 'Todas' },
  { valor: 'false', etiqueta: 'Pendientes' },
  { valor: 'true', etiqueta: 'Completadas' },
];

const PRIORIDADES: { valor: string; etiqueta: string }[] = [
  { valor: '', etiqueta: 'Todas' },
  { valor: 'alta', etiqueta: 'Alta' },
  { valor: 'media', etiqueta: 'Media' },
  { valor: 'baja', etiqueta: 'Baja' },
];

const OPCIONES_ORDEN = [
  { valor: 'creado_en:desc', etiqueta: 'Ordenar por: Más recientes' },
  { valor: 'creado_en:asc', etiqueta: 'Ordenar por: Más antiguas' },
  { valor: 'fecha_vencimiento:asc', etiqueta: 'Ordenar por: Vencimiento próximo' },
  { valor: 'prioridad:desc', etiqueta: 'Ordenar por: Prioridad (Z-A)' },
  { valor: 'titulo:asc', etiqueta: 'Ordenar por: Título (A-Z)' },
];

const FILTRO_INICIAL: TareasFiltro = { ordenar: 'creado_en', direccion: 'desc', page: 1, limit: 20 };

export function FiltersBar({ filtro, categorias, etiquetas, busquedaInput, onBusquedaChange, onChange }: Props) {
  const [popoverAbierto, setPopoverAbierto] = useState(false);
  const disparadorRef = useRef<HTMLButtonElement>(null);

  const estadoActual = (filtro.completada === undefined ? '' : String(filtro.completada)) as '' | 'false' | 'true';
  const etiquetasActivas = filtro.etiquetas ?? [];

  const filtrosPopoverActivos = (filtro.prioridad ? 1 : 0) + (filtro.categoria ? 1 : 0) + etiquetasActivas.length;

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

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SegmentedControl
        aria-label="Filtrar por estado"
        layoutId="filtro-segmento-estado"
        opciones={ESTADOS.map((e) => ({ valor: e.valor, etiqueta: e.etiqueta }))}
        valor={estadoActual}
        onChange={cambiarEstado}
      />

      <Button
        ref={disparadorRef}
        variant="secondary"
        size="sm"
        icon={SlidersHorizontal}
        onClick={() => setPopoverAbierto((v) => !v)}
        aria-expanded={popoverAbierto}
      >
        Filtros
        {filtrosPopoverActivos > 0 && (
          <Badge tone="brand" className="ml-1">
            {filtrosPopoverActivos}
          </Badge>
        )}
      </Button>

      <div className="ml-auto">
        <Select compact value={`${filtro.ordenar ?? 'creado_en'}:${filtro.direccion ?? 'desc'}`} onChange={(e) => cambiarOrden(e.target.value)}>
          {OPCIONES_ORDEN.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.etiqueta}
            </option>
          ))}
        </Select>
      </div>

      <Popover
        abierto={popoverAbierto}
        onCerrar={() => setPopoverAbierto(false)}
        disparadorRef={disparadorRef}
        titulo="Filtros"
      >
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">Prioridad</p>
            <SegmentedControl
              aria-label="Filtrar por prioridad"
              layoutId="filtro-segmento-prioridad"
              opciones={PRIORIDADES}
              valor={filtro.prioridad ?? ''}
              onChange={cambiarPrioridad}
              className="w-full"
            />
          </div>

          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">Categoría</p>
            <Select compact value={filtro.categoria ?? ''} onChange={(e) => cambiarCategoria(e.target.value)} className="w-full">
              <option value="">Cualquier categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </Select>
          </div>

          {etiquetas.length > 0 && (
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">Etiquetas</p>
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
                <p className="mt-1.5 text-xs text-ink-3">
                  Se muestran las tareas que tienen todas las etiquetas seleccionadas.
                </p>
              )}
            </div>
          )}

          {hayFiltrosActivos && (
            <Button variant="ghost" size="sm" icon={X} onClick={limpiarFiltros} className="w-full">
              Limpiar filtros
            </Button>
          )}
        </div>
      </Popover>
    </div>
  );
}
