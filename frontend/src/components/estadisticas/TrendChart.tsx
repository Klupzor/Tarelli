import type { PuntoTendencia } from '../../utils/estadisticas';

interface TrendChartProps {
  datos: PuntoTendencia[];
}

const ANCHO = 600;
const ALTO = 160;
const PADDING = 8;

/** Una sola serie no necesita leyenda: el título de la tarjeta la nombra (§5.3). */
export function TrendChart({ datos }: TrendChartProps) {
  const max = Math.max(1, ...datos.map((d) => d.valor));
  const techo = Math.max(1, Math.ceil(max * 1.2));

  const escalaX = (i: number) => PADDING + (ANCHO - PADDING * 2) * (i / Math.max(1, datos.length - 1));
  const escalaY = (valor: number) => PADDING + (ALTO - PADDING * 2) * (1 - valor / techo);

  const puntos = datos.map((d, i) => ({ x: escalaX(i), y: escalaY(d.valor) }));
  const lineaPath = puntos.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath =
    puntos.length > 0
      ? `${lineaPath} L ${puntos[puntos.length - 1].x} ${ALTO - PADDING} L ${puntos[0].x} ${ALTO - PADDING} Z`
      : '';

  const lineasRejilla = [0, 0.25, 0.5, 0.75, 1].map((f) => PADDING + (ALTO - PADDING * 2) * f);
  const resumen = datos.map((d) => `${d.etiqueta} ${d.valor}`).join(', ');

  return (
    <figure>
      <figcaption className="mb-3 text-[14.5px] font-semibold text-ink">Completadas por semana (12 semanas)</figcaption>
      <svg
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        preserveAspectRatio="none"
        className="h-40 w-full"
        role="img"
        aria-label={`Tareas completadas en las últimas 12 semanas: ${resumen}`}
      >
        {lineasRejilla.map((y) => (
          <line key={y} x1={PADDING} x2={ANCHO - PADDING} y1={y} y2={y} stroke="var(--color-grid)" strokeWidth={1} />
        ))}
        <path d={areaPath} style={{ fill: 'var(--color-dato-serie)', opacity: 0.12 }} stroke="none" />
        <path d={lineaPath} style={{ stroke: 'var(--color-dato-serie)', strokeWidth: 2, fill: 'none' }} />
      </svg>
      <div className="mt-1 flex justify-between px-1">
        {datos.map((d, i) => (
          <span key={d.fecha} className={`tabular text-[10px] text-ink-3 ${i % 3 === 0 ? '' : 'invisible'}`}>
            {d.etiqueta}
          </span>
        ))}
      </div>
    </figure>
  );
}
