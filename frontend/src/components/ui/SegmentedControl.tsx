import { useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { LucideIcon } from 'lucide-react';

interface OpcionSegmentada<T extends string> {
  valor: T;
  etiqueta: string;
  /** Color de fondo del segmento cuando está activo (por defecto `bg-surface`). */
  colorFondoActivo?: string;
  /** Si se define, el segmento muestra solo el icono; `etiqueta` pasa a ser su aria-label/title. */
  icono?: LucideIcon;
}

interface SegmentedControlProps<T extends string> {
  opciones: OpcionSegmentada<T>[];
  valor: T;
  onChange: (valor: T) => void;
  /** Único por instancia en pantalla: motion usa `layoutId` para animar el indicador. */
  layoutId: string;
  className?: string;
  'aria-label': string;
}

export function SegmentedControl<T extends string>({
  opciones,
  valor,
  onChange,
  layoutId,
  className = '',
  'aria-label': ariaLabel,
}: SegmentedControlProps<T>) {
  const reducedMotion = useReducedMotion();
  const contenedorRef = useRef<HTMLDivElement>(null);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const indiceActual = opciones.findIndex((o) => o.valor === valor);
    let siguiente: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') siguiente = (indiceActual + 1) % opciones.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      siguiente = (indiceActual - 1 + opciones.length) % opciones.length;
    } else if (e.key === 'Home') siguiente = 0;
    else if (e.key === 'End') siguiente = opciones.length - 1;

    if (siguiente === null) return;
    e.preventDefault();
    onChange(opciones[siguiente].valor);
    const botones = contenedorRef.current?.querySelectorAll<HTMLButtonElement>('button');
    botones?.[siguiente]?.focus();
  }

  return (
    <div
      ref={contenedorRef}
      role="radiogroup"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className={`inline-flex h-8 shrink-0 items-center rounded-field bg-surface/60 backdrop-blur p-0.5 ${className}`}
    >
      {opciones.map((opcion) => {
        const activo = opcion.valor === valor;
        const Icono = opcion.icono;
        return (
          <button
            key={opcion.valor}
            type="button"
            role="radio"
            aria-checked={activo}
            aria-label={Icono ? opcion.etiqueta : undefined}
            title={Icono ? opcion.etiqueta : undefined}
            tabIndex={activo ? 0 : -1}
            onClick={() => onChange(opcion.valor)}
            className={`relative flex h-7 items-center justify-center rounded-[6px] text-[13px] font-medium transition-colors duration-120 ${
              Icono ? 'w-8' : 'px-3'
            } ${activo ? 'text-ink' : 'text-ink-2 hover:text-ink'}`}
          >
            {activo && (
              <motion.span
                layoutId={layoutId}
                className={`absolute inset-0 rounded-[6px] shadow-xs ${opcion.colorFondoActivo ?? 'bg-surface'}`}
                transition={{ duration: reducedMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
              />
            )}
            <span className="relative flex items-center justify-center">
              {Icono ? <Icono size={14} strokeWidth={1.75} aria-hidden="true" /> : opcion.etiqueta}
            </span>
          </button>
        );
      })}
    </div>
  );
}
