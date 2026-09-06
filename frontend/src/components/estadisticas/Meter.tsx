interface MeterProps {
  /** Porcentaje 0-100, o `null` con 0 tareas (se muestra "—"). */
  valor: number | null;
}

/** Ratio contra un límite → medidor, no un donut de dos porciones (§5.3 de frontend-features.md). */
export function Meter({ valor }: MeterProps) {
  return (
    <figure>
      <figcaption className="mb-3 text-[14.5px] font-semibold text-ink">Tasa de finalización</figcaption>
      <div className="flex items-center gap-3">
        <div
          className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2"
          role="progressbar"
          aria-valuenow={valor ?? undefined}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Tasa de finalización: ${valor === null ? 'sin datos' : `${valor} por ciento`}`}
        >
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-300"
            style={{ width: `${valor ?? 0}%` }}
          />
        </div>
        <span className="tabular w-12 shrink-0 text-right text-sm font-semibold text-ink">
          {valor === null ? '—' : `${valor}%`}
        </span>
      </div>
    </figure>
  );
}
