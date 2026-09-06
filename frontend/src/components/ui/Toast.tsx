import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AlertTriangle, Check, Info, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { IconButton } from './IconButton';

type ToastTone = 'brand' | 'danger' | 'ok' | 'neutral';

interface ToastInput {
  tono?: ToastTone;
  mensaje: string;
}

interface ToastItem {
  id: number;
  tono: ToastTone;
  mensaje: string;
}

interface ToastContextValue {
  mostrarToast: (input: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONO: Record<ToastTone, LucideIcon> = {
  brand: Info,
  danger: AlertTriangle,
  ok: Check,
  neutral: Info,
};

const COLOR: Record<ToastTone, string> = {
  brand: 'border-brand-line bg-surface text-ink',
  danger: 'border-danger-line bg-danger-soft text-danger',
  ok: 'border-ok-line bg-ok-soft text-ok',
  neutral: 'border-line bg-surface text-ink',
};

const DURACION_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  const reducedMotion = useReducedMotion();

  const ocultarToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const mostrarToast = useCallback(
    ({ tono = 'neutral', mensaje }: ToastInput) => {
      const id = idRef.current++;
      setToasts((prev) => [...prev, { id, tono, mensaje }]);
      setTimeout(() => ocultarToast(id), DURACION_MS);
    },
    [ocultarToast],
  );

  const value = useMemo<ToastContextValue>(() => ({ mostrarToast }), [mostrarToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end">
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icono = ICONO[toast.tono];
            return (
              <motion.div
                key={toast.id}
                role="status"
                aria-live="polite"
                initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reducedMotion ? 0 : 8 }}
                transition={{ duration: reducedMotion ? 0 : 0.18 }}
                className={`pointer-events-auto flex w-full max-w-sm items-start gap-2 rounded-card border px-4 py-3 text-sm shadow-md ${COLOR[toast.tono]}`}
              >
                <Icono size={16} strokeWidth={1.75} className="mt-0.5 shrink-0" aria-hidden="true" />
                <p className="flex-1">{toast.mensaje}</p>
                <IconButton icon={X} size="sm" aria-label="Cerrar notificación" onClick={() => ocultarToast(toast.id)} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>.');
  return ctx;
}
