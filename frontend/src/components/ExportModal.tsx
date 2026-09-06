import { useState } from 'react';
import { Download, RotateCw } from 'lucide-react';
import type { TareasFiltro } from '../types';
import { useTodasLasTareas } from '../hooks/useTodasLasTareas';
import { hoyEnZona } from '../utils/fechas';
import { aCSV, aJSON, filtrosActivos } from '../utils/exportar';
import { descargarArchivo } from '../utils/descargar';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { SegmentedControl } from './ui/SegmentedControl';
import { useToast } from './ui/Toast';

type FormatoExportacion = 'csv' | 'json';

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  filtro: TareasFiltro;
  hayFiltrosActivos: boolean;
  timezone: string;
}

export function ExportModal({ abierto, onCerrar, filtro, hayFiltrosActivos, timezone }: Props) {
  const { mostrarToast } = useToast();
  const [formato, setFormato] = useState<FormatoExportacion>('csv');
  const { tareas, cargando, error, truncado, recargar } = useTodasLasTareas(filtro, abierto);

  function handleDescargar() {
    const nombreBase = `tarelli-tareas-${hoyEnZona(timezone)}`;
    if (formato === 'csv') {
      descargarArchivo(aCSV(tareas), `${nombreBase}.csv`, 'text/csv');
    } else {
      descargarArchivo(
        aJSON(tareas, { truncado, filtros: filtrosActivos(filtro) }),
        `${nombreBase}.json`,
        'application/json',
      );
    }
    mostrarToast({ tono: 'ok', mensaje: `Se descargaron ${tareas.length} tareas.` });
    onCerrar();
  }

  let textoAlcance: string;
  if (truncado) {
    textoAlcance = 'Se exportarán las primeras 1000 tareas.';
  } else if (!hayFiltrosActivos) {
    textoAlcance = `Se exportarán ${tareas.length} tareas (todas).`;
  } else {
    textoAlcance = `Se exportarán ${tareas.length} tareas con los filtros actuales.`;
  }

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Exportar tareas"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button
            icon={Download}
            loading={cargando}
            disabled={!cargando && (Boolean(error) || tareas.length === 0)}
            onClick={handleDescargar}
          >
            {!cargando && tareas.length === 0 ? 'No hay tareas que exportar' : 'Descargar'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Formato</span>
          <SegmentedControl
            aria-label="Formato de exportación"
            layoutId="export-formato-segmento"
            opciones={[
              { valor: 'csv', etiqueta: 'CSV' },
              { valor: 'json', etiqueta: 'JSON' },
            ]}
            valor={formato}
            onChange={setFormato}
          />
        </div>

        {error ? (
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-danger">{error}</p>
            <Button variant="secondary" size="sm" icon={RotateCw} onClick={recargar}>
              Reintentar
            </Button>
          </div>
        ) : (
          <p className="text-sm text-ink-2">{textoAlcance}</p>
        )}
      </div>
    </Modal>
  );
}
