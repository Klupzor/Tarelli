import { useId } from 'react';
import type { Prioridad } from '../../types';
import type { SegmentoPrioridad } from '../../utils/estadisticas';

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

  return (
    <figure>
      <figcaption className="mb-3 text-[14.5px] font-semibold text-ink">Pendientes por prioridad</figcaption>
      {total === 0 ? (
        <p className="text-sm text-ink-2">No hay tareas pendientes.</p>
      ) : (
        <>
          <svg
            viewBox={`0 0 ${ANCHO_VIEWBOX} ${ALTURA}`}
            preserveAspectRatio="none"
            className="h-3 w-full"
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
