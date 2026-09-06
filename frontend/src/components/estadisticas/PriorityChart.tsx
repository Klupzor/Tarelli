import { useId, useState } from 'react';
import { Table2 } from 'lucide-react';
import type { Prioridad } from '../../types';
import type { SegmentoPrioridad } from '../../utils/estadisticas';
import { IconButton } from '../ui/IconButton';
import { ChartTooltip } from './ChartTooltip';
import { TablaDatos } from './TablaDatos';

interface PriorityChartProps {
  datos: SegmentoPrioridad[];
}

const ALTURA = 12;
const RADIO = ALTURA / 2;
const ANCHO_VIEWBOX = 300;
const HUECO = 2;

const COLOR: Record<Prioridad, string> = {
  alta: 'var(--color-dato-alta)',
  media: 'var(--color-dato-media)',
  baja: 'var(--color-dato-baja)',
};

/** Barra apilada, no un donut: tres segmentos cuyos valores pueden ser muy próximos (§5.3). */
export function PriorityChart({ datos }: PriorityChartProps) {
  const clipId = useId();
  const [vistaTabla, setVistaTabla] = useState(false);
  const [activo, setActivo] = useState<Prioridad | null>(null);

  const visibles = datos.filter((d) => d.valor > 0);
  const total = visibles.reduce((acc, d) => acc + d.valor, 0);
  const resumen = datos.map((d) => `${d.valor} ${d.etiqueta.toLowerCase()}`).join(', ');

  const huecos = Math.max(0, visibles.length - 1);
  const anchoDisponible = ANCHO_VIEWBOX - huecos * HUECO;

  const segmentos = visibles.reduce<Array<SegmentoPrioridad & { x: number; ancho: number }>>((acc, seg) => {
    const ancho = total === 0 ? 0 : (seg.valor / total) * anchoDisponible;
    const x = acc.length === 0 ? 0 : acc[acc.length - 1].x + acc[acc.length - 1].ancho + HUECO;
    return [...acc, { ...seg, x, ancho }];
  }, []);

  const segmentoActivo = segmentos.find((s) => s.prioridad === activo) ?? null;

  return (
    <figure>
      <div className="mb-3 flex items-center justify-between gap-2">
        <figcaption className="text-[14.5px] font-semibold text-ink">Pendientes por prioridad</figcaption>
        {total > 0 && (
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

      {total === 0 ? (
        <p className="text-sm text-ink-2">No hay tareas pendientes.</p>
      ) : vistaTabla ? (
        <TablaDatos
          caption="Pendientes por prioridad"
          columnas={['Prioridad', 'Tareas', 'Porcentaje']}
          filas={visibles.map((s) => [s.etiqueta, s.valor, `${Math.round((s.valor / total) * 100)}%`])}
        />
      ) : (
        <>
          <div className="relative py-1.5">
            <svg
              viewBox={`0 0 ${ANCHO_VIEWBOX} ${ALTURA}`}
              preserveAspectRatio="none"
              className="h-3 w-full overflow-visible"
              role="img"
              aria-label={`Pendientes por prioridad: ${resumen}`}
            >
              <defs>
                <clipPath id={clipId}>
                  <rect x={0} y={0} width={ANCHO_VIEWBOX} height={ALTURA} rx={RADIO} />
                </clipPath>
              </defs>
              <rect x={0} y={0} width={ANCHO_VIEWBOX} height={ALTURA} rx={RADIO} className="fill-surface-2" />
              <g clipPath={`url(#${clipId})`}>
                {segmentos.map((seg) => (
                  <rect key={seg.prioridad} x={seg.x} y={0} width={seg.ancho} height={ALTURA} style={{ fill: COLOR[seg.prioridad] }} />
                ))}
              </g>
            </svg>
            {/* Botones HTML reales (no rects SVG) para un foco de teclado fiable entre navegadores;
                área sensible más alta que la marca visible de 12px. */}
            {segmentos.map((seg) => (
              <button
                key={`hit-${seg.prioridad}`}
                type="button"
                aria-label={`${seg.etiqueta}: ${seg.valor} tareas, ${Math.round((seg.valor / total) * 100)} por ciento`}
                className="absolute inset-y-0 rounded-[6px]"
                style={{ left: `${(seg.x / ANCHO_VIEWBOX) * 100}%`, width: `${(seg.ancho / ANCHO_VIEWBOX) * 100}%` }}
                onMouseEnter={() => setActivo(seg.prioridad)}
                onMouseLeave={() => setActivo(null)}
                onFocus={() => setActivo(seg.prioridad)}
                onBlur={() => setActivo(null)}
              />
            ))}
            {segmentoActivo && (
              <ChartTooltip xPct={((segmentoActivo.x + segmentoActivo.ancho / 2) / ANCHO_VIEWBOX) * 100}>
                {segmentoActivo.etiqueta}: <span className="tabular font-medium">{segmentoActivo.valor}</span> (
                {Math.round((segmentoActivo.valor / total) * 100)}%)
              </ChartTooltip>
            )}
          </div>

          <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
            {visibles.map((seg) => (
              <li key={seg.prioridad} className="flex items-center gap-1.5 text-xs text-ink-2">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: COLOR[seg.prioridad] }} aria-hidden="true" />
                {seg.etiqueta}
                <span className="tabular font-medium text-ink">{seg.valor}</span>
                <span className="tabular">({Math.round((seg.valor / total) * 100)}%)</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </figure>
  );
}
