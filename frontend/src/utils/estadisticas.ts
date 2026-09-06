import type { Tarea } from '../types';

export interface ResumenEstadisticas {
  total: number;
  completadas: number;
  pendientes: number;
  vencidas: number;
  vencenHoy: number;
  /** `null` con 0 tareas: se muestra "—", nunca `NaN` ni `0 %`. */
  tasaFinalizacion: number | null;
  completadasEstaSemana: number;
}

const SIETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Todas las cifras se derivan del mismo array `tareas` para que siempre
 * cuadren entre sí (p. ej. completadas + pendientes === total), incluso si
 * `tareas` está truncado a las primeras 1000 (ver `useTodasLasTareas`).
 */
export function calcularResumen(tareas: Tarea[], hoy: string): ResumenEstadisticas {
  const total = tareas.length;
  const completadas = tareas.filter((t) => t.completada).length;
  const pendientes = total - completadas;
  const vencidas = tareas.filter(
    (t) => !t.completada && t.fecha_vencimiento !== null && t.fecha_vencimiento.slice(0, 10) < hoy,
  ).length;
  const vencenHoy = tareas.filter(
    (t) => !t.completada && t.fecha_vencimiento !== null && t.fecha_vencimiento.slice(0, 10) === hoy,
  ).length;

  const limiteSemana = Date.now() - SIETE_DIAS_MS;
  const completadasEstaSemana = tareas.filter(
    (t) => t.completada && t.completado_en !== null && new Date(t.completado_en).getTime() >= limiteSemana,
  ).length;

  return {
    total,
    completadas,
    pendientes,
    vencidas,
    vencenHoy,
    tasaFinalizacion: total === 0 ? null : Math.round((completadas / total) * 100),
    completadasEstaSemana,
  };
}
