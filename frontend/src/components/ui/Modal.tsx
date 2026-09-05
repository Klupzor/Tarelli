import { useCallback, useEffect, useId, useRef } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';

type ModalSize = 'sm' | 'md' | 'lg';

interface ModalProps {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  id?: string;
  titleId?: string;
}

const SIZE_STYLES: Record<ModalSize, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ abierto, onCerrar, titulo, children, footer, size = 'md', id, titleId }: ModalProps) {
  const tituloIdGenerado = useId();
  const tituloId = titleId ?? tituloIdGenerado;
  const panelRef = useRef<HTMLDivElement>(null);
  const disparadorRef = useRef<Element | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!abierto) return undefined;

    disparadorRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const frame = requestAnimationFrame(() => {
      const primerCampo = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      primerCampo?.focus();
    });

    return () => {
      document.body.style.overflow = previousOverflow;
      cancelAnimationFrame(frame);
      if (disparadorRef.current instanceof HTMLElement) {
        disparadorRef.current.focus();
      }
    };
  }, [abierto]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCerrar();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;

      const focusables = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusables.length === 0) return;

      const primero = focusables[0];
      const ultimo = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    },
    [onCerrar],
  );

  return createPortal(
    <AnimatePresence>
      {abierto && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          initial="closed"
          animate="open"
          exit="closed"
          onKeyDown={handleKeyDown}
        >
          <motion.div
            className="absolute inset-0 bg-ink/20 backdrop-blur-[2px]"
            variants={{ open: { opacity: 1 }, closed: { opacity: 0 } }}
            transition={{ duration: reducedMotion ? 0 : 0.16 }}
            onClick={onCerrar}
            aria-hidden="true"
          />

          <motion.div
            ref={panelRef}
            id={id}
            role="dialog"
            aria-modal="true"
            aria-labelledby={tituloId}
            className={`relative flex max-h-[90vh] w-full flex-col overflow-y-auto rounded-t-modal bg-surface shadow-modal sm:m-4 sm:w-full sm:rounded-modal ${SIZE_STYLES[size]}`}
            variants={{
              open: { opacity: 1, y: 0, scale: 1 },
              closed: { opacity: 0, y: reducedMotion ? 0 : 24, scale: reducedMotion ? 1 : 0.98 },
            }}
            transition={{ duration: reducedMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <h2 id={tituloId} className="text-[17px] font-semibold leading-tight tracking-[-0.01em] text-ink">
                {titulo}
              </h2>
              <IconButton icon={X} aria-label="Cerrar" onClick={onCerrar} />
            </div>

            <div className="flex-1 px-6 py-6">{children}</div>

            {footer && <div className="flex justify-end gap-2 border-t border-line px-6 py-4">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
