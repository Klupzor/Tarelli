import { useEffect, useRef } from 'react';
import type { FocusEvent, ReactNode, RefObject } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';

interface PopoverProps {
  abierto: boolean;
  onCerrar: () => void;
  disparadorRef: RefObject<HTMLElement | null>;
  children: ReactNode;
  titulo: string;
  className?: string;
}

const FOCUSABLE_SELECTOR = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const MEDIA_QUERY_MD = '(min-width: 768px)';

export function Popover({ abierto, onCerrar, disparadorRef, children, titulo, className = '' }: PopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!abierto) return undefined;

    function posicionar() {
      if (!panelRef.current || !window.matchMedia(MEDIA_QUERY_MD).matches) return;
      const rect = disparadorRef.current?.getBoundingClientRect();
      if (!rect) return;
      panelRef.current.style.top = `${rect.bottom + 8}px`;
      panelRef.current.style.right = `${Math.max(16, window.innerWidth - rect.right)}px`;
    }

    posicionar();
    window.addEventListener('resize', posicionar);

    function onMouseDown(e: MouseEvent) {
      const objetivo = e.target as Node;
      if (panelRef.current?.contains(objetivo) || disparadorRef.current?.contains(objetivo)) return;
      onCerrar();
    }
    document.addEventListener('mousedown', onMouseDown);

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCerrar();
    }
    document.addEventListener('keydown', onKeyDown);

    const overflowPrevio = document.body.style.overflow;
    const esMovil = !window.matchMedia(MEDIA_QUERY_MD).matches;
    if (esMovil) document.body.style.overflow = 'hidden';

    const frame = requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus();
    });

    return () => {
      window.removeEventListener('resize', posicionar);
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflowPrevio;
      cancelAnimationFrame(frame);
      if (disparadorRef.current instanceof HTMLElement) disparadorRef.current.focus();
    };
  }, [abierto, disparadorRef, onCerrar]);

  function onBlurCapture(e: FocusEvent<HTMLDivElement>) {
    const siguiente = e.relatedTarget as Node | null;
    if (siguiente && (panelRef.current?.contains(siguiente) || disparadorRef.current?.contains(siguiente))) return;
    onCerrar();
  }

  return createPortal(
    <AnimatePresence>
      {abierto && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-[2px] md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.16 }}
            onClick={onCerrar}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-label={titulo}
            onBlurCapture={onBlurCapture}
            initial={{ opacity: 0, y: reducedMotion ? 0 : 8, scale: reducedMotion ? 1 : 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reducedMotion ? 0 : 8, scale: reducedMotion ? 1 : 0.98 }}
            transition={{ duration: reducedMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
            className={`fixed z-50 rounded-modal border border-line/70 bg-surface/95 p-4 shadow-modal backdrop-blur-xl max-md:inset-x-0 max-md:top-auto! max-md:right-auto! max-md:bottom-0 max-md:rounded-b-none md:w-80 ${className}`}
          >
            <div className="mb-3 flex items-center justify-between md:hidden">
              <span className="text-sm font-semibold text-ink">{titulo}</span>
              <IconButton icon={X} size="sm" aria-label="Cerrar" onClick={onCerrar} />
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
