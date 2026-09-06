import { useState } from 'react';
import { Menu, Plus, Search, X } from 'lucide-react';
import { Button } from './ui/Button';
import { IconButton } from './ui/IconButton';
import { Input } from './ui/Input';

interface Props {
  tituloVista: string;
  total: number;
  busquedaInput: string;
  onBusquedaChange: (valor: string) => void;
  onAbrirMenu: () => void;
  onNuevaTarea: () => void;
}

export function TopBar({ tituloVista, total, busquedaInput, onBusquedaChange, onAbrirMenu, onNuevaTarea }: Props) {
  const [busquedaMovilAbierta, setBusquedaMovilAbierta] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-[68px] shrink-0 items-center gap-3 border-b border-line/60 bg-surface/60 px-4 backdrop-blur-xl oscuro:bg-surface/80 md:px-6">
      {busquedaMovilAbierta ? (
        <div className="flex flex-1 items-center gap-2 md:hidden">
          <Input
            icon={Search}
            placeholder="Buscar tareas…"
            value={busquedaInput}
            onChange={(e) => onBusquedaChange(e.target.value)}
            aria-label="Buscar tareas"
            autoFocus
            className="flex-1"
          />
          <IconButton
            icon={X}
            aria-label="Cerrar búsqueda"
            onClick={() => {
              setBusquedaMovilAbierta(false);
              onBusquedaChange('');
            }}
          />
        </div>
      ) : (
        <>
          <IconButton icon={Menu} aria-label="Abrir menú" className="lg:hidden" onClick={onAbrirMenu} />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-2xl font-semibold tracking-[-0.02em] text-ink">{tituloVista}</h1>
              <span className="tabular rounded-full bg-surface-2 px-2 py-0.5 text-xs text-ink-2">{total}</span>
            </div>
            <p className="text-[13.5px] text-ink-2">Organiza tu día, logra más.</p>
          </div>

          <div className="hidden w-[300px] shrink-0 md:block">
            <Input
              icon={Search}
              placeholder="Buscar tareas…"
              value={busquedaInput}
              onChange={(e) => onBusquedaChange(e.target.value)}
              aria-label="Buscar tareas"
              trailing={
                busquedaInput ? (
                  <IconButton icon={X} size="sm" aria-label="Limpiar búsqueda" onClick={() => onBusquedaChange('')} />
                ) : undefined
              }
            />
          </div>
          <IconButton
            icon={Search}
            aria-label="Buscar tareas"
            variant="secondary"
            className="md:hidden"
            onClick={() => setBusquedaMovilAbierta(true)}
          />

          <span className="hidden sm:inline-flex">
            <Button icon={Plus} onClick={onNuevaTarea}>
              Nueva tarea
            </Button>
          </span>
          <span className="sm:hidden">
            <IconButton icon={Plus} aria-label="Nueva tarea" onClick={onNuevaTarea} variant="secondary" />
          </span>
        </>
      )}
    </header>
  );
}
