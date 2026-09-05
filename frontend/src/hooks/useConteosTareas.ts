import { useCallback, useEffect, useState } from 'react';
import { tareasApi } from '../api/tareas';

export interface ConteosTareas {
  hoy: number;
  proximas: number;
  completadas: number;
}

const CONTEOS_INICIALES: ConteosTareas = { hoy: 0, proximas: 0, completadas: 0 };

function fechaISO(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

/** Rangos usados por los atajos "Hoy" / "Próximas" del sidebar. */
export function rangoHoy(): { desde: string; hasta: string } {
  const hoy = fechaISO(new Date());
  return { desde: hoy, hasta: hoy };
}

export function rangoProximas(): { desde: string; hasta: string } {
  const unDiaMs = 24 * 60 * 60 * 1000;
  return {
    desde: fechaISO(new Date(Date.now() + unDiaMs)),
    hasta: fechaISO(new Date(Date.now() + 7 * unDiaMs)),
  };
}

/**
 * Conteos para los atajos del sidebar (Hoy/Próximas/Completadas). Usa el
 * mismo endpoint GET /api/tareas con limit=1: solo interesa `meta.total`.
 */
export function useConteosTareas() {
  const [conteos, setConteos] = useState<ConteosTareas>(CONTEOS_INICIALES);

  const recargarConteos = useCallback(async () => {
    const hoy = rangoHoy();
    const proximas = rangoProximas();
    try {
      const [resHoy, resProximas, resCompletadas] = await Promise.all([
        tareasApi.listar({
          completada: false,
          fecha_vencimiento_desde: hoy.desde,
          fecha_vencimiento_hasta: hoy.hasta,
          limit: 1,
        }),
        tareasApi.listar({
          completada: false,
          fecha_vencimiento_desde: proximas.desde,
          fecha_vencimiento_hasta: proximas.hasta,
          limit: 1,
        }),
        tareasApi.listar({ completada: true, limit: 1 }),
      ]);
      setConteos({
        hoy: resHoy.meta.total,
        proximas: resProximas.meta.total,
        completadas: resCompletadas.meta.total,
      });
    } catch {
      // Los contadores son solo informativos: si fallan, se conservan los últimos valores conocidos.
    }
  }, []);

  useEffect(() => {
    recargarConteos();
  }, [recargarConteos]);

  return { conteos, recargarConteos };
}
