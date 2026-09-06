import type { BarraCategoria } from '../../utils/estadisticas';

interface CategoryChartProps {
  datos: BarraCategoria[];
}

const ALTURA_BARRA = 10;

/** Comparación de magnitud, un solo color: la identidad la dan las etiquetas del eje (§5.3). */
export function CategoryChart({ datos }: CategoryChartProps) {
  if (datos.length === 0) {
    return (
      <figure>
        <figcaption className="mb-3 text-[14.5px] font-semibold text-ink">Pendientes por categoría</figcaption>
        <p className="text-sm text-ink-2">No hay tareas pendientes con categoría.</p>
      </figure>
    );
  }

  const max = Math.max(...datos.map((d) => d.valor));
  const resumen = datos.map((d) => `${d.nombre} ${d.valor}`).join(', ');

  return (
    <figure>
      <figcaption className="mb-3 text-[14.5px] font-semibold text-ink">Pendientes por categoría</figcaption>
      <div role="img" aria-label={`Pendientes por categoría: ${resumen}`} className="flex flex-col gap-3">
        {datos.map((cat) => (
          <div key={cat.categoriaId ?? 'otras'} className="flex flex-col gap-1">
            <span className="truncate text-xs text-ink-2">{cat.nombre}</span>
            <div className="flex items-center gap-2">
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
            </div>
          </div>
        ))}
      </div>
    </figure>
  );
}
