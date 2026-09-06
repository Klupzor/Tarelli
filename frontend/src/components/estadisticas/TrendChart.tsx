import { useState } from 'react';
import type { MouseEvent } from 'react';
import { Table2 } from 'lucide-react';
import type { PuntoTendencia } from '../../utils/estadisticas';
import { IconButton } from '../ui/IconButton';
import { ChartTooltip } from './ChartTooltip';
import { TablaDatos } from './TablaDatos';

interface TrendChartProps {
  datos: PuntoTendencia[];
}

const ANCHO = 600;
const ALTO = 160;
const PADDING = 8;

/** Una sola serie no necesita leyenda: el título de la tarjeta la nombra (§5.3). */
export function TrendChart({ datos }: TrendChartProps) {
  const [vistaTabla, setVistaTabla] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

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

  function onMouseMove(e: MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    setHoverIndex(Math.round(pct * (datos.length - 1)));
  }

  const puntoActivo = hoverIndex === null ? null : datos[hoverIndex];
  const xPctActivo = hoverIndex === null ? 0 : (hoverIndex / Math.max(1, datos.length - 1)) * 100;

  return (
    <figure>
      <div className="mb-3 flex items-center justify-between gap-2">
        <figcaption className="text-[14.5px] font-semibold text-ink">Completadas por semana (12 semanas)</figcaption>
        <IconButton
          icon={Table2}
          size="sm"
          variant={vistaTabla ? 'secondary' : 'ghost'}
          aria-label={vistaTabla ? 'Mostrar gráfica' : 'Mostrar tabla de datos'}
          aria-pressed={vistaTabla}
          onClick={() => setVistaTabla((v) => !v)}
        />
      </div>

      {vistaTabla ? (
        <TablaDatos
          caption="Completadas por semana, últimas 12 semanas"
          columnas={['Semana de', 'Completadas']}
          filas={datos.map((d) => [d.etiqueta, d.valor])}
        />
      ) : (
        <>
          <div className="relative">
            <svg
              viewBox={`0 0 ${ANCHO} ${ALTO}`}
              preserveAspectRatio="none"
              className="h-40 w-full"
              role="img"
              aria-label={`Tareas completadas en las últimas 12 semanas: ${resumen}`}
              onMouseMove={onMouseMove}
              onMouseLeave={() => setHoverIndex(null)}
            >
              {lineasRejilla.map((y) => (
                <line key={y} x1={PADDING} x2={ANCHO - PADDING} y1={y} y2={y} stroke="var(--color-grid)" strokeWidth={1} />
              ))}
              <path d={areaPath} style={{ fill: 'var(--color-dato-serie)', opacity: 0.12 }} stroke="none" />
              <path d={lineaPath} style={{ stroke: 'var(--color-dato-serie)', strokeWidth: 2, fill: 'none' }} />
              {hoverIndex !== null && (
                <>
                  <line
                    x1={puntos[hoverIndex].x}
                    x2={puntos[hoverIndex].x}
                    y1={PADDING}
                    y2={ALTO - PADDING}
                    stroke="var(--color-line-strong)"
                    strokeWidth={1}
                  />
                  <circle cx={puntos[hoverIndex].x} cy={puntos[hoverIndex].y} r={4} style={{ fill: 'var(--color-dato-serie)' }} />
                </>
              )}
            </svg>

            {/* Objetivos de foco por teclado: uno por semana, invisibles, para navegar con Tab. */}
            {datos.map((d, i) => (
              <button
                key={d.fecha}
                type="button"
                tabIndex={0}
                aria-label={`${d.etiqueta}: ${d.valor} tareas completadas`}
                className="absolute top-0 h-full w-px -translate-x-1/2 opacity-0"
                style={{ left: `${(i / Math.max(1, datos.length - 1)) * 100}%` }}
                onFocus={() => setHoverIndex(i)}
                onBlur={() => setHoverIndex(null)}
              />
            ))}

            {puntoActivo && (
              <ChartTooltip xPct={xPctActivo}>
                {puntoActivo.etiqueta}: <span className="tabular font-medium">{puntoActivo.valor}</span>
              </ChartTooltip>
            )}
          </div>
          <div className="mt-1 flex justify-between px-1">
            {datos.map((d, i) => (
              <span key={d.fecha} className={`tabular text-[10px] text-ink-3 ${i % 3 === 0 ? '' : 'invisible'}`}>
                {d.etiqueta}
              </span>
            ))}
          </div>
        </>
      )}
    </figure>
  );
}
