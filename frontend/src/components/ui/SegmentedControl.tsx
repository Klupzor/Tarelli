import { useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface OpcionSegmentada<T extends string> {
  valor: T;
  etiqueta: string;
  /** Color de fondo del segmento cuando está activo (por defecto `bg-surface`). */
  colorFondoActivo?: string;
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
        return (
          <button
            key={opcion.valor}
            type="button"
            role="radio"
            aria-checked={activo}
            tabIndex={activo ? 0 : -1}
            onClick={() => onChange(opcion.valor)}
            className={`relative h-7 rounded-[6px] px-3 text-[13px] font-medium transition-colors duration-120 ${
              activo ? 'text-ink' : 'text-ink-2 hover:text-ink'
            }`}
          >
            {activo && (
              <motion.span
                layoutId={layoutId}
                className={`absolute inset-0 rounded-[6px] shadow-xs ${opcion.colorFondoActivo ?? 'bg-surface'}`}
                transition={{ duration: reducedMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
              />
            )}
            <span className="relative">{opcion.etiqueta}</span>
          </button>
        );
      })}
    </div>
  );
}
