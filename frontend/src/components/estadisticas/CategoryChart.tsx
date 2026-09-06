import { useState } from 'react';
import { Table2 } from 'lucide-react';
import type { BarraCategoria } from '../../utils/estadisticas';
import { IconButton } from '../ui/IconButton';
import { ChartTooltip } from './ChartTooltip';
import { TablaDatos } from './TablaDatos';

interface CategoryChartProps {
  datos: BarraCategoria[];
}

const ALTURA_BARRA = 10;

/** Comparación de magnitud, un solo color: la identidad la dan las etiquetas del eje (§5.3). */
export function CategoryChart({ datos }: CategoryChartProps) {
  const [vistaTabla, setVistaTabla] = useState(false);
  const [activo, setActivo] = useState<string | null>(null);

  const hayDatos = datos.length > 0;
  const max = hayDatos ? Math.max(...datos.map((d) => d.valor)) : 0;
  const total = datos.reduce((acc, d) => acc + d.valor, 0);
  const resumen = datos.map((d) => `${d.nombre} ${d.valor}`).join(', ');
  const claveActiva = (d: BarraCategoria) => d.categoriaId ?? 'otras';

  return (
    <figure>
      <div className="mb-3 flex items-center justify-between gap-2">
        <figcaption className="text-[14.5px] font-semibold text-ink">Pendientes por categoría</figcaption>
        {hayDatos && (
          <IconButton
            icon={Table2}
            size="sm"
            variant={vistaTabla ? 'secondary' : 'ghost'}
            aria-label={vistaTabla ? 'Mostrar gráfica' : 'Mostrar tabla de datos'}
            aria-pressed={vistaTabla}
            onClick={() => setVistaTabla((v) => !v)}
          />
        )}
      </div>

      {!hayDatos ? (
        <p className="text-sm text-ink-2">No hay tareas pendientes con categoría.</p>
      ) : vistaTabla ? (
        <TablaDatos
          caption="Pendientes por categoría"
          columnas={['Categoría', 'Tareas', 'Porcentaje']}
          filas={datos.map((c) => [c.nombre, c.valor, `${Math.round((c.valor / total) * 100)}%`])}
        />
      ) : (
        <div role="img" aria-label={`Pendientes por categoría: ${resumen}`} className="flex flex-col gap-3">
          {datos.map((cat) => {
            const clave = claveActiva(cat);
            return (
              <button
                key={clave}
                type="button"
                className="relative flex w-full flex-col gap-1 rounded-field p-1 text-left"
                onMouseEnter={() => setActivo(clave)}
                onMouseLeave={() => setActivo(null)}
                onFocus={() => setActivo(clave)}
                onBlur={() => setActivo(null)}
              >
                <span className="truncate text-xs text-ink-2">{cat.nombre}</span>
                <span className="flex items-center gap-2">
                  <svg
                    viewBox={`0 0 100 ${ALTURA_BARRA}`}
                    preserveAspectRatio="none"
                    className="h-2.5 flex-1"
                    aria-hidden="true"
                  >
                    <rect x={0} y={0} width={100} height={ALTURA_BARRA} rx={ALTURA_BARRA / 2} className="fill-surface-2" />
                    <rect
                      x={0}
                      y={0}
                      width={max === 0 ? 0 : (cat.valor / max) * 100}
                      height={ALTURA_BARRA}
                      rx={ALTURA_BARRA / 2}
                      style={{ fill: 'var(--color-dato-serie)' }}
                    />
                  </svg>
                  <span className="tabular w-8 shrink-0 text-right text-xs text-ink-2">{cat.valor}</span>
                </span>
                {activo === clave && (
                  <ChartTooltip xPct={Math.min(92, Math.max(8, max === 0 ? 8 : (cat.valor / max) * 90))}>
                    {cat.nombre}: <span className="tabular font-medium">{cat.valor}</span> (
                    {Math.round((cat.valor / total) * 100)}%)
                  </ChartTooltip>
                )}
              </button>
            );
          })}
        </div>
      )}
    </figure>
  );
}
